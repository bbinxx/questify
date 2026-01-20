'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createQuiz } from '../actions/quiz'

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
    selectedAnswers: number[]
}

const DEFAULT_QUESTION: Question = {
    id: '1',
    text: '',
    answers: ['', '', '', ''],
    timeLimit: '20 seconds',
    points: 'Standard',
    answerType: 'Single select',
    selectedAnswers: []
}

export default function QuizCreator() {
    const router = useRouter()
    const [quizTitle, setQuizTitle] = useState('')
    const [questions, setQuestions] = useState<Question[]>([{ ...DEFAULT_QUESTION, id: '1' }])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

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
        const newQuestions = [...questions]
        newQuestions[currentQuestionIndex] = { ...newQuestions[currentQuestionIndex], ...updates }
        setQuestions(newQuestions)
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
        const newId = (Math.max(...questions.map(q => parseInt(q.id))) + 1).toString()
        setQuestions([...questions, { ...DEFAULT_QUESTION, id: newId }])
        setCurrentQuestionIndex(questions.length)
        // Scroll sidebar?
    }

    const deleteQuestion = () => {
        if (questions.length <= 1) return
        const newQuestions = questions.filter((_, idx) => idx !== currentQuestionIndex)
        setQuestions(newQuestions)
        setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
    }

    const duplicateQuestion = () => {
        const newId = (Math.max(...questions.map(q => parseInt(q.id))) + 1).toString()
        const newQuestion = { ...currentQuestion, id: newId }
        setQuestions([...questions, newQuestion])
        setCurrentQuestionIndex(questions.length)
    }

    const handleSave = async () => {
        if (!quizTitle.trim()) {
            alert('Please enter a quiz title')
            return
        }

        setIsSaving(true)
        try {
            // Transform questions for the Server Action
            const formattedQuestions = questions.map(q => ({
                text: q.text,
                answers: q.answers,
                correctAnswer: q.selectedAnswers[0] || 0, // Default to 0 if none selected
                timeLimit: q.timeLimit
            }))

            const result = await createQuiz(quizTitle, formattedQuestions)

            if (result.success) {
                alert('Quiz created successfully!')
                router.push('/dashboard')
            } else {
                alert('Error: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Failed to save quiz')
        } finally {
            setIsSaving(false)
        }
    }

    const closePanels = () => {
        setSidebarOpen(false)
        setSettingsOpen(false)
    }

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${darkMode ? 'dark' : ''}`}>
            {/* Mobile Overlay */}
            {(sidebarOpen || settingsOpen) && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closePanels}
                />
            )}

            {/* Header */}
            <header className="h-14 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-3 gap-2">
                <button
                    className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
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
                    className="flex-1 max-w-[200px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hidden md:block"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                />

                <div className="flex-1" />

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {darkMode ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <button className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
                        <PaletteIcon />
                        <span className="hidden sm:inline">Themes</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn-accent flex items-center gap-1.5 text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                        <SaveIcon />
                        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                </div>
            </header>

            {/* Main Content - Fixed Height Container */}
            <div className="flex-1 flex overflow-hidden bg-slate-100 dark:bg-slate-950">
                {/* Sidebar */}
                <aside className={`
                    fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
                    w-56 lg:w-44 xl:w-52
                    bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
                    flex flex-col p-3 gap-2
                    transform transition-transform duration-300 ease-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <button
                        className="lg:hidden absolute top-3 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <CloseIcon />
                    </button>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-serif">
                            Questions
                        </span>
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                            {questions.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                        {questions.map((q, idx) => (
                            <div
                                key={q.id}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`
                                    relative p-2.5 rounded-lg border-2 cursor-pointer transition-colors
                                    ${idx === currentQuestionIndex
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}
                                `}
                            >
                                <span className={`
                                    absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full 
                                    text-[10px] font-bold flex items-center justify-center
                                    ${idx === currentQuestionIndex ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}
                                `}>
                                    {idx + 1}
                                </span>
                                <div className={`h-10 rounded flex items-center justify-center ${idx === currentQuestionIndex ? 'bg-primary-600 dark:bg-primary-700' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                    <QuestionIcon />
                                </div>
                                <p className="mt-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 text-center truncate">
                                    {q.text || 'New Question'}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addNewQuestion}
                        className="btn-primary w-full text-xs py-2"
                    >
                        <PlusIcon />
                        <span>Add</span>
                    </button>
                    <button className="btn-outline w-full text-xs py-2">
                        <SparklesIcon />
                        <span>Generate</span>
                    </button>
                </aside>

                {/* Center Panel - No Scroll */}
                <main className="flex-1 flex flex-col overflow-hidden p-2 sm:p-3 lg:p-4">
                    <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
                        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            {/* Question Header */}
                            <div className="flex-shrink-0 bg-primary-600 dark:bg-primary-700 p-3 sm:p-4">
                                <input
                                    type="text"
                                    placeholder="Start typing your question..."
                                    className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800 text-sm sm:text-base font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    value={currentQuestion.text}
                                    onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
                                />
                            </div>

                            {/* Media Upload - Compact */}
                            <div className="flex-shrink-0 mx-2 sm:mx-3 mt-2 sm:mt-3 p-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer group">
                                <div className="flex justify-center gap-3 mb-1.5">
                                    <span className="text-slate-400 group-hover:text-primary-500 transition-colors"><CameraIcon /></span>
                                    <span className="text-slate-400 group-hover:text-primary-500 transition-colors"><VideoIcon /></span>
                                    <span className="text-slate-400 group-hover:text-primary-500 transition-colors"><MusicIcon /></span>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">Add media</p>
                                <p className="text-[10px] sm:text-xs text-slate-400">Upload or drag files here</p>
                            </div>

                            {/* Answers Grid - 2x2 Always */}
                            <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3">
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    {currentQuestion.answers.map((answer, index) => (
                                        <div
                                            key={index}
                                            className={`
                                                flex items-center rounded-lg border-2 bg-white dark:bg-slate-800 overflow-hidden cursor-pointer
                                                transition-all duration-200 hover:shadow-sm h-12 sm:h-14
                                                ${currentQuestion.selectedAnswers.includes(index)
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }
                                            `}
                                            onClick={() => toggleCorrectAnswer(index)}
                                        >
                                            <div className={`w-10 h-full sm:w-12 ${answerStyles[index].bg} flex items-center justify-center flex-shrink-0`}>
                                                <span className="text-white text-sm sm:text-lg font-bold">{answerStyles[index].icon}</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder={`Answer ${index + 1}${index >= 2 ? ' (opt)' : ''}`}
                                                className="flex-1 min-w-0 px-2 sm:px-3 py-2 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                                value={answer}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {currentQuestion.selectedAnswers.includes(index) && (
                                                <span className="pr-2 text-emerald-500"><CheckIcon /></span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right Panel - Settings */}
                <aside className={`
                    fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto
                    w-64 lg:w-52 xl:w-60
                    bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800
                    flex flex-col p-4 gap-3 overflow-hidden
                    transform transition-transform duration-300 ease-out
                    ${settingsOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                `}>
                    <button
                        className="lg:hidden absolute top-3 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
                        onClick={() => setSettingsOpen(false)}
                    >
                        <CloseIcon />
                    </button>

                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Settings</h3>

                    <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <DocumentIcon /> Question type
                            </label>
                            <select
                                className="w-full px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                                value={currentQuestion.answerType}
                                onChange={(e) => updateCurrentQuestion({ answerType: e.target.value })}
                            >
                                <option>Quiz</option>
                                <option>True/False</option>
                                <option>Poll</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <ClockIcon /> Time limit
                            </label>
                            <select
                                className="w-full px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                                value={currentQuestion.timeLimit}
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
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <TargetIcon /> Points
                            </label>
                            <select
                                className="w-full px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                                value={currentQuestion.points}
                                onChange={(e) => updateCurrentQuestion({ points: e.target.value })}
                            >
                                <option>No points</option>
                                <option>Standard</option>
                                <option>Double points</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckIcon /> Answer options
                            </label>
                            <select
                                className="w-full px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                                value={currentQuestion.answerType}
                                onChange={(e) => {
                                    // Reset selected answers if switching type
                                    updateCurrentQuestion({ answerType: e.target.value, selectedAnswers: [] })
                                }}
                            >
                                <option>Single select</option>
                                <option>Multi select</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-shrink-0 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
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
            <nav className="lg:hidden flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex h-14">
                <button
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${sidebarOpen ? 'text-primary-500' : 'text-slate-500'}`}
                    onClick={() => { setSidebarOpen(!sidebarOpen); setSettingsOpen(false); }}
                >
                    <DocumentIcon />
                    <span className="text-[9px] font-semibold uppercase">Questions</span>
                </button>
                <button
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-500"
                    onClick={addNewQuestion}
                >
                    <PlusIcon />
                    <span className="text-[9px] font-semibold uppercase">Add</span>
                </button>
                <button className="flex-1 flex items-center justify-center" onClick={handleSave}>
                    <div className="w-11 h-11 -mt-4 rounded-xl bg-primary-600 dark:bg-primary-500 shadow-lg flex items-center justify-center text-white">
                        <SaveIcon />
                    </div>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-500">
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
