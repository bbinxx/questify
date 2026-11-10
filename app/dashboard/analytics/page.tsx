import { DatabaseService } from '@/lib/db';
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';

const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
)

const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
)

export default async function AnalyticsDashboard() {
    const userId = await getSessionUserId();

    if (!userId) redirect('/login');

    const user = await DatabaseService.getUserById(userId);
    if (!user) redirect('/login');

    const sessions = await DatabaseService.getHostSessions(userId);

    return (
        <div className="h-screen overflow-y-auto bg-[#0B0F19] flex flex-col relative text-slate-200">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />

            {/* Header */}
            <header className="h-20 flex-shrink-0 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/10 flex items-center px-8 justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                        <span className="text-white font-black text-xl">Q</span>
                    </div>
                    <span className="font-black text-2xl tracking-tight text-white">Questify</span>
                </div>

                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="text-sm font-bold text-slate-400 hidden sm:block hover:text-indigo-400 transition-colors">
                        Library
                    </Link>
                    <Link href="/dashboard/analytics" className="text-sm font-bold text-white hidden sm:block hover:text-indigo-400 transition-colors">
                        Analytics
                    </Link>
                    <div className="h-6 w-px bg-white/10 hidden sm:block" />
                    <span className="text-sm font-bold text-indigo-300 hidden sm:block">
                        {user.username || 'Host'}
                    </span>
                    <form action={logout}>
                        <button className="text-sm font-bold text-slate-400 hover:text-rose-400 transition-colors">Logout</button>
                    </form>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 relative z-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tight">
                            <span className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400"><ChartIcon /></span>
                            Session Analytics
                        </h1>
                        <p className="text-slate-400 mt-2 font-medium ml-[4.5rem]">Review performance and insights from past games.</p>
                    </div>
                </div>

                {sessions.length === 0 ? (
                    <div className="text-center py-32 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-2xl">
                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl text-indigo-400"><ChartIcon /></span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3">No data yet</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">
                            Host your first game to generate analytics and player insights.
                        </p>
                        <Link href="/dashboard" className="inline-block px-8 py-4 bg-white text-indigo-950 font-black rounded-2xl hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300">Go to Library</Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sessions.map((session, i) => {
                            const totalQuestions = session.stats?.global?.totalAnswered || 0;
                            const accuracy = totalQuestions > 0 ? Math.round((session.stats?.global?.correctCount / totalQuestions) * 100) : 0;
                            const durationMinutes = Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000) || 1;

                            return (
                                <div key={session.id || i} className="bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl transition-all">
                                    <div className="p-8 md:p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 font-black text-xs rounded-lg tracking-widest uppercase border border-indigo-500/30">PIN: {session.roomCode}</span>
                                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{new Date(session.startedAt).toLocaleString()}</span>
                                            </div>
                                            <h2 className="text-3xl font-black text-white">Session report</h2>
                                        </div>
                                        <div className="flex gap-10 bg-black/20 p-6 rounded-2xl border border-white/5">
                                            <div className="text-center">
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Players</p>
                                                <p className="text-4xl font-black text-white">{session.players?.length || 0}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Accuracy</p>
                                                <p className={`text-4xl font-black ${accuracy >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{totalQuestions > 0 ? `${accuracy}%` : '—'}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Duration</p>
                                                <p className="text-4xl font-black text-white">{durationMinutes}m</p>
                                            </div>
                                        </div>
                                    </div>
                                    {session.stats?.totalQuestions !== 0 && <div className="p-8 md:p-10 bg-black/30">
                                        <h3 className="text-sm font-black text-slate-500 mb-8 uppercase tracking-widest flex items-center gap-3">
                                            Leaderboard Snapshot
                                            <div className="h-px flex-1 bg-white/5" />
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {session.players?.slice(0, 4).map((p: any, idx: number) => (
                                                <div key={p.id} className="bg-white/5 p-6 rounded-2xl flex items-center gap-5 border border-white/10 hover:bg-white/10 transition-colors">
                                                    <span className="text-2xl font-black text-white/20">#{idx + 1}</span>
                                                    <div className="text-4xl filter drop-shadow-lg">{p.avatar}</div>
                                                    <div>
                                                        <p className="font-bold text-white leading-tight mb-1">{p.name}</p>
                                                        <p className="text-sm font-black text-indigo-400">{p.score} pts</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>}
                                    <div className="px-8 pb-8 space-y-4">
                                        <h3 className="font-bold text-xl text-white">Activity results</h3>
                                        {(session.stats?.perQuestion || []).map((activity: any, index: number) => (
                                            <article key={activity.activityId || index} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                                <p className="text-xs font-bold text-indigo-300">{activity.kind === 'poll' ? 'Poll · unscored' : 'Quiz'}</p>
                                                <h4 className="font-bold text-white mt-2 break-words">{activity.text}</h4>
                                                <p className="text-sm text-slate-300 mt-2">{activity.totalAnswered} responses{activity.scored !== false ? ` · ${activity.correctCount} correct` : ''}</p>
                                                {activity.options && <ul className="mt-3 space-y-1">{activity.options.map((option: string, optionIndex: number) => <li key={optionIndex} className="text-sm text-slate-300 break-words">{option}: {activity.answerCounts?.[optionIndex] || 0}</li>)}</ul>}
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
