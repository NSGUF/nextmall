import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    superAdminProcedure,
    protectedProcedure,
} from '@/server/api/trpc';

export const productRouter = createTRPCRouter({
    // 获取所有商品，支持排序和搜索
    list: publicProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    categoryId: z.string().optional(),
                    search: z.string().optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            // 构建where条件
            const where: any = {};

            // 分类筛选
            if (input?.categoryId) {
                where.categoryId = input.categoryId;
            }

            // 搜索功能
            if (input?.search) {
                where.title = {
                    contains: input.search,
                    mode: 'insensitive',
                };
            }

            // 构建排序条件
            let orderBy: any = { createdAt: 'desc' };
            if (input?.orderBy) {
                if (
                    input.orderBy === 'price_asc' ||
                    input.orderBy === 'price_desc'
                ) {
                    // 对于价格排序，我们先获取所有商品，然后在内存中排序
                    const products = await ctx.db.product.findMany({
                        where,
                        include: { specs: true },
                    });

                    // 按最低价格排序
                    return products.sort((a, b) => {
                        const minPriceA = Math.min(
                            ...a.specs.map((spec) => spec.price)
                        );
                        const minPriceB = Math.min(
                            ...b.specs.map((spec) => spec.price)
                        );
                        return input.orderBy === 'price_asc'
                            ? minPriceA - minPriceB
                            : minPriceB - minPriceA;
                    });
                } else {
                    orderBy = { [input.orderBy]: input.order ?? 'asc' };
                }
            }

            return ctx.db.product.findMany({
                orderBy,
                where,
                include: { specs: true },
            });
        }),

    create: superAdminProcedure
        .input(
            z.object({
                title: z.string(),
                images: z.array(z.string()),
                logistics: z.string(),
                logiPrice: z.number(),
                description: z.string(),
                isActive: z.boolean(),
                categoryId: z.string().optional(),
                vendorId: z.string().optional(),
                minAmount: z.number(),
                specs: z
                    .array(
                        z.object({
                            name: z.string(),
                            value: z.string(),
                            price: z.number(),
                            stock: z.number(),
                            image: z.string(),
                        })
                    )
                    .optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { specs, ...productData } = input;
            const product = await ctx.db.product.create({
                data: {
                    ...productData,
                    ownerId: ctx.session.user.id,
                    specs:
                        specs && specs.length > 0
                            ? {
                                  create: specs,
                              }
                            : undefined,
                } as any,
                include: { specs: true },
            });
            return {
                message: '创建成功',
                product,
            };
        }),

    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string(),
                images: z.array(z.string()),
                ownerId: z.string(),
                minAmount: z.number(),
                logistics: z.string(),
                logiPrice: z.number(),
                description: z.string(),
                isActive: z.boolean(),
                categoryId: z.string().optional(),
                vendorId: z.string().optional(),
                specs: z
                    .array(
                        z.object({
                            id: z.string().optional(),
                            name: z.string(),
                            value: z.string(),
                            price: z.number(),
                            stock: z.number(),
                            image: z.string(),
                        })
                    )
                    .optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, specs, ...productData } = input;

            if (specs && specs.length > 0) {
                // 分离需要更新和新建的规格
                const specsToUpdate = specs.filter((spec) => spec.id);
                const specsToCreate = specs.filter((spec) => !spec.id);

                // 更新现有规格
                for (const spec of specsToUpdate) {
                    await ctx.db.productSpec.update({
                        where: { id: spec.id },
                        data: {
                            name: spec.name,
                            value: spec.value,
                            price: spec.price,
                            stock: spec.stock,
                            image: spec.image,
                        },
                    });
                }

                // 创建新规格
                if (specsToCreate.length > 0) {
                    await ctx.db.productSpec.createMany({
                        data: specsToCreate.map((spec) => ({
                            productId: id,
                            name: spec.name,
                            value: spec.value,
                            price: spec.price,
                            stock: spec.stock,
                            image: spec.image,
                        })),
                    });
                }
            }

            const updated = await ctx.db.product.update({
                where: { id },
                data: productData,
                include: { specs: true },
            });

            return updated;
        }),

    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.product.delete({ where: { id: input.id } });
        }),

    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            if (!input.ids || input.ids.length === 0) {
                throw new Error('请选择要删除的商品');
            }

            try {
                // 检查是否有商品被购物车或订单引用
                const cartItems = await ctx.db.cart.findMany({
                    where: { productId: { in: input.ids } },
                });

                const orderItems = await ctx.db.orderItem.findMany({
                    where: { productId: { in: input.ids } },
                });

                if (cartItems.length > 0 || orderItems.length > 0) {
                    throw new Error('无法删除：商品已被购物车或订单引用');
                }

                // 先删除相关的规格
                await ctx.db.productSpec.deleteMany({
                    where: { productId: { in: input.ids } },
                });

                // 删除收藏记录
                await ctx.db.productFavorite.deleteMany({
                    where: { productId: { in: input.ids } },
                });

                // 删除足迹记录
                await ctx.db.footprint.deleteMany({
                    where: { productId: { in: input.ids } },
                });

                // 最后删除商品
                const result = await ctx.db.product.deleteMany({
                    where: { id: { in: input.ids } },
                });

                return {
                    success: true,
                    message: `成功删除 ${result.count} 个商品`,
                    deletedCount: result.count,
                };
            } catch (error) {
                console.error('删除商品失败:', error);
                throw new Error(
                    error instanceof Error ? error.message : '删除失败'
                );
            }
        }),
    // 商品详情，带是否已收藏
    get: protectedProcedure
        .input(z.object({ id: z.string(), isPage: z.boolean() }))
        .query(async ({ ctx, input }) => {
            const product = await ctx.db.product.findUnique({
                where: { id: input.id },
                include: {
                    specs: true,
                    vendor: true,
                },
            });

            // 如果是页面访问，自动添加或更新足迹
            if (input.isPage) {
                const userId = ctx.session.user.id;
                const productId = input.id;
                const existingFootprint = await ctx.db.footprint.findUnique({
                    where: {
                        userId_productId: {
                            userId,
                            productId,
                        },
                    },
                });
                if (existingFootprint) {
                    // 更新浏览时间为当前时间
                    await ctx.db.footprint.update({
                        where: {
                            userId_productId: {
                                userId,
                                productId,
                            },
                        },
                        data: {
                            viewedAt: new Date(),
                        },
                    });
                } else {
                    // 创建新的足迹
                    await ctx.db.footprint.create({
                        data: {
                            userId,
                            productId,
                        },
                    });
                }
            }

            // 查询是否已收藏
            const favorite = await ctx.db.productFavorite.findUnique({
                where: {
                    userId_productId: {
                        userId: ctx.session.user.id,
                        productId: input.id,
                    },
                },
            });

            return {
                ...product,
                isFavorited: !!favorite,
            };
        }),

    // 添加/取消收藏
    toggleFavorite: protectedProcedure
        .input(z.object({ productId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { productId } = input;

            // 检查是否已收藏
            const existingFavorite = await ctx.db.productFavorite.findUnique({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
            });

            if (existingFavorite) {
                // 取消收藏
                await ctx.db.productFavorite.delete({
                    where: {
                        userId_productId: {
                            userId,
                            productId,
                        },
                    },
                });
                return { isFavorited: false, message: '取消收藏' };
            } else {
                // 添加收藏
                await ctx.db.productFavorite.create({
                    data: {
                        userId,
                        productId,
                    },
                });
                return { isFavorited: true, message: '收藏成功' };
            }
        }),

    // 获取用户收藏列表
    getFavorites: protectedProcedure.query(async ({ ctx }) => {
        const favorites = await ctx.db.productFavorite.findMany({
            where: { userId: ctx.session.user.id },
            include: {
                product: {
                    include: { specs: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // 返回商品信息列表
        return favorites.map((fav) => ({
            ...fav.product,
            favoriteId: fav.id,
            favoritedAt: fav.createdAt,
        }));
    }),

    // 获取用户收藏列表
    getFootprints: protectedProcedure.query(async ({ ctx }) => {
        const footprints = await ctx.db.footprint.findMany({
            where: { userId: ctx.session.user.id },
            include: {
                product: {
                    include: { specs: true },
                },
            },
            orderBy: { viewedAt: 'desc' },
        });
        // 返回商品信息列表
        return footprints.map((fav) => ({
            ...fav.product,
            favoriteId: fav.id,
            favoritedAt: fav.viewedAt,
        }));
    }),

    deleteFavorite: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.productFavorite.delete({
                where: {
                    userId_productId: {
                        userId: ctx.session.user.id,
                        productId: input.id,
                    },
                },
            });
            return { message: '删除成功' };
        }),

    deleteFootprint: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.footprint.delete({
                where: {
                    userId_productId: {
                        userId: ctx.session.user.id,
                        productId: input.id,
                    },
                },
            });
            return { message: '删除成功' };
        }),
});
