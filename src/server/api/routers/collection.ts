import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';

export const collectionRouter = createTRPCRouter({
    // 获取所有合集，支持排序
    list: publicProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.collection.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'asc' }
                    : { createdAt: 'desc' },
            });
        }),

    create: superAdminProcedure
        .input(
            z.object({
                title: z.string(),
                description: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.collection.create({ data: input });
            return {
                message: '创建成功',
            };
        }),

    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.collection.update({ where: { id }, data });
        }),

    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.collection.delete({ where: { id: input.id } });
        }),

    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.collection.deleteMany({
                where: { id: { in: input.ids } },
            });
        }),
});
