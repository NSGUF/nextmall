import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';

export const bannerRouter = createTRPCRouter({
    // 获取所有banner，支持排序和分页
    list: publicProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    isActive: z.boolean().optional(), // 新增 isActive 参数
                    page: z.number().min(1).optional().default(1),
                    pageSize: z.number().min(1).max(100).optional().default(10),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 10;
            const skip = (page - 1) * pageSize;

            const where =
                input?.isActive === true ? { isActive: true } : undefined;

            // 获取总数
            const total = await ctx.db.banner.count({ where });

            // 获取分页数据
            const data = await ctx.db.banner.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'asc' }
                    : { sort: 'asc' },
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

    create: superAdminProcedure
        .input(
            z.object({
                title: z.string(),
                description: z.string().optional(),
                image: z.string(),
                isActive: z.boolean(),
                sort: z.number().optional(),
                link: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.banner.create({ data: input } as any);
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
                image: z.string(),
                isActive: z.boolean(),
                sort: z.number().optional(),
                link: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.banner.update({ where: { id }, data });
        }),

    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.banner.delete({ where: { id: input.id } });
        }),

    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.banner.deleteMany({
                where: { id: { in: input.ids } },
            });
        }),
});
