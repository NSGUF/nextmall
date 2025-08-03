import { type NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Next.js 13+ Route Handler context: params is always Promise<any> in type RouteContext
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        // Await params to match RouteContext type
        const { path } = await context.params;
        if (!path || path.length === 0) {
            return new NextResponse('File not found', { status: 404 });
        }

        // 构建文件路径
        const filePath = join(process.cwd(), 'output', 'uploads', ...path);
        // 检查文件是否存在
        if (!existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        // 读取文件
        const fileBuffer = await readFile(filePath);

        // 根据文件扩展名设置正确的Content-Type
        const ext = path[path.length - 1].split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';

        switch (ext) {
            case 'jpg':
            case 'jpeg':
                contentType = 'image/jpeg';
                break;
            case 'png':
                contentType = 'image/png';
                break;
            case 'gif':
                contentType = 'image/gif';
                break;
            case 'svg':
                contentType = 'image/svg+xml';
                break;
            case 'webp':
                contentType = 'image/webp';
                break;
            case 'mp4':
                contentType = 'video/mp4';
                break;
            case 'webm':
                contentType = 'video/webm';
                break;
            case 'ogg':
                contentType = 'video/ogg';
                break;
            default:
                contentType = 'application/octet-stream';
        }

        // 返回文件
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000', // 缓存1年
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}