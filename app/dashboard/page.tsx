import { DatabaseService } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import DeleteGameButton from './components/DeleteGameButton';

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
)

const PlayIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
)

const QuestionIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

export default async function DashboardPage() {
    const userId = cookies().get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    const user = await DatabaseService.getUserWithGames(userId);

    if (!user) {
        redirect('/login');
    }

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
                    <Link href="/dashboard" className="text-sm font-bold text-white hidden sm:block hover:text-indigo-400 transition-colors">
                        Library
                    </Link>
                    <Link href="/dashboard/analytics" className="text-sm font-bold text-slate-400 hidden sm:block hover:text-indigo-400 transition-colors">
                        Analytics
                    </Link>
                    <div className="h-6 w-px bg-white/10 hidden sm:block" />
                    <span className="text-sm font-bold text-indigo-300 hidden sm:block">
                        {user.username}
                    </span>
                    <form action={logout}>
                        <button className="text-sm font-bold text-slate-400 hover:text-rose-400 transition-colors">
                            Logout
                        </button>
                    </form>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 relative z-0">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">My Library</h1>
                        <p className="text-slate-400 mt-2 font-medium">Manage and host your interactive live events.</p>
                    </div>
                    <Link
                        href="/create"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-950 font-black rounded-2xl hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300"
                    >
                        <PlusIcon />
                        <span>Create New Event</span>
                    </Link>
                </div>

                {user.games.length === 0 ? (
                    <div className="text-center py-32 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-2xl">
                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl text-indigo-400">✨</span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3">No events yet</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">
                            Your library is empty. Create your first live event to start engaging your audience.
                        </p>
                        <Link href="/create" className="text-indigo-400 font-bold hover:text-white transition-colors">
                            Start building →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {user.games.map((game) => (
                            <div
                                key={game.id}
                                className="group bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden hover:border-indigo-500/50 hover:bg-white/10 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col relative"
                            >
                                <div className="p-8 flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${game.status === 'FINISHED' ? 'bg-slate-800 text-slate-400' :
                                                game.status === 'PLAYING' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
                                                    'bg-amber-900/50 text-amber-400 border border-amber-500/30'
                                            }`}>
                                            {game.status}
                                        </span>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {new Date(game.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="font-black text-2xl text-white mb-4 line-clamp-2 leading-tight">
                                        {game.title}
                                    </h3>

                                    <div className="flex items-center gap-4 text-indigo-300">
                                        <div className="flex items-center gap-2 text-sm font-bold bg-indigo-500/10 px-3 py-1.5 rounded-lg">
                                            <QuestionIcon />
                                            <span>{game._count.questions} Questions</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-black/20 border-t border-white/5 flex gap-3">
                                    <Link
                                        href={`/present/${game.id}`}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <PlayIcon />
                                        HOST LIVE
                                    </Link>
                                    <Link
                                        href={`/edit/${game.id}`}
                                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <EditIcon />
                                        Edit
                                    </Link>
                                    <DeleteGameButton gameId={game.id} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
