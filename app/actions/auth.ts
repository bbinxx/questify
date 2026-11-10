'use server';

import { DatabaseService } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setSession, clearSession, sessionConfigured } from '@/lib/session';
import { redirect } from 'next/navigation';

const SALT_ROUNDS = 10;

export async function signup(prevState: any, formData: FormData) {
    if (!sessionConfigured()) return { error: 'Sign-in is not configured. Contact the host administrator.', success: false };
    const rawUsername = formData.get('username');
    const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
    const rawPassword = formData.get('password');
    const password = typeof rawPassword === 'string' ? rawPassword : '';

    if (!/^[^\s/]{3,100}$/.test(username) || password.length < 8 || Buffer.byteLength(password) > 72) {
        return { error: 'Use a 3–100 character username or email and an 8–72 byte password', success: false };
    }

    try {
        const existingUser = await DatabaseService.getUserByUsername(username);

        if (existingUser) {
            return { error: 'Username already exists', success: false };
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = await DatabaseService.createUser(username, hashedPassword);

        // Create session
        await setSession(newUser.id);

        return { success: true, error: '' };
    } catch (error) {
        console.error('Signup error:', error);
        return { error: 'Failed to create account', success: false };
    }
}

export async function login(prevState: any, formData: FormData) {
    if (!sessionConfigured()) return { error: 'Sign-in is not configured. Contact the host administrator.', success: false };
    const rawUsername = formData.get('username');
    const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
    const rawPassword = formData.get('password');
    const password = typeof rawPassword === 'string' ? rawPassword : '';

    if (!username || !password || username.length > 100 || password.length > 1024) {
        return { error: 'Enter your username or email and password', success: false };
    }

    try {
        const user = await DatabaseService.getUserByUsername(username);

        if (!user || !user.password) {
            return { error: 'Invalid credentials', success: false };
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return { error: 'Invalid credentials', success: false };
        }

        await setSession(user.id);

        return { success: true, error: '' };
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Failed to login', success: false };
    }
}

export async function logout() {
    await clearSession();
    redirect('/login');
}
