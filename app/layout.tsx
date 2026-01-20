import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Questify - Create Interactive Quizzes',
    description: 'Create engaging, interactive quizzes with Questify. Modern quiz editor with beautiful themes and real-time collaboration.',
    keywords: 'quiz, questify, interactive, education, learning, quiz maker',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="theme-color" content="#0d9488" media="(prefers-color-scheme: light)" />
                <meta name="theme-color" content="#134e4a" media="(prefers-color-scheme: dark)" />
            </head>
            <body>{children}</body>
        </html>
    )
}


