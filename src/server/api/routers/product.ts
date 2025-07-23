import { z } from "zod";
import { createTRPCRouter, publicProcedure, superAdminProcedure, protectedProcedure } from "@/server/api/trpc";

export const productRouter = createTRPCRouter({
    // 获取所有商品，支持排序
    list: publicProcedure
        .input(
            z.object({
                orderBy: z.string().optional(),
                order: z.enum(["asc", "desc"]).optional(),
                categoryId: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.product.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? "asc" }
                    : { createdAt: "desc" },
                where: input?.categoryId ? { categoryId: input.categoryId } : undefined,
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
                specs: z.array(z.object({
                    name: z.string(),
                    value: z.string(),
                    price: z.number(),
                    stock: z.number(),
                    image: z.string(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { specs, ...productData } = input;
            const product = await ctx.db.product.create({
                data: {
                    ...productData,
                    ownerId: ctx.session.user.id,
                    specs: specs && specs.length > 0 ? {
                        create: specs
                    } : undefined,
                },
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
                specs: z.array(z.object({
                    id: z.string().optional(),
                    name: z.string(),
                    value: z.string(),
                    price: z.number(),
                    stock: z.number(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, specs, ...productData } = input;
            // 先删除原有规格，再批量创建新规格
            await ctx.db.productSpec.deleteMany({ where: { productId: id } });
            const updated = await ctx.db.product.update({
                where: { id },
                data: {
                    ...productData,
                    specs: specs && specs.length > 0 ? {
                        create: specs
                    } : undefined,
                },
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
            return ctx.db.product.deleteMany({ where: { id: { in: input.ids } } });
        }),
    // 商品详情，带是否已收藏
    get: protectedProcedure
        .input(z.object({ id: z.string(), isPage: z.boolean() }))
        .query(async ({ ctx, input }) => {
            const product = await ctx.db.product.findUnique({
                where: { id: input.id },
                include: {
                    specs: true,
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
                        }
                    }
                });
                if (existingFootprint) {
                    // 更新浏览时间为当前时间
                    await ctx.db.footprint.update({
                        where: {
                            userId_productId: {
                                userId,
                                productId,
                            }
                        },
                        data: {
                            viewedAt: new Date(),
                        }
                    });
                } else {
                    // 创建新的足迹
                    await ctx.db.footprint.create({
                        data: {
                            userId,
                            productId,
                        }
                    });
                }
            }

            // 查询是否已收藏
            const favorite = await ctx.db.productFavorite.findUnique({
                where: {
                    userId_productId: {
                        userId: ctx.session.user.id,
                        productId: input.id,
                    }
                }
            });

            return {
                ...product,
                isFavorited: !!favorite
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
                    }
                }
            });

            if (existingFavorite) {
                // 取消收藏
                await ctx.db.productFavorite.delete({
                    where: {
                        userId_productId: {
                            userId,
                            productId,
                        }
                    }
                });
                return { isFavorited: false, message: '取消收藏' };
            } else {
                // 添加收藏
                await ctx.db.productFavorite.create({
                    data: {
                        userId,
                        productId,
                    }
                });
                return { isFavorited: true, message: '收藏成功' };
            }
        }),

    // 获取用户收藏列表
    getFavorites: protectedProcedure
        .query(async ({ ctx }) => {
            const favorites = await ctx.db.productFavorite.findMany({
                where: { userId: ctx.session.user.id },
                include: {
                    product: {
                        include: { specs: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            // 返回商品信息列表
            return favorites.map(fav => ({
                ...fav.product,
                favoriteId: fav.id,
                favoritedAt: fav.createdAt,
            }));
        }),
}); 