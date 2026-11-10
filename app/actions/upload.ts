'use server';

import { randomUUID } from 'node:crypto';
import { validateUpload, MIME_EXTENSIONS } from '@/lib/validation';
import { uploadToR2 } from '@/lib/r2';
import { getSessionUserId } from '@/lib/session'

export async function uploadMedia(formData: FormData) {
    const userId = await getSessionUserId();
    if (!userId) {
        return { error: 'Unauthorized', success: false };
    }

    const file = formData.get('file') as File;
    const error = validateUpload(file);
    if (error) return { error, success: false };

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate a unique filename using userId and timestamp to keep files organized
        const extension = MIME_EXTENSIONS[file.type as keyof typeof MIME_EXTENSIONS];
        const uniqueName = `media/${userId}/${randomUUID()}.${extension}`;

        const fileUrl = await uploadToR2(buffer, uniqueName, file.type);

        return { success: true, url: fileUrl };
    } catch (e: any) {
        console.error('R2 upload failed:', e);
        return { error: 'Unable to upload media. Please try again.', success: false };
    }
}
