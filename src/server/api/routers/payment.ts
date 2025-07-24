import { z } from 'zod';
import {
    createTRPCRouter,
    superAdminProcedure,
    publicProcedure,
} from '@/server/api/trpc';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const paymentRouter = createTRPCRouter({
    // 获取支付码
    get: superAdminProcedure.query(async ({ ctx }) => {
        const payment = await ctx.db.payment.findFirst({
            orderBy: { createdAt: 'desc' },
        });
        return payment;
    }),

    // 上传支付码
    upload: superAdminProcedure
        .input(
            z.object({
                image: z.string(), // base64 格式的图片
                filename: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                // 解析 base64 图片
                const matches = /^data:image\/([a-zA-Z]+);base64,(.+)$/.exec(
                    input.image
                );
                if (!matches) {
                    throw new Error('无效的图片格式');
                }

                const imageType = matches[1];
                const imageData = matches[2];

                // 验证图片类型
                const allowedTypes = ['jpeg', 'jpg', 'png', 'gif'];
                if (!allowedTypes.includes(imageType.toLowerCase())) {
                    throw new Error('不支持的图片格式，请使用 JPG、PNG 或 GIF');
                }

                // 创建上传目录
                const uploadDir = join(
                    process.cwd(),
                    'public',
                    'uploads',
                    'payment'
                );
                if (!existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true });
                }

                // 生成文件名
                const timestamp = Date.now();
                const extension = imageType === 'jpeg' ? 'jpg' : imageType;
                const filename = `payment-code-${timestamp}.${extension}`;
                const filepath = join(uploadDir, filename);

                // 保存文件
                const buffer = Buffer.from(imageData, 'base64');
                await writeFile(filepath, buffer);

                // 生成访问 URL
                const imageUrl = `/uploads/images/payment/${filename}`;

                // 删除旧的支付码记录（如果存在）
                await ctx.db.payment.deleteMany({});

                // 保存到数据库
                const payment = await ctx.db.payment.create({
                    data: {
                        image: imageUrl,
                        filename: input.filename,
                        originalName: input.filename,
                    },
                });

                return {
                    success: true,
                    message: '支付码上传成功',
                    data: payment,
                };
            } catch (error) {
                console.error('支付码上传失败:', error);
                throw new Error(
                    error instanceof Error ? error.message : '上传失败'
                );
            }
        }),

    // 删除支付码
    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const payment = await ctx.db.payment.findUnique({
                where: { id: input.id },
            });

            if (!payment) {
                throw new Error('支付码不存在');
            }

            // 删除数据库记录
            await ctx.db.payment.delete({
                where: { id: input.id },
            });

            // TODO: 可以在这里添加删除文件的逻辑
            // 但为了安全起见，暂时保留文件

            return {
                success: true,
                message: '支付码删除成功',
            };
        }),
});
