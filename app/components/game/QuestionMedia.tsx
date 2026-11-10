'use client'

export default function QuestionMedia({ src, className = '' }: { src: string; className?: string }) {
    const video = /\.(mp4|webm|mov)(?:[?#]|$)/i.test(src)
    return video ? (
        <video src={src} className={className} controls playsInline preload="metadata" aria-label="Question video" />
    ) : (
        <img src={src} alt="Question media" className={className} loading="lazy" />
    )
}
