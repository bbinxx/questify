import { createHash } from 'node:crypto';
import { persistSession } from './firebase-admin';
import { db } from './firebase';
import { publishPresentation, loadPublishedGame } from './presentations';
import type { Activity } from './activities/types';

export interface User {
    id: string;
    username: string;
    password?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type Question = Activity;

export interface Game {
    id: string;
    title: string;
    hostId: string;
    versionId?: string | null;
    schemaVersion?: number;
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
    async getUserById(userId: string): Promise<User | null> {
        const doc = await db.collection('users').doc(userId).get();
        return doc.exists ? { ...doc.data(), id: doc.id } as User : null;
    },
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
        const usernameKey = createHash('sha256').update(username).digest('hex');
        const reservation = db.collection('usernames').doc(usernameKey);
        const user = db.collection('users').doc();
        return db.runTransaction(async transaction => {
            const existing = await transaction.get(reservation);
            if (existing.exists) throw new Error('Username already exists');
            transaction.create(reservation, { userId: user.id });
            transaction.create(user, { username, password: passwordHash,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            return { id: user.id, username };
        });
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
        return publishPresentation(db, { title, hostId, questions });
    },

    /**
     * Retrieve a game/quiz by ID
     */
    async getGame(id: string): Promise<Game | null> {
        const published = await loadPublishedGame(db, id);
        return published ? { ...published, status: published.status || 'WAITING' } as Game : null;
    },

    /**
     * Update an existing game/quiz
     */
    async updateGame(id: string, title: string, questions: any[], hostId: string): Promise<void> {
        await publishPresentation(db, { gameId: id, title, hostId, questions });
    },

    /**
     * Delete an existing game
     */
    async deleteGame(id: string): Promise<void> {
        try {
            await db.recursiveDelete(db.collection('games').doc(id));
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
        return persistSession(sessionData);
    },

    /**
     * Fetch all past sessions for a specific host
     */
    async getHostSessions(hostId: string): Promise<Session[]> {
        try {
            const snapshot = await db.collection('sessions')
                .where('hostId', '==', hostId)
                .get();

            return (snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Session[])
                .sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt));
        } catch (error) {
            console.error('DatabaseService.getHostSessions error:', error);
            throw new Error('Could not load session analytics');
        }
    }
};
