import QuestionMedia from '../game/QuestionMedia'

export default function ContentSlide({ title, body, mediaUrl }: { title: string; body: string; mediaUrl?: string }) {
    return (
        <section aria-label="Presentation slide" className="h-full flex-1 min-h-0 overflow-y-auto bg-slate-950 text-white p-6 sm:p-10 md:p-16 flex flex-col justify-start gap-6">
            <p className="text-sm font-bold text-indigo-300">Presentation</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black break-words leading-tight">{title}</h1>
            {mediaUrl && <QuestionMedia src={mediaUrl} className="max-h-72 max-w-full object-contain rounded-2xl self-start" />}
            <p className="text-lg sm:text-2xl md:text-3xl leading-relaxed whitespace-pre-wrap break-words max-w-5xl">{body}</p>
        </section>
    )
}
