export interface Answer {
    text: string
    color: string
    icon: string
    correct?: boolean
}

export interface Question {
    id: string
    question: string
    time: number
    answers: Answer[]
}

export const QUIZ_DATA: Question[] = [
    {
        id: 'q1',
        question: "What is the powerhouse of the cell?",
        time: 15,
        answers: [
            { text: "Nucleus", color: "bg-rose-500", icon: "△" },
            { text: "Mitochondria", color: "bg-blue-500", icon: "◇", correct: true },
            { text: "Ribosome", color: "bg-amber-500", icon: "○" },
            { text: "Cytoplasm", color: "bg-emerald-500", icon: "□" }
        ]
    },
    {
        id: 'q2',
        question: "Which planet is known as the Red Planet?",
        time: 15,
        answers: [
            { text: "Venus", color: "bg-rose-500", icon: "△" },
            { text: "Mars", color: "bg-blue-500", icon: "◇", correct: true },
            { text: "Jupiter", color: "bg-amber-500", icon: "○" },
            { text: "Saturn", color: "bg-emerald-500", icon: "□" }
        ]
    },
    {
        id: 'q3',
        question: "What is 2 + 2?",
        time: 15,
        answers: [
            { text: "3", color: "bg-rose-500", icon: "△" },
            { text: "4", color: "bg-blue-500", icon: "◇", correct: true },
            { text: "5", color: "bg-amber-500", icon: "○" },
            { text: "22", color: "bg-emerald-500", icon: "□" }
        ]
    },
    {
        id: 'q4',
        question: "Which language is used for web dev?",
        time: 15,
        answers: [
            { text: "Python", color: "bg-rose-500", icon: "△" },
            { text: "Java", color: "bg-blue-500", icon: "◇" },
            { text: "JavaScript", color: "bg-amber-500", icon: "○", correct: true },
            { text: "C++", color: "bg-emerald-500", icon: "□" }
        ]
    }
]
