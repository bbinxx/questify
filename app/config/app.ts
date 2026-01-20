export const APP_CONFIG = {
    theme: {
        colors: {
            primary: {
                DEFAULT: '6366f1', // Indigo 500
                hover: '4f46e5', // Indigo 600
                light: 'e0e7ff', // Indigo 100
                dark: '312e81', // Indigo 900
            },
            secondary: {
                DEFAULT: 'f43f5e', // Rose 500
                hover: 'e11d48', // Rose 600
            },
            background: {
                light: 'f8fafc', // Slate 50
                dark: '0f172a', // Slate 900
            }
        },
        animations: {
            hover: 'transition-all duration-200 hover:scale-[1.02] active:scale-95',
            pageEnter: 'animate-in fade-in slide-in-from-bottom-4 duration-500',
            button: 'transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl',
        }
    },
    game: {
        defaults: {
            timeLimit: 20,
            points: 1000,
            questionType: 'quiz'
        },
        limits: {
            maxPlayers: 100,
            maxQuestions: 50,
            maxAnswerLength: 80
        }
    },
    ui: {
        appName: 'Questify',
        loadingText: 'Loading...',
        joinText: 'Join Game',
        hostText: 'Host Game'
    }
}
