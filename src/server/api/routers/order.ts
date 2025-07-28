import { z } from 'zod';
import {
    createTRPCRouter,
    protectedProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';

import { TRPCError } from '@trpc/server';
import { logger, logOperation } from '@/server/api/utils/logger';
import { ROLES } from '@/app/const/status';

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
                userId: ctx.session.user.id,
                isDeleted: false,
                ...(input?.status && { status: input.status }),
            };

            // 获取总数
            const total = await ctx.db.order.count({ where });

            // 获取分页数据
            const data = await ctx.db.order.findMany({
                where,
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

    // 管理员获取所有订单
    adminList: superAdminProcedure
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
                    userId: z.string().optional(),
                    search: z.string().optional(),
                    page: z.number().min(1).optional().default(1),
                    pageSize: z.number().min(1).max(100).optional().default(10),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 10;
            const skip = (page - 1) * pageSize;

            const where: any = {
                isDeleted: false,
                ...(input?.status && { status: input.status }),
                ...(input?.userId && { userId: input.userId }),
            };

            // 搜索功能
            if (input?.search) {
                where.OR = [
                    {
                        id: {
                            contains: input.search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        user: {
                            name: {
                                contains: input.search,
                                mode: 'insensitive',
                            },
                        },
                    },
                    {
                        user: {
                            email: {
                                contains: input.search,
                                mode: 'insensitive',
                            },
                        },
                    },
                ];
            }

            // 获取总数
            const total = await ctx.db.order.count({ where });

            // 获取分页数据
            const data = await ctx.db.order.findMany({
                where,
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

                // 增加销量
                await ctx.db.product.update({
                    where: { id: item.productId },
                    data: {
                        sales: {
                            increment: item.quantity,
                        },
                    },
                });

                // 记录订单创建日志
                await logger.orderCreate(ctx, order.id, totalAmount);

                orders.push(order);
            }

            return orders;
        }),

    // 更新订单状态
    updateStatus: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                status: z.enum([
                    'PAID',
                    'CHECKED',
                    'DELIVERED',
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

            // 获取用户角色
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.session.user.id },
            });

            // 构建查询条件
            const orderWhere: any = { id, isDeleted: false };

            // 如果是供应商，只能处理包含自己商品的订单
            if (user.role === ROLES.VENDOR) {
                orderWhere.items = {
                    some: {
                        product: {
                            vendorId: ctx.session.user.id,
                        },
                    },
                };
            } else if (user.role !== ROLES.SUPERADMIN) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: '权限不足',
                });
            }

            // 检查订单是否存在且有权限操作
            const order = await ctx.db.order.findFirst({
                where: orderWhere,
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '订单不存在或无权限操作',
                });
            }

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

            const result = await ctx.db.order.update({
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

            // 记录订单状态更新日志
            await logOperation(ctx, {
                action: 'UPDATE',
                module: 'ORDER',
                description: `订单状态更新为: ${status}`,
                targetId: id,
                targetType: 'Order',
                requestData: {
                    status,
                    trackingNumber,
                    shippingInfo,
                    refundInfo,
                },
            });

            return result;
        }),

    // 确认收货
    confirmReceived: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const order = await ctx.db.order.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                    status: 'DELIVERED',
                    isDeleted: false,
                },
            });

            if (!order) {
                throw new Error('订单不存在或无法确认收货');
            }

            const result = await ctx.db.order.update({
                where: { id: input.id },
                data: {
                    status: 'COMPLETED',
                    updatedAt: new Date(),
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

            // 记录确认收货日志
            await logOperation(ctx, {
                action: 'ORDER_COMPLETE',
                module: 'ORDER',
                description: '用户确认收货',
                targetId: input.id,
                targetType: 'Order',
            });

            return result;
        }),

    // 取消订单
    cancel: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const order = await ctx.db.order.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                    status: 'CANCELLED',
                },
                include: { items: true },
            });

            if (!order) {
                throw new Error('订单不存在或无法取消');
            }

            // 恢复库存
            for (const item of order.items) {
                await ctx.db.productSpec.update({
                    where: { id: item.specId },
                    data: {
                        stock: {
                            increment: item.quantity,
                        },
                    },
                });
            }
            // 恢复销量
            for (const item of order.items) {
                await ctx.db.product.update({
                    where: { id: item.productId },
                    data: {
                        sales: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            const result = await ctx.db.order.update({
                where: { id: input.id },
                data: { status: 'CANCELLED' },
            });

            // 记录取消订单日志
            await logger.orderCancel(ctx, input.id);

            return result;
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
        const [total, paid, checked, delivered, completed, cancelled] =
            await Promise.all([
                ctx.db.order.count({ where: { isDeleted: false } }),
                ctx.db.order.count({
                    where: { status: 'PAID', isDeleted: false },
                }),
                ctx.db.order.count({
                    where: { status: 'CHECKED', isDeleted: false },
                }),
                ctx.db.order.count({
                    where: { status: 'DELIVERED', isDeleted: false },
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
            paid,
            checked,
            delivered,
            completed,
            cancelled,
        };
    }),

    // 供应商获取自己商品的订单
    vendorList: protectedProcedure
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
                    search: z.string().optional(),
                    page: z.number().min(1).optional().default(1),
                    pageSize: z.number().min(1).max(100).optional().default(10),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 10;
            const skip = (page - 1) * pageSize;

            // 构建查询条件 - 只查询包含当前供应商商品的订单
            const where: any = {
                isDeleted: false,
                items: {
                    some: {
                        product: {
                            vendorId: ctx.session.user.id,
                        },
                    },
                },
                ...(input?.status && { status: input.status }),
            };

            // 搜索功能
            if (input?.search) {
                where.OR = [
                    {
                        id: {
                            contains: input.search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        user: {
                            name: {
                                contains: input.search,
                                mode: 'insensitive',
                            },
                        },
                    },
                ];
            }

            // 获取总数
            const total = await ctx.db.order.count({ where });

            // 获取分页数据
            const data = await ctx.db.order.findMany({
                where,
                include: {
                    items: {
                        where: {
                            product: {
                                vendorId: ctx.session.user.id,
                            },
                        },
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
});
