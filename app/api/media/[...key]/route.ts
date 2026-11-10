import { mediaKey } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, r2Bucket, r2Configured } from '@/lib/r2';

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
    try {
        const key = mediaKey((await params).key);
        if (!key) return new NextResponse('Missing key', { status: 400 });

        if (!r2Configured) {
            return new NextResponse('Storage not configured', { status: 500 });
        }

        const command = new GetObjectCommand({
            Bucket: r2Bucket,
            Key: key,
        });

        // Generate a URL valid for 1 hour
        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        
        // Redirect the user to the presigned URL
        return NextResponse.redirect(signedUrl, { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
