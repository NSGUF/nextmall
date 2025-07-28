import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { logger, logOperation } from '@/server/api/utils/logger';

export const cartRouter = createTRPCRouter({
    // 获取购物车列表
    list: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // 记录查看购物车日志
        await logOperation(ctx, {
            action: 'LIST',
            module: 'CART',
            description: '查看购物车',
            targetId: userId,
            targetType: 'User',
        });

        return ctx.db.cart.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        vendor: true,
                        specs: true,
                    },
                },
                spec: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }),

    // 添加商品到购物车
    add: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
                specId: z.string().optional(),
                quantity: z.number().min(1).default(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 获取商品信息用于日志记录
            const product = await ctx.db.product.findUnique({
                where: { id: input.productId },
                select: { id: true, title: true },
            });

            if (!product) {
                throw new Error('商品不存在');
            }

            // 检查是否已存在相同商品和规格
            const existing = await ctx.db.cart.findFirst({
                where: {
                    userId,
                    productId: input.productId,
                    specId: input.specId ?? null,
                },
            });

            let result;
            if (existing) {
                // 如果已存在，更新数量
                result = await ctx.db.cart.update({
                    where: { id: existing.id },
                    data: { quantity: existing.quantity + input.quantity },
                });
            } else {
                // 如果不存在，创建新的购物车项
                result = await ctx.db.cart.create({
                    data: {
                        userId,
                        productId: input.productId,
                        specId: input.specId,
                        quantity: input.quantity,
                    },
                });
            }

            // 记录添加购物车日志
            await logger.cartAdd(
                ctx,
                product.id,
                product.title,
                input.quantity
            );

            return result;
        }),

    // 更新购物车商品数量
    updateQuantity: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                quantity: z.number().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 先获取购物车项和商品规格信息
            const cartItem = await ctx.db.cart.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                include: {
                    spec: true,
                    product: true,
                },
            });

            if (!cartItem) {
                throw new Error('购物车商品不存在');
            }

            // 检查库存
            if (cartItem.spec && cartItem.spec.stock < input.quantity) {
                throw new Error(`库存不足，当前库存：${cartItem.spec.stock}`);
            }

            const result = await ctx.db.cart.update({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                data: { quantity: input.quantity },
            });

            // 记录更新购物车日志
            await logger.cartUpdate(
                ctx,
                cartItem.productId,
                cartItem.product.title,
                input.quantity
            );

            return result;
        }),

    // 删除购物车商品
    remove: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 先获取购物车项信息用于日志记录
            const cartItem = await ctx.db.cart.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                include: {
                    product: true,
                },
            });

            if (!cartItem) {
                throw new Error('购物车商品不存在');
            }

            const result = await ctx.db.cart.delete({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
            });

            // 记录删除购物车商品日志
            await logger.cartRemove(
                ctx,
                cartItem.productId,
                cartItem.product.title
            );

            return result;
        }),

    // 批量删除购物车商品
    removeMany: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.cart.deleteMany({
                where: {
                    id: { in: input.ids },
                    userId: ctx.session.user.id,
                },
            });
        }),

    // 清空购物车
    clear: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // 记录清空购物车日志
        await logger.cartClear(ctx);

        return ctx.db.cart.deleteMany({
            where: { userId },
        });
    }),

    // 获取购物车商品数量
    count: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.cart.count({
            where: { userId: ctx.session.user.id },
        });
    }),
});
