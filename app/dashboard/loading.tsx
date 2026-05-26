export default function DashboardLoading() {
    return (
        <div className="h-screen overflow-hidden bg-[#0B0F19] flex flex-col relative text-slate-200">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />

            {/* Header Skeleton */}
            <header className="h-20 flex-shrink-0 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/10 flex items-center px-8 justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse flex items-center justify-center" />
                    <div className="w-24 h-6 bg-white/10 rounded animate-pulse" />
                </div>
            </header>

            {/* Main Content Spinner */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-6" />
                <span className="text-white font-black tracking-widest text-lg animate-pulse">LOADING DASHBOARD...</span>
            </div>
        </div>
    )
}
