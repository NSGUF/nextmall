import { z } from 'zod';
import {
    createTRPCRouter,
    protectedProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';

import { TRPCError } from '@trpc/server';
import { logger, logOperation } from '@/server/api/utils/logger';
import { ROLES } from '@/app/const/status';
import { sendSMSOrder } from '@/server/sms';

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

    // 创建订单（一次下单按供应商拆分，一家供应商一张订单）
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

            // 预加载商品与规格，检查库存，并按供应商分组
            type PreparedItem = {
                productId: string;
                specId: string;
                quantity: number;
                remark?: string;
                product: any;
                spec: any;
            };

            const preparedItems: PreparedItem[] = [];
            const vendorIdsSet = new Set<string>();

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

                if (spec.stock !== -1 && spec.stock < item.quantity) {
                    throw new Error(
                        `商品库存不足: ${product.title} - ${spec.value}`
                    );
                }

                preparedItems.push({
                    productId: item.productId,
                    specId: item.specId,
                    quantity: item.quantity,
                    remark: item.remark,
                    product,
                    spec,
                });

                vendorIdsSet.add(product.vendorId);
            }

            // 按供应商分组创建订单
            const orders = [];
            const vendorGroups = new Map<string, PreparedItem[]>();

            for (const item of preparedItems) {
                const vendorId = item.product.vendorId as string;
                if (!vendorGroups.has(vendorId)) {
                    vendorGroups.set(vendorId, []);
                }
                vendorGroups.get(vendorId)!.push(item);
            }

            for (const [, groupItems] of vendorGroups) {
                // 计算该供应商订单总价，并构造订单项
                let totalAmount = 0;
                const orderItemsData = groupItems.map((gi) => {
                    const itemTotal =
                        gi.spec.price * gi.quantity + gi.product.logiPrice;
                    totalAmount += itemTotal;

                    return {
                        productId: gi.productId,
                        specId: gi.specId,
                        quantity: gi.quantity,
                        price: gi.spec.price,
                        remark: gi.remark,
                        logiPrice: gi.product.logiPrice,
                        specInfo: gi.spec.value,
                    };
                });

                const order = await ctx.db.order.create({
                    data: {
                        userId,
                        addressId,
                        totalPrice: totalAmount,
                        items: {
                            create: orderItemsData,
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

                // 记录订单创建日志
                await logger.orderCreate(ctx, order.id, totalAmount);
                orders.push(order);
            }

            // 统一更新库存和销量（所有订单项）
            for (const item of preparedItems) {
                const spec = await ctx.db.productSpec.findUnique({
                    where: { id: item.specId },
                });

                if (spec && spec.stock !== -1) {
                    await ctx.db.productSpec.update({
                        where: { id: item.specId },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }

                await ctx.db.product.update({
                    where: { id: item.productId },
                    data: {
                        sales: {
                            increment: item.quantity,
                        },
                    },
                });
            }

            // 短信通知：收集所有涉及的供应商 ID
            const vendorIds = [...vendorIdsSet];

            // 查询已开启 receiveSms 的供应商和管理员
            try {
                const smsReceivers = await ctx.db.user.findMany({
                    where: {
                        receiveSms: true,
                        isDeleted: false,
                        status: true,
                        phone: { not: null },
                        OR: [
                            { role: 'SUPERADMIN' },
                            { role: 'VENDOR', id: { in: vendorIds } },
                        ],
                    },
                    select: { phone: true },
                });

                const phones = [
                    ...new Set(
                        smsReceivers
                            .map((u) => u.phone)
                            .filter((p): p is string => !!p)
                    ),
                ];

                if (phones.length > 0) {
                    const phoneStr = phones.join(',');
                    const orderIds = orders.map((o) => o.id).join(',');
                    // fire-and-forget 模式，不阻塞用户下单
                    sendSMSOrder(phoneStr)
                        .then(() => {
                            console.log(
                                '[SMS] 订单通知短信发送成功，接收人:',
                                phoneStr
                            );
                            logger.smsOrderNotify(
                                ctx,
                                phoneStr,
                                orderIds,
                                true
                            );
                        })
                        .catch((err) => {
                            console.error('[SMS] 订单通知短信发送失败:', err);
                            logger.smsOrderNotify(
                                ctx,
                                phoneStr,
                                orderIds,
                                false,
                                err instanceof Error ? err.message : String(err)
                            );
                        });
                }
            } catch (smsError) {
                // 短信发送失败不影响下单
                console.error('[SMS] 订单短信通知异常:', smsError);
            }

            // 返回本次下单产生的所有订单（每个供应商一张）
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

            // 恢复库存（无限库存跳过）
            for (const item of order.items) {
                const spec = await ctx.db.productSpec.findUnique({
                    where: { id: item.specId },
                });
                if (spec && spec.stock !== -1) {
                    await ctx.db.productSpec.update({
                        where: { id: item.specId },
                        data: {
                            stock: {
                                increment: item.quantity,
                            },
                        },
                    });
                }
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
