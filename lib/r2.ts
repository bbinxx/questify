import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
export const r2Bucket = R2_BUCKET_NAME;
export const r2Configured = Boolean((R2_ENDPOINT || R2_ACCOUNT_ID) && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);

export const r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: !!R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

export async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
    if (!r2Configured) {
        throw new Error('Missing Cloudflare R2 configuration in environment variables.');
    }

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
    });

    await r2Client.send(command);

    // If a custom public URL is configured, use it directly
    if (R2_PUBLIC_URL) {
        const cleanPublicUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
        return `${cleanPublicUrl}/${fileName}`;
    }

    // Otherwise, route through our secure pre-signed URL proxy
    return `/api/media/${fileName}`;
}
