'use client';

import { signup } from '@/app/actions/auth';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const initialState = {
    error: '',
    success: false,
};

export default function SignupPage() {
    const [state, formAction] = useFormState(signup, initialState);
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            router.push('/dashboard');
        }
    }, [state?.success, router]);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h1>

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-1">Username</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full bg-gray-700 text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Choose a username"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-gray-700 text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Choose a password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition-colors"
                    >
                        Sign Up
                    </button>

                    {state?.error && (
                        <p className="text-red-500 text-center text-sm">{state.error}</p>
                    )}
                </form>

                <p className="text-gray-400 mt-6 text-center text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-green-400 hover:text-green-300">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
