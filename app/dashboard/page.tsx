import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';

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

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            games: {
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { questions: true }
                    }
                }
            }
        }
    });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <span className="text-white font-bold text-xl">Q</span>
                    </div>
                    <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Questify</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 hidden sm:block">
                        Hi, {user.username}
                    </span>
                    <form action={logout}>
                        <button className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors">
                            Logout
                        </button>
                    </form>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">My Library</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and host your interactive quizzes</p>
                    </div>
                    <Link
                        href="/create"
                        className="btn btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5 shadow-lg shadow-primary-500/20"
                    >
                        <PlusIcon />
                        <span>Create Quiz</span>
                    </Link>
                </div>

                {user.games.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <QuestionIcon />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No quizzes yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                            Create your first quiz and start engaging your audience today.
                        </p>
                        <Link
                            href="/create"
                            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                        >
                            Create your first quiz →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {user.games.map((game) => (
                            <div
                                key={game.id}
                                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 flex flex-col"
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${game.status === 'FINISHED' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                                game.status === 'PLAYING' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30' :
                                                    'bg-amber-100 text-amber-600 dark:bg-amber-950/30'
                                            }`}>
                                            {game.status}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400 uppercase">
                                            {new Date(game.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {game.title}
                                    </h3>

                                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                            <QuestionIcon />
                                            <span>{game._count.questions} Questions</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                    <Link
                                        href={`/present/${game.id}`}
                                        className="btn btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-2"
                                    >
                                        <PlayIcon />
                                        Host
                                    </Link>
                                    <Link
                                        href={`/edit/${game.id}`}
                                        className="btn btn-outline px-4 py-2 text-xs flex items-center justify-center gap-2"
                                    >
                                        <EditIcon />
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
