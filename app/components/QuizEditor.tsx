'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createQuiz, getQuiz, updateQuiz } from '@/app/actions/quiz'
import { ACTIVITIES } from '@/lib/activities/registry'
import type { ActivityType } from '@/lib/activities/types'
import { editorQuestion, quizQuestion, moveActivity } from '@/lib/editor'
import { validateUpload } from '@/lib/validation'
import QuestionMedia from '@/app/components/game/QuestionMedia'

// Icon components
const MenuIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
)

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const SunIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
)

const MoonIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
)

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
)

const SparklesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
)

const DocumentIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
)

const ClockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const TargetIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
)

const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)

const SettingsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

const SaveIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
)

const PaletteIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
)

const ImageIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

const CameraIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

const VideoIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
)

const MusicIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
)

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
)

const CopyIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
)

const QuestionIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

interface Question {
    id: string
    text: string
    answers: string[]
    timeLimit: string
    points: string
    answerType: string
    questionType: ActivityType
    body?: string
    selectedAnswers: number[]
    mediaUrl?: string
}

const DEFAULT_QUESTION: Question = {
    id: '1',
    text: '',
    answers: ['', '', '', ''],
    timeLimit: '20 seconds',
    points: 'Standard',
    answerType: 'Single select',
    questionType: 'MULTIPLE_CHOICE',
    selectedAnswers: []
}

export default function QuizEditor({ quizId }: { quizId?: string }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(!!quizId)
    const [error, setError] = useState('')
    const [dirty, setDirty] = useState(false)
    useEffect(() => {
        let active = true
        if (!quizId) return
        getQuiz(quizId).then(res => {
            if (!active) return
            if (res.success && res.quiz) {
                setQuizTitle(res.quiz.title)
                setActivities(res.quiz.questions.map(editorQuestion) as Question[])
            } else setError(res.error || 'Unable to load quiz')
        }).catch(() => { if (active) setError('Unable to load quiz') }).finally(() => { if (active) setIsLoading(false) })
        return () => { active = false }
    }, [quizId])
    useEffect(() => {
        if (!dirty) return
        const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [dirty])
    const [quizTitle, setQuizTitle] = useState('')
    const [questions, setActivities] = useState<Question[]>([{ ...DEFAULT_QUESTION, id: '1' }])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [isUploadingMedia, setIsUploadingMedia] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const validationError = validateUpload(file)
        if (validationError) { setError(validationError); return }
        const uploadingQuestionId = currentQuestion.id

        setIsUploadingMedia(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const { uploadMedia } = await import('@/app/actions/upload')
            const res = await uploadMedia(formData)
            if (res.success && res.url) {
                setActivities(prev => prev.map(q => q.id === uploadingQuestionId ? { ...q, mediaUrl: res.url } : q)); setDirty(true)
            } else {
                setError(res.error || 'Failed to upload file')
            }
        } catch (error) {
            console.error('File upload error:', error)
            setError('An error occurred during file upload')
        } finally {
            setIsUploadingMedia(false)
        }
    }

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const saving = useRef(false)

    // Derived state for current question
    const currentQuestion = questions[currentQuestionIndex]

    const answerStyles = [
        { bg: 'bg-rose-500', icon: '△' },
        { bg: 'bg-blue-500', icon: '◇' },
        { bg: 'bg-amber-500', icon: '○' },
        { bg: 'bg-emerald-500', icon: '□' }
    ]

    // State updaters
    const updateCurrentQuestion = (updates: Partial<Question>) => {
        setDirty(true)
        const newActivities = [...questions]
        newActivities[currentQuestionIndex] = { ...newActivities[currentQuestionIndex], ...updates }
        setActivities(newActivities)
    }

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...currentQuestion.answers]
        newAnswers[index] = value
        updateCurrentQuestion({ answers: newAnswers })
    }

    const toggleCorrectAnswer = (index: number) => {
        if (currentQuestion.answerType === 'Single select') {
            updateCurrentQuestion({ selectedAnswers: [index] })
        } else {
            const selected = currentQuestion.selectedAnswers
            if (selected.includes(index)) {
                updateCurrentQuestion({ selectedAnswers: selected.filter(i => i !== index) })
            } else {
                updateCurrentQuestion({ selectedAnswers: [...selected, index] })
            }
        }
    }

    const addNewQuestion = () => {
        if (questions.length >= 50) { setError('A presentation can contain up to 50 activities'); return }
        const newId = crypto.randomUUID()
        setDirty(true)
        setActivities([...questions, { ...DEFAULT_QUESTION, id: newId }])
        setCurrentQuestionIndex(questions.length)
        // Scroll sidebar?
    }

    const deleteQuestion = () => {
        if (questions.length <= 1) return
        if (!window.confirm('Delete this activity?')) return
        setDirty(true)
        const newActivities = questions.filter((_, idx) => idx !== currentQuestionIndex)
        setActivities(newActivities)
        setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
    }

    const duplicateQuestion = () => {
        if (questions.length >= 50) { setError('A presentation can contain up to 50 activities'); return }
        const newId = crypto.randomUUID()
        const newQuestion = { ...currentQuestion, id: newId }
        setDirty(true)
        setActivities([...questions, newQuestion])
        setCurrentQuestionIndex(questions.length)
    }

    const moveCurrentActivity = (direction: number) => {
        const reordered = moveActivity(questions, currentQuestion.id, direction)
        setActivities(reordered)
        setCurrentQuestionIndex(reordered.findIndex((q: Question) => q.id === currentQuestion.id))
        setDirty(true)
    }

    const handleSave = async () => {
        if (saving.current || isUploadingMedia) return
        if (!quizTitle.trim()) {
            setError('Please enter a quiz title')
            return
        }

        saving.current = true
        setIsSaving(true)
        setError('')
        try {
            // Transform questions for the Server Action
            const formattedActivities = questions.map(quizQuestion)

            const result = quizId ? await updateQuiz(quizId, quizTitle, formattedActivities) : await createQuiz(quizTitle, formattedActivities)

            if (result.success) {
                setDirty(false)
                router.push('/dashboard')
            } else {
                setError(result.error || 'Failed to save quiz')
            }
        } catch (error) {
            console.error(error)
            setError('Failed to save quiz')
        } finally {
            saving.current = false
            setIsSaving(false)
        }
    }

    const closePanels = () => {
        setSidebarOpen(false)
        setSettingsOpen(false)
    }

    if (isLoading) return <p role="status" className="p-8">Loading quiz…</p>
    if (!currentQuestion) return <p role="alert" className="p-8">{error || 'No questions found'}</p>

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${darkMode ? 'dark' : ''}`}>
            {error && <p role="alert" className="bg-rose-950 text-white p-3 flex-shrink-0">{error}</p>}
            {/* Mobile Overlay */}
            {(sidebarOpen || settingsOpen) && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closePanels}
                />
            )}

            {/* Header */}
            <header className="h-14 flex-shrink-0 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/10 flex items-center px-3 gap-2">
                <button
                    className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-slate-300"
                    aria-label="Open question list" onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <MenuIcon />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 dark:bg-primary-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Q</span>
                    </div>
                    <span className="font-bold text-xl text-primary-700 dark:text-primary-400 hidden sm:block tracking-wide">Questify</span>
                </div>

                <input
                    type="text"
                    placeholder="Enter quiz title..."
                    className="flex-1 max-w-[200px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-w-0"
                    aria-label="Quiz title" value={quizTitle}
                    onChange={(e) => { setQuizTitle(e.target.value); setDirty(true) }}
                />

                <div className="flex-1" />

                <div className="flex items-center gap-1.5">
                    <button
                        aria-label="Save and publish presentation" onClick={handleSave}
                        disabled={isSaving || isUploadingMedia}
                        className="btn-accent flex items-center gap-1.5 text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                        <SaveIcon />
                        <span className="hidden sm:inline">{isSaving ? 'Publishing…' : 'Save & publish'}</span>
                    </button>
                </div>
            </header>

            {/* Main Content - Fixed Height Container */}
            <div className="flex-1 flex overflow-hidden bg-[#0B0F19] text-white">
                {/* Sidebar */}
                <aside className={`
                    fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
                    w-56 lg:w-44 xl:w-52
                    bg-[#0B0F19]/80 backdrop-blur-xl border-r border-white/10
                    flex flex-col p-3 gap-2
                    transform transition-transform duration-300 ease-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <button
                        className="lg:hidden absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-full text-slate-500"
                        aria-label="Close question list" onClick={() => setSidebarOpen(false)}
                    >
                        <CloseIcon />
                    </button>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide font-serif">
                            Activities
                        </span>
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                            {questions.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                        {questions.map((q, idx) => (
                            <button type="button" aria-label={`Edit question ${idx + 1}`} aria-pressed={idx === currentQuestionIndex}
                                key={q.id}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`
                                    relative p-2.5 rounded-lg border-2 cursor-pointer transition-colors
                                    ${idx === currentQuestionIndex
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50'
                                        : 'border-white/10 hover:border-slate-300 dark:hover:border-slate-700'}
                                `}
                            >
                                <span className={`
                                    absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full
                                    text-[10px] font-bold flex items-center justify-center
                                    ${idx === currentQuestionIndex ? 'bg-primary-600 text-white' : 'bg-white/10 text-slate-300'}
                                `}>
                                    {idx + 1}
                                </span>
                                <div className={`h-10 rounded flex items-center justify-center ${idx === currentQuestionIndex ? 'bg-primary-600 dark:bg-primary-700' : 'bg-white/5'}`}>
                                    <QuestionIcon />
                                </div>
                                <p className="mt-1.5 text-[10px] font-medium text-slate-300 text-center truncate">
                                    {q.text || 'New Question'}
                                </p>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={addNewQuestion}
                        className="btn-primary w-full text-xs py-2"
                    >
                        <PlusIcon />
                        <span>Add</span>
                    </button>
                </aside>

                {/* Center Panel - No Scroll */}
                <main className="flex-1 flex flex-col overflow-hidden p-2 sm:p-3 lg:p-4">
                    <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
                        <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0F19]/80 backdrop-blur-xl rounded-lg border border-white/10">
                            {/* Question Header */}
                            <div className="flex-shrink-0 bg-primary-600 dark:bg-primary-700 p-3 sm:p-4">
                                <input aria-label="Question text"
                                    type="text"
                                    placeholder={currentQuestion.questionType === 'TEXT_SLIDE' ? 'Slide title…' : 'Start typing your question…'}
                                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 text-sm sm:text-base font-medium text-white font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    value={currentQuestion.text}
                                    onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
                                />
                            </div>

                            {/* Media Upload - Compact and Functional */}
                            {currentQuestion.mediaUrl ? (
                                <div className="flex-shrink-0 mx-2 sm:mx-3 mt-2 sm:mt-3 p-3 rounded-lg border border-white/10 bg-white/5 text-center relative group">
                                    <QuestionMedia src={currentQuestion.mediaUrl} className="max-h-full max-w-full object-contain rounded-lg" />
                                    <button
                                        aria-label="Remove media" onClick={() => updateCurrentQuestion({ mediaUrl: '' })}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all active:scale-95 flex items-center justify-center"
                                        title="Remove media"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex-shrink-0 mx-2 sm:mx-3 mt-2 sm:mt-3 p-3 rounded-lg border-2 border-dashed border-white/20 bg-white/5 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer group block">
                                    <input
                                        type="file" aria-label="Upload question media"
                                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" disabled={isUploadingMedia}
                                        className="sr-only"
                                        onChange={handleFileUpload}
                                    />
                                    <div className="flex justify-center gap-3 mb-1.5">
                                        <span className="text-slate-400 group-hover:text-primary-500 transition-colors"><CameraIcon /></span>
                                        <span className="text-slate-400 group-hover:text-primary-500 transition-colors"><VideoIcon /></span>
                                        <span className="text-slate-400 group-hover:text-primary-500 transition-colors"><MusicIcon /></span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium text-slate-300">
                                        {isUploadingMedia ? 'Uploading media...' : 'Add media'}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Image or video, up to 20 MB</p>
                                </label>
                            )}

                            {/* Answers Area */}
                            <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 flex flex-col justify-center">
                                {currentQuestion.questionType === 'TEXT_SLIDE' ? (
                                    <div className="h-full min-h-40 flex flex-col gap-3">
                                        <label htmlFor="slide-body" className="text-sm text-indigo-200 font-bold">Slide body</label>
                                        <textarea id="slide-body" value={currentQuestion.body || ''} maxLength={8000}
                                            onChange={e => updateCurrentQuestion({ body: e.target.value })}
                                            placeholder="Add the content you want everyone to read…"
                                            className="flex-1 min-h-40 resize-none rounded-xl bg-white/5 border border-white/20 p-5 text-white text-lg leading-relaxed" />
                                        <p className="text-xs text-slate-400">Text slides stay on screen until you advance. No answers or points.</p>
                                    </div>
                                ) : currentQuestion.questionType === 'TYPE_ANSWER' ? (
                                    <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                                        <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">Acceptable Answer</p>
                                        <input
                                            type="text" aria-label="Correct typed answer"
                                            placeholder="Type the correct answer here..."
                                            className="w-full max-w-md bg-slate-100 dark:bg-slate-900 text-center text-xl p-4 rounded-xl font-bold border-2 border-indigo-500 outline-none"
                                            value={currentQuestion.answers[0] || ''}
                                            onChange={(e) => handleAnswerChange(0, e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        {currentQuestion.answers.slice(0, currentQuestion.questionType === 'TRUE_FALSE' ? 2 : 4).map((answer, index) => {
                                            const isCorrect = currentQuestion.selectedAnswers.includes(index);
                                            const isPoll = currentQuestion.questionType === 'POLL';
                                            return (
                                                <div
                                                    key={index}
                                                    className={`
                                                        flex items-center rounded-lg border-2 bg-white/5 overflow-hidden cursor-pointer
                                                        transition-all duration-200 hover:shadow-sm h-12 sm:h-14
                                                        ${isCorrect && !isPoll
                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                                            : 'border-white/10 hover:border-slate-300 dark:hover:border-slate-600'
                                                        }
                                                    `}

                                                >
                                                    <button type="button" disabled={isPoll} aria-label={`Mark answer ${index + 1} correct`} aria-pressed={isCorrect} onClick={() => toggleCorrectAnswer(index)} className={`w-10 h-full sm:w-12 ${answerStyles[index].bg} flex items-center justify-center flex-shrink-0`}>
                                                        <span className="text-white text-sm sm:text-lg font-bold">{answerStyles[index].icon}</span>
                                                    </button>
                                                    <input
                                                        type="text"
                                                        placeholder={currentQuestion.questionType === 'TRUE_FALSE' ? (index === 0 ? 'True' : 'False') : `Answer ${index + 1}${index >= 2 ? ' (opt)' : ''}`}
                                                        className="flex-1 min-w-0 px-2 sm:px-3 py-2 bg-transparent text-xs sm:text-sm text-white font-bold placeholder:text-slate-400 focus:outline-none"
                                                        aria-label={`Answer ${index + 1}`} value={answer}
                                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        readOnly={currentQuestion.questionType === 'TRUE_FALSE'}
                                                    />
                                                    {!isPoll && isCorrect && (
                                                        <span className="pr-2 text-emerald-500"><CheckIcon /></span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right Panel - Settings */}
                <aside className={`
                    fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto
                    w-64 lg:w-52 xl:w-60
                    bg-[#0B0F19]/80 backdrop-blur-xl border-l border-white/10
                    flex flex-col p-4 gap-3 overflow-hidden
                    transform transition-transform duration-300 ease-out
                    ${settingsOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                `}>
                    <button
                        className="lg:hidden absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-full text-slate-500"
                        aria-label="Close settings" onClick={() => setSettingsOpen(false)}
                    >
                        <CloseIcon />
                    </button>

                    <h3 className="font-bold text-sm text-white font-bold">Settings</h3>

                    <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 dark:text-slate-200">
                                <DocumentIcon /> Activity type
                            </label>
                            <select
                                className="w-full px-2 py-1.5 rounded bg-white/5 border-white/10 text-xs"
                                aria-label="Activity type" value={currentQuestion.questionType}
                                onChange={(e) => {
                                    const val = e.target.value as ActivityType;
                                    let newAnswers = currentQuestion.answers;
                                    if (val === 'TRUE_FALSE') newAnswers = ['True', 'False', '', ''];
                                    else if (val === 'TYPE_ANSWER') newAnswers = ['', '', '', ''];
                                    updateCurrentQuestion({ questionType: val, answers: newAnswers, selectedAnswers: [], timeLimit: parseInt(currentQuestion.timeLimit) > 0 ? currentQuestion.timeLimit : '20 seconds' })
                                }}
                            >
                                {Object.entries(ACTIVITIES).map(([type, activity]) => <option key={type} value={type}>{activity.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 dark:text-slate-200">
                                <ClockIcon /> Time limit
                            </label>
                            <select
                                className="w-full px-2 py-1.5 rounded bg-white/5 border-white/10 text-xs"
                                disabled={currentQuestion.questionType === 'TEXT_SLIDE'} aria-label="Time limit" value={currentQuestion.timeLimit}
                                onChange={(e) => updateCurrentQuestion({ timeLimit: e.target.value })}
                            >
                                <option>5 seconds</option>
                                <option>10 seconds</option>
                                <option>20 seconds</option>
                                <option>30 seconds</option>
                                <option>60 seconds</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 dark:text-slate-200">
                                <TargetIcon /> Points
                            </label>
                            <select
                                className="w-full px-2 py-1.5 rounded bg-white/5 border-white/10 text-xs"
                                disabled={['TEXT_SLIDE', 'POLL'].includes(currentQuestion.questionType)} aria-label="Points" value={currentQuestion.points}
                                onChange={(e) => updateCurrentQuestion({ points: e.target.value })}
                            >
                                <option>No points</option>
                                <option>Standard</option>
                                <option>Double points</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 dark:text-slate-200">
                                <CheckIcon /> Answer options
                            </label>
                            <select
                                className="w-full px-2 py-1.5 rounded bg-white/5 border-white/10 text-xs"
                                disabled={['TEXT_SLIDE', 'TYPE_ANSWER', 'POLL'].includes(currentQuestion.questionType)} aria-label="Answer selection" value={currentQuestion.answerType}
                                onChange={(e) => {
                                    // Reset selected answers if switching type
                                    updateCurrentQuestion({ answerType: e.target.value, selectedAnswers: [] })
                                }}
                            >
                                <option>Single select</option>

                            </select>
                        </div>
                    </div>

                    <div className="flex-shrink-0 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex gap-2">
                            <button type="button" disabled={currentQuestionIndex === 0} onClick={() => moveCurrentActivity(-1)} className="flex-1 py-2 text-sm text-white bg-white/10 rounded disabled:opacity-30">Move up</button>
                            <button type="button" disabled={currentQuestionIndex === questions.length - 1} onClick={() => moveCurrentActivity(1)} className="flex-1 py-2 text-sm text-white bg-white/10 rounded disabled:opacity-30">Move down</button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={deleteQuestion}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium"
                            >
                                <TrashIcon /> Delete
                            </button>
                            <button
                                onClick={duplicateQuestion}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors text-xs font-medium"
                            >
                                <CopyIcon /> Copy
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden flex-shrink-0 bg-[#0B0F19]/80 backdrop-blur-xl border-t border-white/10 flex h-14">
                <button
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${sidebarOpen ? 'text-primary-500' : 'text-slate-500'}`}
                    onClick={() => { setSidebarOpen(!sidebarOpen); setSettingsOpen(false); }}
                >
                    <DocumentIcon />
                    <span className="text-[9px] font-semibold uppercase">Activities</span>
                </button>
                <button
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-500"
                    onClick={addNewQuestion}
                >
                    <PlusIcon />
                    <span className="text-[9px] font-semibold uppercase">Add</span>
                </button>
                <button className="flex-1 flex items-center justify-center" aria-label="Save and publish presentation" onClick={handleSave} disabled={isSaving || isUploadingMedia}>
                    <div className="w-11 h-11 -mt-4 rounded-xl bg-primary-600 dark:bg-primary-500 shadow-lg flex items-center justify-center text-white">
                        <SaveIcon />
                    </div>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-500" onClick={() => setDarkMode(!darkMode)} aria-pressed={darkMode}>
                    <PaletteIcon />
                    <span className="text-[9px] font-semibold uppercase">Theme</span>
                </button>
                <button
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${settingsOpen ? 'text-primary-500' : 'text-slate-500'}`}
                    onClick={() => { setSettingsOpen(!settingsOpen); setSidebarOpen(false); }}
                >
                    <SettingsIcon />
                    <span className="text-[9px] font-semibold uppercase">Settings</span>
                </button>
            </nav>
        </div>
    )
}
