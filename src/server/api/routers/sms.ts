import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { logger } from '@/server/api/utils/logger';

export const smsRouter = createTRPCRouter({
    // 发送验证码
    sendCode: publicProcedure
        .input(
            z.object({
                phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
                type: z.enum(['REGISTER', 'LOGIN', 'RESET'], {
                    errorMap: () => ({ message: '验证码类型不正确' }),
                }),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { phone, type } = input;

            // 检查是否在60秒内已发送过验证码
            const recentCode = await ctx.db.smsCode.findFirst({
                where: {
                    phone,
                    type,
                    createdAt: {
                        gte: new Date(Date.now() - 60 * 1000), // 60秒内
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (recentCode) {
                throw new Error('请等待60秒后再次发送验证码');
            }

            // 生成6位数字验证码
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // 设置过期时间（5分钟）
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            // 保存验证码到数据库
            await ctx.db.smsCode.create({
                data: {
                    phone,
                    code,
                    type,
                    expiresAt,
                },
            });

            // 记录发送验证码日志
            await logger.smsSend(ctx, phone, type);

            // TODO: 这里应该调用真实的短信服务API发送验证码
            // 目前为了开发方便，我们在控制台输出验证码
            // console.log(`发送验证码到 ${phone}: ${code}`);

            // 在开发环境下，可以返回验证码用于测试
            if (process.env.NODE_ENV === 'development') {
                return {
                    message: '验证码发送成功',
                    code, // 仅在开发环境返回
                };
            }

            return {
                message: '验证码发送成功',
                // code,
            };
        }),

    // 验证验证码
    verifyCode: publicProcedure
        .input(
            z.object({
                phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
                code: z.string().length(6, '验证码必须是6位数字'),
                type: z.enum(['REGISTER', 'LOGIN', 'RESET'], {
                    errorMap: () => ({ message: '验证码类型不正确' }),
                }),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { phone, code, type } = input;

            // 查找有效的验证码
            const smsCode = await ctx.db.smsCode.findFirst({
                where: {
                    phone,
                    code,
                    type,
                    used: false,
                    expiresAt: {
                        gt: new Date(), // 未过期
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (!smsCode) {
                // 记录验证失败日志
                await logger.smsVerify(ctx, phone, type, false);
                throw new Error('验证码无效或已过期');
            }

            // 标记验证码为已使用
            await ctx.db.smsCode.update({
                where: { id: smsCode.id },
                data: { used: true },
            });

            // 记录验证成功日志
            await logger.smsVerify(ctx, phone, type, true);

            return {
                message: '验证码验证成功',
                verified: true,
            };
        }),

    // 清理过期验证码（可以通过定时任务调用）
    cleanExpiredCodes: publicProcedure.mutation(async ({ ctx }) => {
        const result = await ctx.db.smsCode.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });

        return {
            message: `清理了 ${result.count} 条过期验证码`,
            count: result.count,
        };
    }),
});
