import { db } from './firebase';

export interface User {
    id: string;
    username: string;
    password?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Question {
    id: string;
    text: string;
    options: string; // JSON string of options array
    correct: number; // Index of correct option
    timeLimit: number;
    mediaUrl?: string;
}

export interface Game {
    id: string;
    title: string;
    hostId: string;
    status: string; // WAITING, PLAYING, FINISHED
    questions: Question[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Session {
    id?: string;
    gameId: string;
    hostId: string;
    roomCode: string;
    startedAt: string;
    endedAt: string;
    players: any[];
    stats: any;
}

/**
 * Unified Database Service Abstraction
 * Currently powered by Firebase/Firestore.
 * You can switch this entire implementation to any other database service in this file.
 */
export const DatabaseService = {
    // --- USER METHODS ---

    /**
     * Fetch user by their username
     */
    async getUserByUsername(username: string): Promise<User | null> {
        try {
            const snapshot = await db.collection('users').where('username', '==', username).limit(1).get();
            if (snapshot.empty) return null;
            
            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            } as User;
        } catch (error) {
            console.error('DatabaseService.getUserByUsername error:', error);
            throw new Error('Database fetch failed');
        }
    },

    /**
     * Create a new user
     */
    async createUser(username: string, passwordHash: string): Promise<User> {
        try {
            const newUserRef = await db.collection('users').add({
                username,
                password: passwordHash,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return {
                id: newUserRef.id,
                username
            };
        } catch (error) {
            console.error('DatabaseService.createUser error:', error);
            throw new Error('Database insert failed');
        }
    },

    /**
     * Fetch user and all their games/quizzes
     */
    async getUserWithGames(userId: string): Promise<{ id: string; username: string; games: any[] } | null> {
        try {
            // Get user
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) return null;

            const userData = userDoc.data();
            if (!userData) return null;

            // Get games hosted by this user
            const gamesSnapshot = await db.collection('games')
                .where('hostId', '==', userId)
                .get();

            const games = gamesSnapshot.docs.map(doc => {
                const gameData = doc.data();
                return {
                    id: doc.id,
                    ...gameData,
                    _count: {
                        questions: (gameData.questions || []).length
                    }
                };
            }).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            return {
                id: userDoc.id,
                username: userData.username,
                games
            };
        } catch (error) {
            console.error('DatabaseService.getUserWithGames error:', error);
            throw new Error('Database user and games fetch failed');
        }
    },

    // --- GAME / QUIZ METHODS ---

    /**
     * Create a new quiz/game with nested questions
     */
    async createGame(title: string, hostId: string, questions: any[]): Promise<string> {
        try {
            const formattedQuestions = questions.map((q, idx) => ({
                id: (idx + 1).toString(),
                text: q.text,
                options: typeof q.options === 'string' ? q.options : JSON.stringify(q.answers),
                correct: q.correct !== undefined ? q.correct : q.correctAnswer,
                timeLimit: parseInt(q.timeLimit) || 20,
                type: q.type || 'MULTIPLE_CHOICE',
                mediaUrl: q.mediaUrl || ''
            }));

            const gameRef = await db.collection('games').add({
                title,
                hostId,
                status: 'WAITING',
                questions: formattedQuestions,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return gameRef.id;
        } catch (error) {
            console.error('DatabaseService.createGame error:', error);
            throw new Error('Database game creation failed');
        }
    },

    /**
     * Retrieve a game/quiz by ID
     */
    async getGame(id: string): Promise<Game | null> {
        try {
            const doc = await db.collection('games').doc(id).get();
            if (!doc.exists) return null;

            const data = doc.data();
            if (!data) return null;

            return {
                id: doc.id,
                title: data.title,
                hostId: data.hostId,
                status: data.status || 'WAITING',
                questions: data.questions || [],
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
            } as Game;
        } catch (error) {
            console.error('DatabaseService.getGame error:', error);
            throw new Error('Database fetch game failed');
        }
    },

    /**
     * Update an existing game/quiz
     */
    async updateGame(id: string, title: string, questions: any[]): Promise<void> {
        try {
            const formattedQuestions = questions.map((q, idx) => ({
                id: (idx + 1).toString(),
                text: q.text,
                options: typeof q.options === 'string' ? q.options : JSON.stringify(q.answers),
                correct: q.correct !== undefined ? q.correct : q.correctAnswer,
                timeLimit: parseInt(q.timeLimit) || 20,
                type: q.type || 'MULTIPLE_CHOICE',
                mediaUrl: q.mediaUrl || ''
            }));

            await db.collection('games').doc(id).update({
                title,
                questions: formattedQuestions,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('DatabaseService.updateGame error:', error);
            throw new Error('Database update game failed');
        }
    },

    /**
     * Delete an existing game
     */
    async deleteGame(id: string): Promise<void> {
        try {
            await db.collection('games').doc(id).delete();
        } catch (error) {
            console.error('DatabaseService.deleteGame error:', error);
            throw new Error('Database delete game failed');
        }
    },

    // --- ANALYTICS / SESSION METHODS ---

    /**
     * Save a completed game session
     */
    async saveSession(sessionData: Session): Promise<string> {
        try {
            const docRef = await db.collection('sessions').add({
                ...sessionData,
                createdAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error('DatabaseService.saveSession error:', error);
            throw new Error('Database save session failed');
        }
    },

    /**
     * Fetch all past sessions for a specific host
     */
    async getHostSessions(hostId: string): Promise<Session[]> {
        try {
            const snapshot = await db.collection('sessions')
                .where('hostId', '==', hostId)
                .orderBy('endedAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Session[];
        } catch (error) {
            console.error('DatabaseService.getHostSessions error:', error);
            return [];
        }
    }
};
