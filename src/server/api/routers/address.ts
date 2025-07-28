import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const addressRouter = createTRPCRouter({
    // 获取所有地址，支持排序
    list: protectedProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.address.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'asc' }
                    : { createdAt: 'desc' },
                where: { userId: ctx.session.user.id },
            });
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string(),
                phone: z.string(),
                province: z.string(),
                city: z.string(),
                district: z.string(),
                detail: z.string(),
                isDefault: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 查询当前用户的地址数量
            const addressCount = await ctx.db.address.count({
                where: { userId },
            });

            let isDefault = input.isDefault ?? false;

            // 如果没有地址，强制第一个为默认
            if (addressCount === 0) {
                isDefault = true;
            }

            // 如果要设为默认，先把其它地址的 isDefault 设为 false
            if (isDefault) {
                await ctx.db.address.updateMany({
                    where: { userId },
                    data: { isDefault: false },
                });
            }

            await ctx.db.address.create({
                data: {
                    ...input,
                    isDefault,
                    userId,
                },
            } as any);

            return {
                message: '创建成功',
            };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string(),
                phone: z.string(),
                province: z.string(),
                city: z.string(),
                district: z.string(),
                detail: z.string(),
                isDefault: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.address.update({ where: { id }, data });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 先查要删除的地址
            const addr = await ctx.db.address.findUnique({
                where: { id: input.id },
            });
            // 删除
            await ctx.db.address.delete({ where: { id: input.id } });

            // 如果被删的是默认地址
            if (addr?.isDefault) {
                // 查找该用户剩下的第一个地址
                const first = await ctx.db.address.findFirst({
                    where: { userId: addr.userId },
                    orderBy: { createdAt: 'asc' },
                });
                if (first) {
                    await ctx.db.address.update({
                        where: { id: first.id },
                        data: { isDefault: true },
                    });
                }
            }

            return { message: '删除成功' };
        }),

    deleteMany: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.address.deleteMany({
                where: { id: { in: input.ids } },
            });
        }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.address.findUnique({
                where: { id: input.id, userId: ctx.session.user.id },
            });
        }),
});
