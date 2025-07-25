import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';

export const courseRouter = createTRPCRouter({
    // 获取所有课程，支持排序和分页
    list: publicProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    collectionId: z.string().optional(),
                    isPublished: z.boolean().optional(),
                    page: z.number().min(1).optional().default(1),
                    pageSize: z.number().min(1).max(100).optional().default(10),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 10;
            const skip = (page - 1) * pageSize;

            const where = {
                ...(input?.collectionId
                    ? { collectionId: input.collectionId }
                    : undefined),
                ...(input?.isPublished
                    ? { isPublished: input.isPublished }
                    : undefined),
            };

            // 获取总数
            const total = await ctx.db.course.count({ where });

            // 获取分页数据
            const data = await ctx.db.course.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'asc' }
                    : { createdAt: 'desc' },
                where,
                skip,
                take: pageSize,
            });

            return {
                data,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            };
        }),

    // 获取单个课程详情
    get: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const course = await ctx.db.course.findUnique({
                where: { id: input.id },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                    collection: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            if (!course) {
                throw new Error('课程不存在');
            }

            // 增加播放次数
            await ctx.db.course.update({
                where: { id: input.id },
                data: { views: { increment: 1 } },
            });

            return course;
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
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.course.create({
                data: {
                    ...input,
                    creatorId: ctx.session.user.id,
                },
            } as any);
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
