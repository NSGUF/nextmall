import { z } from 'zod';
import {
    createTRPCRouter,
    protectedProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';
import { ROLES } from '@/app/const/status';
import { OrderStatus } from '@prisma/client';

export const dashboardRouter = createTRPCRouter({
    // 获取用户统计数据
    getUserStats: superAdminProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59
        );

        // 用户总量
        const totalUsers = await ctx.db.user.count({
            where: { isDeleted: false },
        });

        // 今日活跃用户（通过操作日志统计）
        const todayActiveUsers = await ctx.db.operationLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: today,
                },
                userId: { not: null },
            },
        });

        // 昨日活跃用户
        const yesterdayActiveUsers = await ctx.db.operationLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
                userId: { not: null },
            },
        });

        // 当月活跃用户
        const currentMonthActiveUsers = await ctx.db.operationLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: currentMonth,
                },
                userId: { not: null },
            },
        });

        // 上月活跃用户
        const lastMonthActiveUsers = await ctx.db.operationLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: lastMonth,
                    lte: lastMonthEnd,
                },
                userId: { not: null },
            },
        });

        return {
            total: totalUsers,
            todayActive: todayActiveUsers.length,
            yesterdayActive: yesterdayActiveUsers.length,
            currentMonthActive: currentMonthActiveUsers.length,
            lastMonthActive: lastMonthActiveUsers.length,
        };
    }),

    // 获取订单统计数据
    getOrderStats: superAdminProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59
        );

        // 订单总量
        const totalOrders = await ctx.db.order.count({
            where: { isDeleted: false },
        });

        // 今日订单
        const todayOrders = await ctx.db.order.count({
            where: {
                isDeleted: false,
                createdAt: {
                    gte: today,
                },
            },
        });

        // 昨日订单
        const yesterdayOrders = await ctx.db.order.count({
            where: {
                isDeleted: false,
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
        });

        // 当月订单
        const currentMonthOrders = await ctx.db.order.count({
            where: {
                isDeleted: false,
                createdAt: {
                    gte: currentMonth,
                },
            },
        });

        // 上月订单
        const lastMonthOrders = await ctx.db.order.count({
            where: {
                isDeleted: false,
                createdAt: {
                    gte: lastMonth,
                    lte: lastMonthEnd,
                },
            },
        });

        return {
            total: totalOrders,
            today: todayOrders,
            yesterday: yesterdayOrders,
            currentMonth: currentMonthOrders,
            lastMonth: lastMonthOrders,
        };
    }),

    // 获取成交统计数据（已完成的订单）
    getTransactionStats: superAdminProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59
        );

        const completedStatus: OrderStatus[] = [OrderStatus.COMPLETED];

        // 成交总量和总金额
        const totalTransactions = await ctx.db.order.aggregate({
            where: {
                isDeleted: false,
                status: { in: completedStatus },
            },
            _count: { id: true },
            _sum: { totalPrice: true },
        });

        // 今日成交
        const todayTransactions = await ctx.db.order.aggregate({
            where: {
                isDeleted: false,
                status: { in: completedStatus },
                createdAt: {
                    gte: today,
                },
            },
            _count: { id: true },
            _sum: { totalPrice: true },
        });

        // 昨日成交
        const yesterdayTransactions = await ctx.db.order.aggregate({
            where: {
                isDeleted: false,
                status: { in: completedStatus },
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
            _count: { id: true },
            _sum: { totalPrice: true },
        });

        // 当月成交
        const currentMonthTransactions = await ctx.db.order.aggregate({
            where: {
                isDeleted: false,
                status: { in: completedStatus },
                createdAt: {
                    gte: currentMonth,
                },
            },
            _count: { id: true },
            _sum: { totalPrice: true },
        });

        // 上月成交
        const lastMonthTransactions = await ctx.db.order.aggregate({
            where: {
                isDeleted: false,
                status: { in: completedStatus },
                createdAt: {
                    gte: lastMonth,
                    lte: lastMonthEnd,
                },
            },
            _count: { id: true },
            _sum: { totalPrice: true },
        });

        return {
            total: {
                count: totalTransactions._count.id,
                amount: totalTransactions._sum.totalPrice || 0,
            },
            today: {
                count: todayTransactions._count.id,
                amount: todayTransactions._sum.totalPrice || 0,
            },
            yesterday: {
                count: yesterdayTransactions._count.id,
                amount: yesterdayTransactions._sum.totalPrice || 0,
            },
            currentMonth: {
                count: currentMonthTransactions._count.id,
                amount: currentMonthTransactions._sum.totalPrice || 0,
            },
            lastMonth: {
                count: lastMonthTransactions._count.id,
                amount: lastMonthTransactions._sum.totalPrice || 0,
            },
        };
    }),

    // 获取库存预警数据（库存低于10的商品规格）
    getStockAlerts: superAdminProcedure.query(async ({ ctx }) => {
        const lowStockSpecs = await ctx.db.productSpec.findMany({
            where: {
                stock: {
                    lt: 10,
                },
                product: {
                    isDeleted: false,
                    isActive: true,
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        vendor: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                stock: 'asc',
            },
        });

        return lowStockSpecs.map((spec) => ({
            id: spec.id,
            value: spec.value,
            stock: spec.stock,
            price: spec.price,
            product: {
                id: spec.product.id,
                title: spec.product.title,
                image: spec.product.images[0] || '',
                vendor: spec.product.vendor,
            },
        }));
    }),

    // 获取供应商数据查看
    getVendorData: protectedProcedure
        .input(
            z.object({
                vendorId: z.string().optional(),
                year: z.number().optional(),
                page: z.number().default(1),
                pageSize: z.number().default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const { year, page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            // 获取当前用户信息
            const currentUser = await ctx.db.user.findUnique({
                where: { id: ctx.session.user.id },
            });

            if (!currentUser) {
                throw new Error('用户不存在');
            }

            // 确定要查询的供应商ID
            let targetVendorId: string;

            if (currentUser.role === ROLES.SUPERADMIN) {
                // 超级管理员可以查看指定供应商或所有供应商的数据
                targetVendorId = input.vendorId || '';
            } else if (currentUser.role === ROLES.VENDOR) {
                // 供应商只能查看自己的数据
                targetVendorId = currentUser.id;
            } else {
                throw new Error('无权限访问');
            }

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            if (year) {
                const startOfYear = new Date(year, 0, 1);
                const endOfYear = new Date(year + 1, 0, 1);
                where.createdAt = {
                    gte: startOfYear,
                    lt: endOfYear,
                };
            }

            // 获取订单项数据，包含商品的供应商信息和需包含每一项的logiPrice(运费)
            const orderItems = await ctx.db.orderItem.findMany({
                where: {
                    order: where,
                    ...(targetVendorId && {
                        product: {
                            vendorId: targetVendorId,
                        },
                    }),
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            createdAt: true,
                        },
                    },
                    product: {
                        include: {
                            vendor: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });

            // 按供应商和月份统计数据（包含订单项的运费 logiPrice 字段）
            const vendorStats: Record<
                string,
                {
                    vendorId: string;
                    vendorName: string;
                    monthlyData: Record<
                        string,
                        {
                            month: number;
                            orderCount: Set<string>;
                            totalAmount: number;
                        }
                    >;
                    totalAmount: number;
                    totalOrders: Set<string>;
                }
            > = {};

            orderItems.forEach((item) => {
                const vendor = item.product.vendor;
                const orderDate = new Date(item.order.createdAt);
                const month = orderDate.getMonth() + 1;
                const monthKey = `${orderDate.getFullYear()}-${month.toString().padStart(2, '0')}`;

                if (!vendorStats[vendor.id]) {
                    vendorStats[vendor.id] = {
                        vendorId: vendor.id,
                        vendorName: vendor.name || '未知供应商',
                        monthlyData: {},
                        totalAmount: 0,
                        totalOrders: new Set(),
                    };
                }

                if (!vendorStats[vendor.id].monthlyData[monthKey]) {
                    vendorStats[vendor.id].monthlyData[monthKey] = {
                        month,
                        orderCount: new Set(),
                        totalAmount: 0,
                    };
                }

                // 累加金额和运费（item.price * item.quantity + item.logiPrice）
                vendorStats[vendor.id].monthlyData[monthKey].orderCount.add(
                    item.order.id
                );
                vendorStats[vendor.id].monthlyData[monthKey].totalAmount +=
                    item.price * item.quantity + (item.logiPrice || 0);
                vendorStats[vendor.id].totalAmount +=
                    item.price * item.quantity + (item.logiPrice || 0);
                vendorStats[vendor.id].totalOrders.add(item.order.id);
            });

            // 转换为数组并分页
            const vendorList = Object.values(vendorStats).map((vendor) => ({
                ...vendor,
                totalOrders: vendor.totalOrders.size,
                monthlyData: Object.values(vendor.monthlyData)
                    .map((monthData) => ({
                        month: monthData.month,
                        orderCount: monthData.orderCount.size,
                        totalAmount: monthData.totalAmount,
                    }))
                    .sort((a, b) => a.month - b.month),
            }));

            const total = vendorList.length;
            const paginatedVendors = vendorList.slice(skip, skip + pageSize);

            return {
                vendors: paginatedVendors,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 获取所有供应商列表（用于筛选）
    getVendorList: superAdminProcedure.query(async ({ ctx }) => {
        const vendors = await ctx.db.user.findMany({
            where: {
                role: ROLES.VENDOR,
                isDeleted: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return vendors;
    }),
});
