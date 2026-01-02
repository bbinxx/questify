import { createClient } from './supabase/client';
import type { Database, PresentationAnalytics, QAQuestion } from './types/database';

// Create supabase client instance
const supabase = createClient();

type Tables = Database['public']['Tables'];

/**
 * Get presentation analytics
 */
export async function getPresentationAnalytics(presentationId: string): Promise<PresentationAnalytics | null> {
    const { data, error } = await supabase.rpc('get_presentation_analytics', {
        p_presentation_id: presentationId
    });

    if (error) {
        console.error('Error fetching presentation analytics:', error);
        return null;
    }

    return data;
}

/**
 * Get top Q&A questions for a slide
 */
export async function getTopQAQuestions(slideId: string, limit: number = 10): Promise<QAQuestion[]> {
    const { data, error } = await supabase.rpc('get_top_qa_questions', {
        p_slide_id: slideId,
        p_limit: limit
    });

    if (error) {
        console.error('Error fetching top Q&A questions:', error);
        return [];
    }

    return data || [];
}

/**
 * Submit a Q&A question
 */
export async function submitQAQuestion(params: {
    slideId: string;
    presentationId: string;
    sessionId: string;
    userName?: string;
    question: string;
}) {
    const { data, error } = await supabase
        .from('qa_questions')
        .insert({
            slide_id: params.slideId,
            presentation_id: params.presentationId,
            session_id: params.sessionId,
            user_name: params.userName || 'Anonymous',
            question: params.question
        })
        .select()
        .single();

    if (error) {
        console.error('Error submitting Q&A question:', error);
        throw error;
    }

    return data;
}

/**
 * Upvote a Q&A question
 */
export async function upvoteQuestion(questionId: string, sessionId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('increment_qa_upvotes', {
        p_question_id: questionId,
        p_session_id: sessionId
    });

    if (error) {
        console.error('Error upvoting question:', error);
        return false;
    }

    return data || false;
}

/**
 * Toggle Q&A question answered status
 */
export async function toggleQuestionAnswered(questionId: string) {
    const { error } = await supabase.rpc('toggle_qa_answered', {
        p_question_id: questionId
    });

    if (error) {
        console.error('Error toggling question answered status:', error);
        throw error;
    }
}

/**
 * Submit a response to a slide
 */
export async function submitResponse(params: {
    presentationId: string;
    slideId: string;
    sessionId: string;
    userName?: string;
    responseData: any;
    responseTime?: number;
    isCorrect?: boolean;
    points?: number;
}) {
    const { data, error } = await supabase
        .from('responses')
        .insert({
            presentation_id: params.presentationId,
            slide_id: params.slideId,
            session_id: params.sessionId,
            user_name: params.userName,
            response_data: params.responseData,
            response_time: params.responseTime,
            is_correct: params.isCorrect,
            points: params.points
        })
        .select()
        .single();

    if (error) {
        console.error('Error submitting response:', error);
        throw error;
    }

    return data;
}

/**
 * Get all responses for a slide
 */
export async function getSlideResponses(slideId: string) {
    const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('slide_id', slideId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching slide responses:', error);
        return [];
    }

    return data;
}

/**
 * Get presentation by code
 */
export async function getPresentationByCode(code: string) {
    const { data, error } = await supabase
        .from('presentations')
        .select(`
      *,
      slides (
        *
      )
    `)
        .eq('code', code)
        .single();

    if (error) {
        console.error('Error fetching presentation by code:', error);
        return null;
    }

    return data;
}

/**
 * Get full presentation data with analytics
 */
export async function getPresentationFull(presentationId: string) {
    const { data, error } = await supabase.rpc('get_presentation_full', {
        p_presentation_id: presentationId
    });

    if (error) {
        console.error('Error fetching full presentation:', error);
        return null;
    }

    return data;
}

/**
 * Create a new presentation
 */
export async function createPresentation(params: {
    title: string;
    code: string;
    userId: string;
    settings?: any;
}) {
    const { data, error } = await supabase
        .from('presentations')
        .insert({
            title: params.title,
            code: params.code,
            user_id: params.userId,
            settings: params.settings || {}
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating presentation:', error);
        throw error;
    }

    return data;
}

/**
 * Add a slide to a presentation
 */
export async function addSlide(params: {
    presentationId: string;
    question: string;
    type: string;
    options?: any;
    order: number;
    settings?: any;
    timeLimit?: number;
    correctAnswer?: any;
}) {
    const { data, error } = await supabase
        .from('slides')
        .insert({
            presentation_id: params.presentationId,
            question: params.question,
            type: params.type,
            options: params.options,
            order: params.order,
            settings: params.settings,
            time_limit: params.timeLimit,
            correct_answer: params.correctAnswer
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding slide:', error);
        throw error;
    }

    return data;
}

/**
 * Update a slide
 */
export async function updateSlide(slideId: string, updates: Partial<Tables['slides']['Update']>) {
    const { data, error } = await supabase
        .from('slides')
        .update(updates)
        .eq('id', slideId)
        .select()
        .single();

    if (error) {
        console.error('Error updating slide:', error);
        throw error;
    }

    return data;
}

/**
 * Delete a slide
 */
export async function deleteSlide(slideId: string) {
    const { error } = await supabase
        .from('slides')
        .delete()
        .eq('id', slideId);

    if (error) {
        console.error('Error deleting slide:', error);
        throw error;
    }
}

/**
 * Subscribe to Q&A questions for a slide
 */
export function subscribeToQAQuestions(
    slideId: string,
    callback: (question: Tables['qa_questions']['Row']) => void
) {
    return supabase
        .channel(`qa:${slideId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'qa_questions',
                filter: `slide_id=eq.${slideId}`
            },
            (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    callback(payload.new as Tables['qa_questions']['Row']);
                }
            }
        )
        .subscribe();
}

/**
 * Subscribe to responses for a slide
 */
export function subscribeToResponses(
    slideId: string,
    callback: (response: Tables['responses']['Row']) => void
) {
    return supabase
        .channel(`responses:${slideId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'responses',
                filter: `slide_id=eq.${slideId}`
            },
            (payload) => {
                callback(payload.new as Tables['responses']['Row']);
            }
        )
        .subscribe();
}

/**
 * Track analytics event
 */
export async function trackAnalyticsEvent(params: {
    presentationId: string;
    slideId?: string;
    eventType: string;
    eventData?: any;
    sessionId?: string;
}) {
    const { error } = await supabase
        .from('analytics_events')
        .insert({
            presentation_id: params.presentationId,
            slide_id: params.slideId,
            event_type: params.eventType,
            event_data: params.eventData,
            session_id: params.sessionId
        });

    if (error) {
        console.error('Error tracking analytics event:', error);
    }
}

/**
 * Generate unique presentation code
 */
export function generatePresentationCode(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

/**
 * Check if presentation code is available
 */
export async function isPresentationCodeAvailable(code: string): Promise<boolean> {
    const { data } = await supabase
        .from('presentations')
        .select('id')
        .eq('code', code)
        .single();

    return !data;
}

/**
 * Generate unique available presentation code
 */
export async function generateUniquePresentationCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const code = generatePresentationCode();
        const isAvailable = await isPresentationCodeAvailable(code);

        if (isAvailable) {
            return code;
        }

        attempts++;
    }

    // If we couldn't find a unique 6-character code, try 8 characters
    return generatePresentationCode(8);
}
