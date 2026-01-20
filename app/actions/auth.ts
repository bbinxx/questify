'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SALT_ROUNDS = 10;
const SESSION_DURATION = 60 * 60 * 24 * 7; // 1 week

export async function signup(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: 'Username and password are required', success: false };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return { error: 'Username already exists', success: false };
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        // Create session (simple cookie for now)
        cookies().set('userId', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_DURATION,
            path: '/',
        });

        return { success: true, error: '' };
    } catch (error) {
        console.error('Signup error:', error);
        return { error: 'Failed to create account', success: false };
    }
}

export async function login(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: 'Username and password are required', success: false };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return { error: 'Invalid credentials', success: false };
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return { error: 'Invalid credentials', success: false };
        }

        cookies().set('userId', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_DURATION,
            path: '/',
        });

        return { success: true, error: '' };
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Failed to login', success: false };
    }
}

export async function logout() {
    cookies().delete('userId');
    redirect('/login');
}
