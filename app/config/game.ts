export const GAME_CONFIG = {
    // Timers (in seconds)
    TIMERS: {
        READING_PHASE: 5,
        ANSWERING_PHASE: 15,
        RESULT_PHASE: 5,
    },

    // Scoring
    SCORING: {
        BASE_POINTS: 500,
        MAX_TIME_BONUS: 500,
        STREAK_BONUS: 100,
        MAX_STREAK_BONUS: 500
    },

    // Game Settings
    ROOM_CODE_LENGTH: 6,
    MAX_PLAYERS: 100,

    // Visuals
    COLORS: [
        'bg-rose-500',
        'bg-blue-500',
        'bg-amber-500',
        'bg-emerald-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-cyan-500',
        'bg-orange-500'
    ],

    // Animation Settings
    FLOATING: {
        MIN_SIZE: 80,
        MAX_SIZE: 140,
        MIN_SPEED: 0.2,
        MAX_SPEED: 1.5
    }
}
