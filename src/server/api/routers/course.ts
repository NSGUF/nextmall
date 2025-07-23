import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';

export const courseRouter = createTRPCRouter({
    // 获取所有课程，支持排序
    list: publicProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    collectionId: z.string().optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.course.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'asc' }
                    : { createdAt: 'desc' },
                where: input?.collectionId
                    ? { collectionId: input.collectionId }
                    : undefined,
            });
        }),

    create: superAdminProcedure
        .input(
            z.object({
                title: z.string(),
                description: z.string(),
                videoUrl: z.string(),
                coverImage: z.string().optional(),
                duration: z.number(),
                isPublished: z.boolean(),
                collectionId: z.string().optional(),
                tags: z.array(z.string()),
                isFree: z.boolean(),
                price: z.number().optional(),
                order: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.course.create({
                data: {
                    ...input,
                    creatorId: ctx.session.user.id,
                },
            });
            return {
                message: '创建成功',
            };
        }),

    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string(),
                videoUrl: z.string(),
                coverImage: z.string().optional(),
                duration: z.number(),
                isPublished: z.boolean(),
                collectionId: z.string().optional(),
                tags: z.array(z.string()),
                isFree: z.boolean(),
                price: z.number().optional(),
                order: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.course.update({ where: { id }, data });
        }),

    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.course.delete({ where: { id: input.id } });
        }),

    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.course.deleteMany({
                where: { id: { in: input.ids } },
            });
        }),
});
