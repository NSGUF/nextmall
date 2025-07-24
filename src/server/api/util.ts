import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// MIME 类型到文件扩展名的映射
const MIME_TO_EXTENSION: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/tiff': 'tiff',
    'image/avif': 'avif',
};

// 视频 MIME 类型到文件扩展名的映射
const VIDEO_MIME_TO_EXTENSION: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/3gpp': '3gp',
    'video/x-flv': 'flv',
};

export const utilRouter = createTRPCRouter({
    uploadImage: publicProcedure
        .input(
            z.object({
                image: z.string(), // base64 encoded image
                filename: z.string(),
                folder: z.string().optional().default('uploads'), // 可选的文件夹名称
            })
        )
        .mutation(async ({ input }) => {
            try {
                const { image, filename, folder } = input;

                // 验证 base64 格式
                if (!image.startsWith('data:image/')) {
                    throw new Error('Invalid image format');
                }

                // 提取文件扩展名
                const mimeType = image.split(';')[0]?.split(':')[1];
                const extension = MIME_TO_EXTENSION[mimeType || ''] || 'jpg';

                // 生成唯一文件名
                const timestamp = Date.now();
                const randomString = Math.random()
                    .toString(36)
                    .substring(2, 15);
                const newFilename = `${timestamp}_${randomString}.${extension}`;

                // 创建上传目录
                const uploadDir = join(
                    process.cwd(),
                    'public/uploads/images',
                    folder
                );
                if (!existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true });
                }

                // 将 base64 转换为 buffer
                const base64Data = image.replace(
                    /^data:image\/[^;]+;base64,/,
                    ''
                );
                const buffer = Buffer.from(base64Data, 'base64');

                // 保存文件
                const filePath = join(uploadDir, newFilename);
                await writeFile(filePath, buffer);

                // 返回可访问的 URL
                const url = `/uploads/images/${folder}/${newFilename}`;

                return {
                    success: true,
                    url,
                    filename: newFilename,
                    originalFilename: filename,
                };
            } catch (error) {
                console.error('Upload error:', error);
                throw new Error('文件上传失败');
            }
        }),

    uploadMultipleImages: publicProcedure
        .input(
            z.object({
                images: z.array(
                    z.object({
                        image: z.string(), // base64 encoded image
                        filename: z.string(),
                    })
                ),
                folder: z.string().optional().default('uploads'),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const { images, folder } = input;
                const results = [];

                // 创建上传目录
                const uploadDir = join(process.cwd(), 'public', folder);
                if (!existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true });
                }

                for (const imageData of images) {
                    const { image, filename } = imageData;

                    // 验证 base64 格式
                    if (!image.startsWith('data:image/')) {
                        throw new Error(`Invalid image format for ${filename}`);
                    }

                    // 提取文件扩展名
                    const mimeType = image.split(';')[0]?.split(':')[1];
                    const extension =
                        MIME_TO_EXTENSION[mimeType || ''] || 'jpg';

                    // 生成唯一文件名
                    const timestamp = Date.now();
                    const randomString = Math.random()
                        .toString(36)
                        .substring(2, 15);
                    const newFilename = `${timestamp}_${randomString}.${extension}`;

                    // 将 base64 转换为 buffer
                    const base64Data = image.replace(
                        /^data:image\/[^;]+;base64,/,
                        ''
                    );
                    const buffer = Buffer.from(base64Data, 'base64');

                    // 保存文件
                    const filePath = join(uploadDir, newFilename);
                    await writeFile(filePath, buffer);

                    // 添加到结果数组
                    const url = `/${folder}/${newFilename}`;
                    results.push({
                        success: true,
                        url,
                        filename: newFilename,
                        originalFilename: filename,
                    });
                }

                return {
                    success: true,
                    results,
                };
            } catch (error) {
                console.error('Multiple upload error:', error);
                throw new Error('文件上传失败');
            }
        }),

    // 视频上传
    uploadVideo: publicProcedure
        .input(
            z.object({
                video: z.string(), // base64 encoded video
                filename: z.string(),
                folder: z.string().optional().default('videos'),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const { video, filename, folder } = input;

                // 验证 base64 格式
                if (!video.startsWith('data:video/')) {
                    throw new Error('Invalid video format');
                }

                // 提取文件扩展名
                const mimeType = video.split(';')[0]?.split(':')[1];
                const extension =
                    VIDEO_MIME_TO_EXTENSION[mimeType || ''] || 'mp4';

                // 生成唯一文件名
                const timestamp = Date.now();
                const randomString = Math.random()
                    .toString(36)
                    .substring(2, 15);
                const newFilename = `${timestamp}_${randomString}.${extension}`;

                // 创建上传目录
                const uploadDir = join(
                    process.cwd(),
                    'public/uploads/videos',
                    folder
                );
                if (!existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true });
                }

                // 将 base64 转换为 buffer
                const base64Data = video.replace(
                    /^data:video\/[^;]+;base64,/,
                    ''
                );
                const buffer = Buffer.from(base64Data, 'base64');

                // 保存文件
                const filePath = join(uploadDir, newFilename);
                await writeFile(filePath, buffer);

                // 视频上传完成，不提取封面图和时长

                // 返回可访问的 URL
                const url = `/uploads/videos/${folder}/${newFilename}`;

                return {
                    success: true,
                    url,
                    filename: newFilename,
                    originalFilename: filename,
                };
            } catch (error) {
                console.error('Video upload error:', error);
                throw new Error('视频上传失败');
            }
        }),
});
