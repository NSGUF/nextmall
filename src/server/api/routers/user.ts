import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { logger } from '@/server/api/utils/logger';

export const userRouter = createTRPCRouter({
    register: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
                password: z.string().min(6, '密码至少6位'),
                name: z.string().min(3, '用户名至少3位'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.user.findUnique({
                where: { email: input.email },
            });
            if (existing) {
                throw new Error('邮箱已被注册');
            }
            const hashed = await hash(input.password, 10);
            const user = await ctx.db.user.create({
                data: {
                    email: input.email,
                    password: hashed,
                    name: input.name,
                },
            });

            // 记录用户注册日志
            await logger.userRegister(ctx, user.id, user.email);

            return { id: user.id, email: user.email, name: user.name };
        }),
    registerFormConfig: publicProcedure.query(() => {
        return [
            {
                name: 'name',
                label: '用户名',
                type: 'text',
                required: true,
                minLength: 3,
            },
            {
                name: 'email',
                label: '邮箱',
                type: 'email',
                required: true,
                pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
            },
            {
                name: 'password',
                label: '密码',
                type: 'password',
                required: true,
                minLength: 6,
            },
        ];
    }),
    recoverPassword: publicProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({
                where: { email: input.email },
            });
            if (!user) throw new Error('该邮箱未注册');

            // 生成 JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.AUTH_SECRET,
                { expiresIn: '30m' }
            );

            // 发送邮件
            const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
            const options = {
                host: process.env.SMTP_HOST, // SMTP 服务器地址，如 smtp.qq.com
                port: Number(process.env.SMTP_PORT) || 465, // SMTP 端口，常用465(SSL)或587(TLS)
                secure: true, // true=SSL, false=STARTTLS
                auth: {
                    user: process.env.SMTP_USER, // 发件邮箱账号
                    pass: process.env.SMTP_PASS, // 发件邮箱授权码/密码
                },
            };
            const transporter = nodemailer.createTransport(options);
            await transporter.sendMail({
                from: `"NextMall" <${process.env.SMTP_USER}>`, // 必须和 SMTP_USER 一致
                to: user.email ?? undefined,
                subject: '密码重置',
                html: `<p>点击 <a href="${resetUrl}">这里</a> 重置你的密码。30分钟内有效。</p>`,
            });

            return { message: '已发送密码找回邮件' };
        }),
    // 获取所有供应商接口
    getAllVendors: superAdminProcedure.query(async ({ ctx }) => {
        // UserRole.VENDOR
        const vendors = await ctx.db.user.findMany({
            where: { role: 'VENDOR' },
            orderBy: { createdAt: 'desc' },
        });
        return vendors;
    }),

    // 获取所有用户，支持排序和分页 - 用于管理后台
    list: superAdminProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    page: z.number().min(1).optional().default(1),
                    pageSize: z.number().min(1).max(100).optional().default(10),
                    role: z
                        .enum(['SUPERADMIN', 'VENDOR', 'STORE', 'NORMAL'])
                        .optional(),
                    status: z.boolean().optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 10;
            const skip = (page - 1) * pageSize;

            const where: any = {
                isDeleted: false, // 只显示未删除的用户
            };
            if (input?.role) {
                where.role = input.role;
            }
            if (input?.status !== undefined) {
                where.status = input.status;
            }

            // 获取总数
            const total = await ctx.db.user.count({ where });

            // 获取分页数据
            const data = await ctx.db.user.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'asc' }
                    : { createdAt: 'desc' },
                where,
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    status: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    // 不返回密码等敏感信息
                },
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

    // 创建用户 - 管理后台使用
    create: superAdminProcedure
        .input(
            z.object({
                name: z.string().min(1, '用户名不能为空'),
                email: z.string().email('邮箱格式不正确').optional(),
                phone: z.string().optional(),
                status: z.boolean().optional(),
                role: z
                    .enum(['SUPERADMIN', 'VENDOR', 'STORE', 'NORMAL'])
                    .default('NORMAL'),
                password: z.string().min(6, '密码至少6位').optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 检查邮箱是否已存在
            if (input.email) {
                const existing = await ctx.db.user.findUnique({
                    where: { email: input.email },
                });
                if (existing) {
                    throw new Error('邮箱已被注册');
                }
            }

            // 如果提供了密码，进行加密
            let hashedPassword: string | undefined;
            if (input.password) {
                hashedPassword = await hash(input.password, 10);
            }

            const user = await ctx.db.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    phone: input.phone,
                    status: input.status,
                    role: input.role,
                    password: hashedPassword,
                },
            });

            // 记录操作日志
            await logger.userCreate(ctx, user.id, input.name);

            return {
                message: '创建成功',
            };
        }),

    // 更新用户 - 管理后台使用
    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1, '用户名不能为空'),
                email: z.string().email('邮箱格式不正确').optional(),
                phone: z.string().optional(),
                status: z.boolean().optional(),
                role: z.enum(['SUPERADMIN', 'VENDOR', 'STORE', 'NORMAL']),
                password: z.string().min(6, '密码至少6位').optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, password, ...data } = input;

            // 检查用户是否存在
            const existingUser = await ctx.db.user.findUnique({
                where: { id },
            });
            if (!existingUser) {
                throw new Error('用户不存在');
            }

            // 检查邮箱是否被其他用户使用
            if (input.email && input.email !== existingUser.email) {
                const emailExists = await ctx.db.user.findUnique({
                    where: { email: input.email },
                });
                if (emailExists) {
                    throw new Error('邮箱已被其他用户使用');
                }
            }

            // 准备更新数据
            const updateData: any = { ...data };
            if (password) {
                updateData.password = await hash(password, 10);
            }

            await ctx.db.user.update({
                where: { id },
                data: updateData,
            });

            // 记录操作日志
            await logger.userUpdate(ctx, id, input.name);

            return {
                message: '更新成功',
            };
        }),

    // 删除用户 - 管理后台使用
    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查用户是否存在
            const existingUser = await ctx.db.user.findUnique({
                where: { id: input.id },
            });
            if (!existingUser) {
                throw new Error('用户不存在');
            }

            // 软删除：设置 isDeleted 为 true
            await ctx.db.user.update({
                where: { id: input.id },
                data: { isDeleted: true },
            });

            // 记录操作日志
            await logger.userDelete(ctx, input.id, existingUser.name || '');

            return {
                message: '删除成功',
            };
        }),

    // 批量删除用户 - 管理后台使用
    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            // 软删除：设置 isDeleted 为 true
            await ctx.db.user.updateMany({
                where: { id: { in: input.ids } },
                data: { isDeleted: true },
            });

            // 记录操作日志
            await logger.userBatchDelete(ctx, input.ids);

            return {
                message: '批量删除成功',
            };
        }),

    // 获取用户统计信息
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const [
            favoritesCount,
            footprintsCount,
            paidOrdersCount,
            checkedOrdersCount,
            deliveredOrdersCount,
            completedOrdersCount,
            cancelledOrdersCount,
        ] = await Promise.all([
            ctx.db.productFavorite.count({
                where: { userId },
            }),
            ctx.db.footprint.count({
                where: { userId },
            }),
            ctx.db.order.count({
                where: { userId, status: 'PAID', isDeleted: false },
            }),
            ctx.db.order.count({
                where: { userId, status: 'CHECKED', isDeleted: false },
            }),
            ctx.db.order.count({
                where: { userId, status: 'DELIVERED', isDeleted: false },
            }),
            ctx.db.order.count({
                where: { userId, status: 'COMPLETED', isDeleted: false },
            }),
            ctx.db.order.count({
                where: { userId, status: 'CANCELLED', isDeleted: false },
            }),
        ]);

        return {
            favoritesCount,
            footprintsCount,
            orderCounts: {
                paid: paidOrdersCount,
                checked: checkedOrdersCount,
                delivered: deliveredOrdersCount,
                completed: completedOrdersCount,
                cancelled: cancelledOrdersCount,
            },
        };
    }),
});
