import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    superAdminProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { logger, logOperation } from '@/server/api/utils/logger';

export const productRouter = createTRPCRouter({
    // 获取所有商品，支持排序、搜索和分页
    list: publicProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    categoryId: z.string().optional(),
                    search: z.string().optional(),
                    page: z.number().min(1).optional().default(1),
                    pageSize: z.number().min(1).max(100).optional().default(10),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            // 记录商品列表查询日志
            if (input?.search) {
                await logger.productSearch(ctx, input.search, 0); // 先记录搜索，结果数量稍后更新
            }

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

            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 10;
            const skip = (page - 1) * pageSize;

            // 构建排序条件
            let orderBy: any = { createdAt: 'desc' };
            if (input?.orderBy) {
                if (
                    input.orderBy === 'price_asc' ||
                    input.orderBy === 'price_desc'
                ) {
                    // 对于价格排序，我们先获取所有商品，然后在内存中排序
                    const allProducts = await ctx.db.product.findMany({
                        where,
                        include: { specs: true },
                    });

                    // 按最低价格排序
                    const sortedProducts = allProducts.sort((a, b) => {
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

                    // 手动分页
                    const total = sortedProducts.length;
                    const data = sortedProducts.slice(skip, skip + pageSize);

                    return {
                        data,
                        pagination: {
                            page,
                            pageSize,
                            total,
                            totalPages: Math.ceil(total / pageSize),
                        },
                    };
                } else {
                    orderBy = { [input.orderBy]: input.order ?? 'asc' };
                }
            }

            // 获取总数
            const total = await ctx.db.product.count({ where });

            // 获取分页数据
            const data = await ctx.db.product.findMany({
                orderBy,
                where,
                include: { specs: true },
                skip,
                take: pageSize,
            });

            // 如果是搜索操作，记录搜索结果
            if (input?.search) {
                await logger.productSearch(ctx, input.search, total);
            }

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
                            value: z.string(),
                            price: z.number(),
                            inPrice: z.number(),
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
                            value: z.string(),
                            price: z.number(),
                            inPrice: z.number(),
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
                            value: spec.value,
                            price: spec.price,
                            inPrice: spec.inPrice,
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
                            value: spec.value,
                            price: spec.price,
                            inPrice: spec.inPrice,
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
            try {
                // 检查是否有商品被购物车或订单引用
                const cartItems = await ctx.db.cart.findMany({
                    where: { productId: input.id },
                });

                const orderItems = await ctx.db.orderItem.findMany({
                    where: { productId: input.id },
                });

                if (cartItems.length > 0 || orderItems.length > 0) {
                    throw new Error('无法删除：商品已被购物车或订单引用');
                }

                // 先删除相关的规格
                await ctx.db.productSpec.deleteMany({
                    where: { productId: input.id },
                });

                // 删除收藏记录
                await ctx.db.productFavorite.deleteMany({
                    where: { productId: input.id },
                });

                // 删除足迹记录
                await ctx.db.footprint.deleteMany({
                    where: { productId: input.id },
                });

                // 最后删除商品
                const result = await ctx.db.product.delete({
                    where: { id: input.id },
                });

                return {
                    success: true,
                    message: '删除成功',
                    product: result,
                };
            } catch (error) {
                console.error('删除商品失败:', error);
                throw new Error(
                    error instanceof Error ? error.message : '删除失败'
                );
            }
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
    get: publicProcedure
        .input(z.object({ id: z.string(), isPage: z.boolean() }))
        .query(async ({ ctx, input }) => {
            const product = await ctx.db.product.findUnique({
                where: { id: input.id },
                include: {
                    specs: true,
                    vendor: true,
                },
            });

            // 如果未登录，直接返回商品信息
            if (!ctx.session?.user) {
                return {
                    ...product,
                    isFavorited: false,
                };
            }

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

                // 记录商品浏览日志
                if (product) {
                    await logger.productView(ctx, product.id, product.title);
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

            // 获取商品信息用于日志记录
            const product = await ctx.db.product.findUnique({
                where: { id: productId },
                select: { id: true, title: true },
            });

            if (!product) {
                throw new Error('商品不存在');
            }

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

                // 记录取消收藏日志
                await logger.productFavorite(
                    ctx,
                    product.id,
                    product.title,
                    false
                );

                return { isFavorited: false, message: '取消收藏' };
            } else {
                // 添加收藏
                await ctx.db.productFavorite.create({
                    data: {
                        userId,
                        productId,
                    },
                });

                // 记录收藏日志
                await logger.productFavorite(
                    ctx,
                    product.id,
                    product.title,
                    true
                );

                return { isFavorited: true, message: '收藏成功' };
            }
        }),

    // 获取用户收藏列表
    getFavorites: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // 记录查看收藏列表日志
        await logOperation(ctx, {
            action: 'LIST',
            module: 'PRODUCT',
            description: '查看收藏列表',
            targetId: userId,
            targetType: 'User',
        });

        const favorites = await ctx.db.productFavorite.findMany({
            where: { userId },
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

    // 获取用户足迹列表
    getFootprints: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // 记录查看足迹列表日志
        await logOperation(ctx, {
            action: 'LIST',
            module: 'PRODUCT',
            description: '查看浏览足迹',
            targetId: userId,
            targetType: 'User',
        });

        const footprints = await ctx.db.footprint.findMany({
            where: { userId },
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
