// Enhanced Database Types for Questify Mentimeter Clone

export type SlideType =
    | 'multiple_choice'
    | 'single_choice'
    | 'text'
    | 'word_cloud'
    | 'question_only'
    | 'scale'
    | 'ranking'
    | 'qa'
    | 'quiz'
    | 'pin_on_image';

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            presentations: {
                Row: {
                    id: string;
                    title: string;
                    code: string;
                    user_id: string;
                    created_at: string;
                    settings?: Json;
                    theme_id?: string | null;
                    is_template?: boolean;
                    last_presented_at?: string | null;
                };
                Insert: {
                    id?: string;
                    title: string;
                    code: string;
                    user_id: string;
                    created_at?: string;
                    settings?: Json;
                    theme_id?: string | null;
                    is_template?: boolean;
                    last_presented_at?: string | null;
                };
                Update: {
                    id?: string;
                    title?: string;
                    code?: string;
                    user_id?: string;
                    created_at?: string;
                    settings?: Json;
                    theme_id?: string | null;
                    is_template?: boolean;
                    last_presented_at?: string | null;
                };
            };
            slides: {
                Row: {
                    id: string;
                    presentation_id: string;
                    question: string;
                    type: SlideType;
                    options?: Json;
                    order: number;
                    created_at: string;
                    settings?: Json;
                    media_url?: string | null;
                    time_limit?: number | null;
                    correct_answer?: Json;
                };
                Insert: {
                    id?: string;
                    presentation_id: string;
                    question: string;
                    type: SlideType;
                    options?: Json;
                    order: number;
                    created_at?: string;
                    settings?: Json;
                    media_url?: string | null;
                    time_limit?: number | null;
                    correct_answer?: Json;
                };
                Update: {
                    id?: string;
                    presentation_id?: string;
                    question?: string;
                    type?: SlideType;
                    options?: Json;
                    order?: number;
                    created_at?: string;
                    settings?: Json;
                    media_url?: string | null;
                    time_limit?: number | null;
                    correct_answer?: Json;
                };
            };
            responses: {
                Row: {
                    id: string;
                    presentation_id: string;
                    slide_id: string;
                    session_id: string;
                    user_name?: string | null;
                    response_data: Json;
                    created_at: string;
                    response_time?: number | null;
                    is_correct?: boolean | null;
                    points?: number | null;
                };
                Insert: {
                    id?: string;
                    presentation_id: string;
                    slide_id: string;
                    session_id: string;
                    user_name?: string | null;
                    response_data: Json;
                    created_at?: string;
                    response_time?: number | null;
                    is_correct?: boolean | null;
                    points?: number | null;
                };
                Update: {
                    id?: string;
                    presentation_id?: string;
                    slide_id?: string;
                    session_id?: string;
                    user_name?: string | null;
                    response_data?: Json;
                    created_at?: string;
                    response_time?: number | null;
                    is_correct?: boolean | null;
                    points?: number | null;
                };
            };
            user_profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    default_theme?: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    default_theme?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    default_theme?: Json;
                    created_at?: string;
                };
            };
            presentation_themes: {
                Row: {
                    id: string;
                    user_id?: string | null;
                    name: string;
                    colors: Json;
                    fonts?: Json;
                    is_public: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    name: string;
                    colors: Json;
                    fonts?: Json;
                    is_public?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    name?: string;
                    colors?: Json;
                    fonts?: Json;
                    is_public?: boolean;
                    created_at?: string;
                };
            };
            qa_questions: {
                Row: {
                    id: string;
                    slide_id: string;
                    presentation_id: string;
                    session_id: string;
                    user_name?: string | null;
                    question: string;
                    upvotes: number;
                    is_answered: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    slide_id: string;
                    presentation_id: string;
                    session_id: string;
                    user_name?: string | null;
                    question: string;
                    upvotes?: number;
                    is_answered?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    slide_id?: string;
                    presentation_id?: string;
                    session_id?: string;
                    user_name?: string | null;
                    question?: string;
                    upvotes?: number;
                    is_answered?: boolean;
                    created_at?: string;
                };
            };
            qa_upvotes: {
                Row: {
                    id: string;
                    question_id: string;
                    session_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    question_id: string;
                    session_id: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    question_id?: string;
                    session_id?: string;
                    created_at?: string;
                };
            };
            analytics_events: {
                Row: {
                    id: string;
                    presentation_id: string;
                    slide_id?: string | null;
                    event_type: string;
                    event_data?: Json;
                    session_id?: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    presentation_id: string;
                    slide_id?: string | null;
                    event_type: string;
                    event_data?: Json;
                    session_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    presentation_id?: string;
                    slide_id?: string | null;
                    event_type?: string;
                    event_data?: Json;
                    session_id?: string | null;
                    created_at?: string;
                };
            };
            presentation_collaborators: {
                Row: {
                    id: string;
                    presentation_id: string;
                    user_id: string;
                    role: 'owner' | 'editor' | 'viewer';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    presentation_id: string;
                    user_id: string;
                    role: 'owner' | 'editor' | 'viewer';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    presentation_id?: string;
                    user_id?: string;
                    role?: 'owner' | 'editor' | 'viewer';
                    created_at?: string;
                };
            };
            presentation_media: {
                Row: {
                    id: string;
                    presentation_id: string;
                    user_id: string;
                    file_path: string;
                    file_type: string;
                    file_size?: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    presentation_id: string;
                    user_id: string;
                    file_path: string;
                    file_type: string;
                    file_size?: number | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    presentation_id?: string;
                    user_id?: string;
                    file_path?: string;
                    file_type?: string;
                    file_size?: number | null;
                    created_at?: string;
                };
            };
            // Add existing tables that were already in your schema
            presentation_rooms: {
                Row: {
                    id: string;
                    presentation_id: string;
                    room_code: string;
                    is_active: boolean;
                    current_slide_index: number;
                    show_results: boolean;
                    participant_count: number;
                    presenter_socket_id?: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    presentation_id: string;
                    room_code: string;
                    is_active?: boolean;
                    current_slide_index?: number;
                    show_results?: boolean;
                    participant_count?: number;
                    presenter_socket_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    presentation_id?: string;
                    room_code?: string;
                    is_active?: boolean;
                    current_slide_index?: number;
                    show_results?: boolean;
                    participant_count?: number;
                    presenter_socket_id?: string | null;
                    created_at?: string;
                };
            };
            socket_sessions: {
                Row: {
                    id: string;
                    socket_id: string;
                    user_id?: string | null;
                    presentation_id?: string | null;
                    user_name?: string | null;
                    user_role: string;
                    is_active: boolean;
                    joined_at: string;
                    last_activity: string;
                };
                Insert: {
                    id?: string;
                    socket_id: string;
                    user_id?: string | null;
                    presentation_id?: string | null;
                    user_name?: string | null;
                    user_role: string;
                    is_active?: boolean;
                    joined_at?: string;
                    last_activity?: string;
                };
                Update: {
                    id?: string;
                    socket_id?: string;
                    user_id?: string | null;
                    presentation_id?: string | null;
                    user_name?: string | null;
                    user_role?: string;
                    is_active?: boolean;
                    joined_at?: string;
                    last_activity?: string;
                };
            };
            socket_events: {
                Row: {
                    id: string;
                    socket_id: string;
                    presentation_id?: string | null;
                    event_type: string;
                    event_data?: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    socket_id: string;
                    presentation_id?: string | null;
                    event_type: string;
                    event_data?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    socket_id?: string;
                    presentation_id?: string | null;
                    event_type?: string;
                    event_data?: Json;
                    created_at?: string;
                };
            };
        };
        Functions: {
            get_presentation_analytics: {
                Args: { p_presentation_id: string };
                Returns: Json;
            };
            toggle_qa_answered: {
                Args: { p_question_id: string };
                Returns: void;
            };
            get_top_qa_questions: {
                Args: { p_slide_id: string; p_limit?: number };
                Returns: QAQuestion[];
            };
            increment_qa_upvotes: {
                Args: { p_question_id: string; p_session_id: string };
                Returns: boolean;
            };
            get_presentation_full: {
                Args: { p_presentation_id: string };
                Returns: Json;
            };
            cleanup_old_sessions: {
                Args: { days_old?: number };
                Returns: number;
            };
            get_presentation_by_code: {
                Args: { p_code: string };
                Returns: Json;
            };
        };
    };
}

// Type Helpers
export interface PresentationSettings {
    allowAnonymous?: boolean;
    requireName?: boolean;
    showResults?: boolean;
    collectEmails?: boolean;
    customBranding?: {
        logo?: string;
        primaryColor?: string;
    };
}

export interface SlideSettings {
    allowMultiple?: boolean;
    showResults?: boolean;
    anonymous?: boolean;
    required?: boolean;
    maxChars?: number;
    theme?: {
        backgroundColor?: string;
        textColor?: string;
        accentColor?: string;
    };
}

export interface ThemeColors {
    primary: string;
    secondary?: string;
    background: string;
    text: string;
    accent?: string;
}

export interface ThemeFonts {
    heading: string;
    body: string;
}

export interface QAQuestion {
    id: string;
    question: string;
    user_name?: string;
    upvotes: number;
    is_answered: boolean;
    created_at: string;
}

export interface PresentationAnalytics {
    total_responses: number;
    total_participants: number;
    avg_response_time: number;
    total_qa_questions: number;
    slides_data: {
        slide_id: string;
        question: string;
        type: SlideType;
        response_count: number;
        avg_time: number;
    }[];
}

export interface PresentationFull {
    presentation: Database['public']['Tables']['presentations']['Row'];
    slides: Database['public']['Tables']['slides']['Row'][];
    room: any;
    analytics: PresentationAnalytics;
}

// Scale Slide Types
export interface ScaleSlideData {
    type: 'scale';
    scaleType: 'numeric' | 'emoji' | 'stars';
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
    step?: number;
}

export interface ScaleResponse {
    value: number;
}

// Ranking Slide Types
export interface RankingSlideData {
    type: 'ranking';
    items: string[];
    maxRank?: number; // null = rank all items
}

export interface RankingResponse {
    rankings: { item: string; rank: number }[];
}

// Quiz Slide Types
export interface QuizSlideData {
    type: 'quiz';
    options: { id: string; text: string }[];
    correctAnswerIds: string[];
    points: number;
    timeLimit: number;
    explanation?: string;
}

export interface QuizResponse {
    selectedIds: string[];
    timeSpent: number;
}

// Pin on Image Types
export interface PinOnImageSlideData {
    type: 'pin_on_image';
    imageUrl: string;
    allowMultiplePins?: boolean;
}

export interface PinOnImageResponse {
    pins: { x: number; y: number }[];
}

// Supabase client type
export type SupabaseClient = any; // Import from @supabase/supabase-js
