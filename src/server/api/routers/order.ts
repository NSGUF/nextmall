import { z } from 'zod';
import {
    createTRPCRouter,
    protectedProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';

export const orderRouter = createTRPCRouter({
    // 获取订单列表
    list: protectedProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    status: z
                        .enum([
                            'PAID',
                            'CHECKED',
                            'DELIVERED',
                            'COMPLETED',
                            'CANCELLED',
                        ])
                        .optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.order.findMany({
                where: {
                    userId: ctx.session.user.id,
                    isDeleted: false,
                    ...(input?.status && { status: input.status }),
                },
                include: {
                    items: {
                        include: {
                            product: true,
                            spec: true,
                        },
                    },
                    address: true,
                },
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'desc' }
                    : { createdAt: 'desc' },
            });
        }),

    // 管理员获取所有订单
    adminList: superAdminProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    status: z
                        .enum([
                            'PENDING',
                            'PAID',
                            'SHIPPED',
                            'COMPLETED',
                            'CANCELLED',
                        ])
                        .optional(),
                    userId: z.string().optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.order.findMany({
                where: {
                    isDeleted: false,
                    ...(input?.status && { status: input.status }),
                    ...(input?.userId && { userId: input.userId }),
                },
                include: {
                    items: {
                        include: {
                            product: true,
                            spec: true,
                        },
                    },
                    address: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'desc' }
                    : { createdAt: 'desc' },
            });
        }),

    // 获取订单详情
    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.order.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                    isDeleted: false,
                },
                include: {
                    items: {
                        include: {
                            product: true,
                            spec: true,
                        },
                    },
                    address: true,
                },
            });

            if (!order) {
                throw new Error('订单不存在');
            }

            return order;
        }),

    // 创建订单
    create: protectedProcedure
        .input(
            z.object({
                items: z.array(
                    z.object({
                        productId: z.string(),
                        specId: z.string(),
                        quantity: z.number().min(1),
                        remark: z.string().optional(),
                    })
                ),
                addressId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { items, addressId } = input;
            const userId = ctx.session.user.id;

            // 验证地址是否属于当前用户
            const address = await ctx.db.address.findFirst({
                where: { id: addressId, userId },
            });

            if (!address) {
                throw new Error('收货地址不存在');
            }

            const orders = [];

            // 为每个商品创建单独的订单
            for (const item of items) {
                const product = await ctx.db.product.findUnique({
                    where: { id: item.productId },
                    include: { specs: true },
                });

                if (!product) {
                    throw new Error(`商品不存在: ${item.productId}`);
                }

                const spec = product.specs.find((s) => s.id === item.specId);
                if (!spec) {
                    throw new Error(`商品规格不存在: ${item.specId}`);
                }

                if (spec.stock < item.quantity) {
                    throw new Error(
                        `商品库存不足: ${product.title} - ${spec.name}`
                    );
                }

                const totalAmount =
                    spec.price * item.quantity + product.logiPrice;

                // 创建单个订单
                const order = await ctx.db.order.create({
                    data: {
                        userId,
                        addressId,
                        totalPrice: totalAmount,
                        items: {
                            create: {
                                productId: item.productId,
                                specId: item.specId,
                                quantity: item.quantity,
                                price: spec.price,
                                remark: item.remark,
                                logiPrice: product.logiPrice,
                                specInfo: `${spec.value} * ${spec.name}`,
                            },
                        },
                    },
                    include: {
                        items: {
                            include: {
                                product: true,
                                spec: true,
                            },
                        },
                        address: true,
                    },
                });

                // 减少库存
                await ctx.db.productSpec.update({
                    where: { id: item.specId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });

                orders.push(order);
            }

            return orders;
        }),

    // 更新订单状态
    updateStatus: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                status: z.enum([
                    'PENDING',
                    'PAID',
                    'SHIPPED',
                    'COMPLETED',
                    'CANCELLED',
                ]),
                trackingNumber: z.string().optional(),
                shippingInfo: z.string().optional(),
                refundInfo: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, status, trackingNumber, shippingInfo, refundInfo } =
                input;

            const updateData: any = { status };

            if (status === 'PAID') {
                updateData.paidAt = new Date();
            }

            if (trackingNumber) {
                updateData.trackingNumber = trackingNumber;
            }

            if (shippingInfo) {
                updateData.shippingInfo = shippingInfo;
            }

            if (refundInfo) {
                updateData.refundInfo = refundInfo;
            }

            return ctx.db.order.update({
                where: { id },
                data: updateData,
                include: {
                    items: {
                        include: {
                            product: true,
                            spec: true,
                        },
                    },
                    address: true,
                },
            });
        }),

    // 取消订单
    cancel: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const order = await ctx.db.order.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                    status: 'PENDING',
                },
                include: { items: true },
            });

            if (!order) {
                throw new Error('订单不存在或无法取消');
            }

            // 恢复库存
            for (const item of order.items) {
                await ctx.db.productSpec.update({
                    where: { id: item.specId! },
                    data: {
                        stock: {
                            increment: item.quantity,
                        },
                    },
                });
            }

            return ctx.db.order.update({
                where: { id: input.id },
                data: { status: 'CANCELLED' },
            });
        }),

    // 删除订单
    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.order.update({
                where: { id: input.id },
                data: { isDeleted: true },
            });
        }),

    // 批量删除订单
    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.order.updateMany({
                where: { id: { in: input.ids } },
                data: { isDeleted: true },
            });
        }),

    // 获取订单统计
    getStats: superAdminProcedure.query(async ({ ctx }) => {
        const [total, pending, paid, shipped, completed, cancelled] =
            await Promise.all([
                ctx.db.order.count({ where: { isDeleted: false } }),
                ctx.db.order.count({
                    where: { status: 'PENDING', isDeleted: false },
                }),
                ctx.db.order.count({
                    where: { status: 'PAID', isDeleted: false },
                }),
                ctx.db.order.count({
                    where: { status: 'SHIPPED', isDeleted: false },
                }),
                ctx.db.order.count({
                    where: { status: 'COMPLETED', isDeleted: false },
                }),
                ctx.db.order.count({
                    where: { status: 'CANCELLED', isDeleted: false },
                }),
            ]);

        return {
            total,
            pending,
            paid,
            shipped,
            completed,
            cancelled,
        };
    }),
});
