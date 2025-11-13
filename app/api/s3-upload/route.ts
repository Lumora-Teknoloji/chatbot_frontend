// app/api/s3-upload/route.ts
// Alternatif yükleme yöntemi: Dosyayı server-side'dan S3'e yükler (CORS sorunu olmaz)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'Dosya bulunamadı' },
                { status: 400 }
            );
        }

        // S3 yapılandırması
        const S3_BUCKET = process.env.S3_BUCKET_NAME;
        const S3_REGION = process.env.S3_REGION || 'us-east-1';
        const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
        const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

        if (!S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
            return NextResponse.json(
                { error: 'S3 yapılandırması eksik' },
                { status: 500 }
            );
        }

        // Benzersiz dosya adı oluştur
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `uploads/${timestamp}-${randomString}-${sanitizedFileName}`;

        // AWS SDK v3
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

        const s3Client = new S3Client({
            region: S3_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });

        // Dosyayı buffer'a çevir
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // S3'e yükle
        // Not: ACL kullanılmıyor çünkü modern S3 bucket'ları ACL'leri devre dışı bırakır
        // Public erişim bucket policy ile sağlanmalı
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);

        // Presigned URL oluştur (bucket policy olmadan da çalışır, 1 yıl geçerli)
        // Bu geçici bir çözüm - ideal olarak bucket policy kullanılmalı
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        
        const getObjectCommand = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
        });

        // Presigned URL oluştur (maksimum 7 gün geçerli - AWS limiti)
        const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
            expiresIn: 604800 // 7 gün (saniye cinsinden) - AWS maksimum limiti
        });

        // Public URL de döndür (bucket policy eklendikten sonra kullanılabilir)
        let publicUrl: string;
        if (S3_REGION === 'us-east-1') {
            publicUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
        } else {
            publicUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
        }

        return NextResponse.json({
            success: true,
            url: presignedUrl, // Presigned URL kullan (bucket policy olmadan çalışır)
            publicUrl, // Public URL (bucket policy eklendikten sonra kullanılabilir)
            key,
        });
    } catch (error) {
        console.error('S3 yükleme hatası:', error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        return NextResponse.json(
            { error: `Dosya yüklenemedi: ${errorMessage}` },
            { status: 500 }
        );
    }
}

