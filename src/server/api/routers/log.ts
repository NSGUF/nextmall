import { z } from 'zod';
import {
    createTRPCRouter,
    protectedProcedure,
    superAdminProcedure,
    publicProcedure,
} from '@/server/api/trpc';
import { LogStatus } from '@prisma/client';
import { ROLES } from '@/app/const/status';

export const logRouter = createTRPCRouter({
    // 创建操作日志
    create: publicProcedure
        .input(
            z.object({
                action: z.string(),
                module: z.string(),
                description: z.string(),
                targetId: z.string().optional(),
                targetType: z.string().optional(),
                userId: z.string().optional(),
                userInfo: z.string().optional(),
                ipAddress: z.string().optional(),
                userAgent: z.string().optional(),
                requestData: z.string().optional(),
                responseData: z.string().optional(),
                status: z.nativeEnum(LogStatus).default(LogStatus.SUCCESS),
                errorMessage: z.string().optional(),
                duration: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.operationLog.create({
                data: {
                    action: input.action,
                    module: input.module,
                    description: input.description,
                    targetId: input.targetId,
                    targetType: input.targetType,
                    userId: input.userId,
                    userInfo: input.userInfo,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                    requestData: input.requestData,
                    responseData: input.responseData,
                    status: input.status,
                    errorMessage: input.errorMessage,
                    duration: input.duration,
                },
            });
        }),

    // 获取操作日志列表（分页）
    getList: superAdminProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(20),
                action: z.string().optional(),
                module: z.string().optional(),
                userId: z.string().optional(),
                status: z.nativeEnum(LogStatus).optional(),
                startDate: z.date().optional(),
                endDate: z.date().optional(),
                search: z.string().optional(), // 搜索关键词
            })
        )
        .query(async ({ ctx, input }) => {
            const {
                page,
                pageSize,
                action,
                module,
                userId,
                status,
                startDate,
                endDate,
                search,
            } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            if (action) where.action = action;
            if (module) where.module = module;
            if (userId) where.userId = userId;
            if (status) where.status = status;

            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = startDate;
                if (endDate) where.createdAt.lte = endDate;
            }

            if (search) {
                where.OR = [
                    { description: { contains: search, mode: 'insensitive' } },
                    { userInfo: { contains: search, mode: 'insensitive' } },
                    { targetId: { contains: search, mode: 'insensitive' } },
                    { errorMessage: { contains: search, mode: 'insensitive' } },
                ];
            }

            // 获取总数
            const total = await ctx.db.operationLog.count({ where });

            // 获取数据
            const logs = await ctx.db.operationLog.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });

            return {
                logs,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 获取操作统计
    getStats: superAdminProcedure
        .input(
            z.object({
                startDate: z.date().optional(),
                endDate: z.date().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            const where: any = {};
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = startDate;
                if (endDate) where.createdAt.lte = endDate;
            }

            // 按操作类型统计
            const actionStats = await ctx.db.operationLog.groupBy({
                by: ['action'],
                where,
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
            });

            // 按模块统计
            const moduleStats = await ctx.db.operationLog.groupBy({
                by: ['module'],
                where,
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
            });

            // 按状态统计
            const statusStats = await ctx.db.operationLog.groupBy({
                by: ['status'],
                where,
                _count: {
                    id: true,
                },
            });

            // 按日期统计（最近7天）
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const dailyStats = await ctx.db.operationLog.findMany({
                where: {
                    ...where,
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                },
                select: {
                    createdAt: true,
                },
            });

            // 按天分组统计
            const dailyCount: Record<string, number> = {};
            dailyStats.forEach((log) => {
                const date = log.createdAt.toISOString().split('T')[0];
                dailyCount[date] = (dailyCount[date] || 0) + 1;
            });

            return {
                actionStats: actionStats.map((item) => ({
                    action: item.action,
                    count: item._count.id,
                })),
                moduleStats: moduleStats.map((item) => ({
                    module: item.module,
                    count: item._count.id,
                })),
                statusStats: statusStats.map((item) => ({
                    status: item.status,
                    count: item._count.id,
                })),
                dailyStats: Object.entries(dailyCount).map(([date, count]) => ({
                    date,
                    count,
                })),
            };
        }),

    // 获取单个日志详情
    getById: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.operationLog.findUnique({
                where: { id: input.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });
        }),

    // 批量删除日志（管理员功能）
    deleteMany: superAdminProcedure
        .input(
            z.object({
                ids: z.array(z.string()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 检查用户权限
            if (ctx.session.user.role !== ROLES.SUPERADMIN) {
                throw new Error('权限不足');
            }

            const result = await ctx.db.operationLog.deleteMany({
                where: {
                    id: {
                        in: input.ids,
                    },
                },
            });

            return {
                success: true,
                deletedCount: result.count,
            };
        }),

    // 清理旧日志（管理员功能）
    cleanOldLogs: superAdminProcedure
        .input(
            z.object({
                daysToKeep: z.number().min(1).default(90), // 保留天数，默认90天
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 检查用户权限
            if (ctx.session.user.role !== ROLES.SUPERADMIN) {
                throw new Error('权限不足');
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - input.daysToKeep);

            const result = await ctx.db.operationLog.deleteMany({
                where: {
                    createdAt: {
                        lt: cutoffDate,
                    },
                },
            });

            return {
                success: true,
                deletedCount: result.count,
                cutoffDate,
            };
        }),
});
