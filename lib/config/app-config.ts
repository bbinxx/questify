// App Configuration - Central source of truth for all app data

export const APP_CONFIG = {
    // App Identity
    name: "Questify",
    version: "2.0.0",
    description: "Interactive Presentations Made Easy",
    tagline: "Make Your Presentations Interactive",

    // URLs
    urls: {
        homepage: "/",
            dashboard: "/manage",
        docs: "https://github.com/yourusername/questify",
        support: "mailto:support@questify.app"
    },

    // Company Info
    company: {
        name: "Questify",
        year: new Date().getFullYear(),
        tagline: "Making presentations interactive and engaging"
    },

    // Feature Flags
    features: {
        analytics: true,
        export: true,
        realtime: true,
        pwa: true,
        multiLanguage: false
    }
}

export const ROUTES = {
    home: "/",
    manage: "/manage",
    login: "/login",
    present: (id: string) => `/manage/${id}/present`,
    edit: (id: string) => `/manage/${id}`,
    analytics: (id: string) => `/manage/${id}/analytics`,
    join: (code: string) => `/p/${code}`
}

export const UI_TEXT = {
    // Landing Page
    landing: {
        hero: {
            badge: "🎉 Now with Real-time Analytics",
            title: "Make Your",
            titleHighlight: "Presentations",
            titleEnd: "Interactive",
            subtitle: "Engage your audience with live polls, Q&A, quizzes, and word clouds. Get instant feedback and make every presentation unforgettable.",
            cta: {
                primary: "Create Presentation",
                secondary: "Join Presentation"
            },
            stats: {
                presentations: { value: "500K+", label: "Presentations" },
                participants: { value: "10M+", label: "Participants" },
                uptime: { value: "99.9%", label: "Uptime" }
            }
        },
        features: {
            title: "Everything You Need",
            subtitle: "Powerful features to make your presentations engaging",
            items: [
                {
                    title: "Real-time Voting",
                    description: "See results update live as participants vote",
                    icon: "zap"
                },
                {
                    title: "Beautiful Charts",
                    description: "Visualize data with stunning, animated charts",
                    icon: "chart"
                },
                {
                    title: "Live Q&A",
                    description: "Collect and upvote questions from your audience",
                    icon: "users"
                },
                {
                    title: "Secure & Private",
                    description: "Your data is encrypted and protected",
                    icon: "shield"
                }
            ]
        },
        questionTypes: {
            title: "10+ Question Types",
            subtitle: "Choose the perfect format for your content",
            types: [
                { name: "Multiple Choice", icon: "✓" },
                { name: "Word Cloud", icon: "☁️" },
                { name: "Open Text", icon: "✍️" },
                { name: "Rating Scale", icon: "⭐" },
                { name: "Ranking", icon: "🔢" },
                { name: "Q&A", icon: "❓" },
                { name: "Quiz", icon: "🎯" },
                { name: "Pin on Image", icon: "📍" },
                { name: "2x2 Grid", icon: "📊" },
                { name: "Emoji Rating", icon: "😊" }
            ]
        },
        cta: {
            title: "Ready to Get Started?",
            subtitle: "Create your first interactive presentation in minutes",
            button: "Create Free Presentation"
        },
        footer: {
            sections: [
                {
                    title: "Product",
                    links: [
                        { label: "Features", href: "/manage" },
                        { label: "Pricing", href: "/manage" },
                        { label: "Templates", href: "/manage" }
                    ]
                },
                {
                    title: "Resources",
                    links: [
                        { label: "Documentation", href: "#" },
                        { label: "Help Center", href: "#" },
                        { label: "Blog", href: "#" }
                    ]
                },
                {
                    title: "Company",
                    links: [
                        { label: "About", href: "#" },
                        { label: "Contact", href: "#" },
                        { label: "Privacy", href: "#" }
                    ]
                }
            ]
        }
    },

    // Join Form
    joinForm: {
        title: "Join a Presentation",
        subtitle: "Enter the code shared by your presenter",
        placeholder: "Enter code (e.g. ABC123)",
        hint: "Usually 6-8 characters",
        button: "Join Presentation",
        error: "Please enter a valid code"
    },

    // Dashboard
    dashboard: {
        title: "My Presentations",
        subtitle: "Create and manage your interactive presentations",
        createButton: "New Presentation",
        backButton: "← Home",
        loading: "Loading presentations...",
        empty: {
            title: "No Presentations Yet",
            subtitle: "Create your first interactive presentation and start engaging with your audience in real-time!",
            button: "Create Your First Presentation"
        },
        card: {
            code: "Join Code",
            slides: "Slides",
            responses: "Responses",
            edit: "Edit",
            present: "Present",
            copySuccess: "Code copied to clipboard!",
            status: {
                live: "● Live",
                inactive: "Inactive"
            }
        }
    },

    // Error Messages
    errors: {
        database: {
            connection: "Unable to connect to database. Please check your credentials.",
            fetch: "Failed to load data. Please try again.",
            save: "Failed to save. Please try again.",
            delete: "Failed to delete. Please try again."
        },
        network: {
            offline: "You appear to be offline. Please check your connection.",
            timeout: "Request timed out. Please try again.",
            server: "Server error. Please try again later."
        },
        validation: {
            required: "This field is required",
            invalidCode: "Invalid presentation code",
            tooShort: "Code must be at least 3 characters",
            tooLong: "Code cannot exceed 8 characters"
        },
        presentation: {
            notFound: "Presentation not found",
            noAccess: "You don't have access to this presentation",
            expired: "This presentation has expired"
        }
    },

    // Success Messages
    success: {
        created: "Presentation created successfully!",
        updated: "Presentation updated successfully!",
        deleted: "Presentation deleted successfully!",
        copied: "Copied to clipboard!",
        saved: "Changes saved!",
        joined: "Joined successfully!"
    },

    // Navigation
    navigation: {
        home: "Home",
        dashboard: "Dashboard",
        getStarted: "Get Started"
    }
}

export const THEME = {
    colors: {
        primary: {
            50: '#EEF2FF',
            100: '#E0E7FF',
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#818CF8',
            500: '#6366F1',
            600: '#4F46E5', // Primary
            700: '#4338CA',
            800: '#3730A3',
            900: '#312E81'
        },
        purple: {
            600: '#8B5CF6',
            700: '#7C3AED'
        },
        green: {
            600: '#10B981',
            700: '#059669'
        },
        gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            600: '#4B5563',
            800: '#1F2937',
            900: '#111827'
        }
    },
    borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem'
    }
}

export const QUESTION_TYPES = {
    MULTIPLE_CHOICE: {
        id: 'multiple_choice',
        name: 'Multiple Choice',
        icon: '✓',
        description: 'Participants can select multiple options'
    },
    SINGLE_CHOICE: {
        id: 'single_choice',
        name: 'Single Choice',
        icon: '○',
        description: 'Participants can select one option'
    },
    TEXT: {
        id: 'text',
        name: 'Open Text',
        icon: '✍️',
        description: 'Participants can type free-form text'
    },
    WORD_CLOUD: {
        id: 'word_cloud',
        name: 'Word Cloud',
        icon: '☁️',
        description: 'Create a word cloud from responses'
    },
    QUESTION_ONLY: {
        id: 'question_only',
        name: 'Question Only',
        icon: '❓',
        description: 'Display a question without collecting responses'
    },
    SCALE: {
        id: 'scale',
        name: 'Rating Scale',
        icon: '⭐',
        description: 'Likert scale or numeric rating'
    },
    RANKING: {
        id: 'ranking',
        name: 'Ranking',
        icon: '🔢',
        description: 'Rank items in order of preference'
    },
    QA: {
        id: 'qa',
        name: 'Q&A',
        icon: '💬',
        description: 'Live Q&A with upvoting'
    },
    QUIZ: {
        id: 'quiz',
        name: 'Quiz',
        icon: '🎯',
        description: 'Quiz with correct answers and points'
    },
    PIN_ON_IMAGE: {
        id: 'pin_on_image',
        name: 'Pin on Image',
        icon: '📍',
        description: 'Click to place pins on an image'
    }
}

export const DATABASE_CONFIG = {
    retryAttempts: 3,
    retryDelay: 1000, // ms
    timeout: 10000, // ms
    poolSize: 10
}
