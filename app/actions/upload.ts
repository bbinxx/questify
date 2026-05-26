'use server';

import { uploadToR2 } from '@/lib/r2';
import { cookies } from 'next/headers';

export async function uploadMedia(formData: FormData) {
    const userId = cookies().get('userId')?.value;
    if (!userId) {
        return { error: 'Unauthorized', success: false };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { error: 'No file provided', success: false };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Generate a unique filename using userId and timestamp to keep files organized
        const extension = file.name.split('.').pop() || 'png';
        const uniqueName = `media/${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
        
        const fileUrl = await uploadToR2(buffer, uniqueName, file.type);
        
        return { success: true, url: fileUrl };
    } catch (e: any) {
        console.error('R2 upload failed:', e);
        return { error: e.message || 'Failed to upload file to Cloudflare R2', success: false };
    }
}
