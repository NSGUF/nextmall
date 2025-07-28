import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';

export const categoryRouter = createTRPCRouter({
    // 获取所有分类，支持排序和分页
    list: publicProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    page: z.number().min(1).optional().default(1),
                    pageSize: z.number().min(1).max(100).optional().default(10),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 10;
            const skip = (page - 1) * pageSize;

            // 获取总数
            const total = await ctx.db.category.count();

            // 获取分页数据
            const data = await ctx.db.category.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'asc' }
                    : { createdAt: 'desc' },
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
                name: z.string(),
                description: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.category.create({ data: input } as any);
            return {
                message: '创建成功',
            };
        }),

    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string(),
                description: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.category.update({ where: { id }, data });
        }),

    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查分类下是否有商品
            const productCount = await ctx.db.product.count({
                where: {
                    categoryId: input.id,
                    isDeleted: false,
                },
            });

            if (productCount > 0) {
                throw new Error(
                    `无法删除：该分类下还有 ${productCount} 个商品`
                );
            }

            return ctx.db.category.delete({ where: { id: input.id } });
        }),

    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            // 检查这些分类下是否有商品
            const categoriesWithProducts = await ctx.db.category.findMany({
                where: {
                    id: { in: input.ids },
                    products: {
                        some: {
                            isDeleted: false,
                        },
                    },
                },
                select: { id: true, name: true },
            });

            if (categoriesWithProducts.length > 0) {
                const categoryNames = categoriesWithProducts
                    .map((c) => c.name)
                    .join('、');
                throw new Error(`无法删除：分类 ${categoryNames} 下还有商品`);
            }

            return ctx.db.category.deleteMany({
                where: { id: { in: input.ids } },
            });
        }),
});
