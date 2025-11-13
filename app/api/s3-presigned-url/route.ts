// app/api/s3-presigned-url/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { fileName, fileType } = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json(
                { error: 'fileName ve fileType gerekli' },
                { status: 400 }
            );
        }

        // S3 yapılandırması için environment variable'lar
        const S3_BUCKET = process.env.S3_BUCKET_NAME;
        const S3_REGION = process.env.S3_REGION || 'us-east-1';
        const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
        const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

        if (!S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
            const missingVars = [];
            if (!S3_BUCKET) missingVars.push('S3_BUCKET_NAME');
            if (!AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID');
            if (!AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY');
            
            return NextResponse.json(
                { 
                    error: 'S3 yapılandırması eksik',
                    details: `Eksik environment variable'lar: ${missingVars.join(', ')}. Lütfen .env.local dosyasına ekleyin.`
                },
                { status: 500 }
            );
        }

        // Benzersiz dosya adı oluştur
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `uploads/${timestamp}-${randomString}-${sanitizedFileName}`;

        // AWS SDK v3 kullanarak presigned URL oluştur
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

        const s3Client = new S3Client({
            region: S3_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: fileType,
        });

        // Presigned URL oluştur (15 dakika geçerli)
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

        return NextResponse.json({
            presignedUrl,
            key,
            url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`,
        });
    } catch (error) {
        console.error('Presigned URL oluşturulurken hata:', error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        return NextResponse.json(
            { error: `Presigned URL oluşturulamadı: ${errorMessage}` },
            { status: 500 }
        );
    }
}

