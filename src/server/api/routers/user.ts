import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { logger, logOperation } from '@/server/api/utils/logger';
import { ROLES } from '@/app/const/status';

export const userRouter = createTRPCRouter({
    register: publicProcedure
        .input(
            z.object({
                phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
                code: z.string().length(6, '验证码必须是6位数字'),
                password: z.string().min(6, '密码至少6位'),
                name: z.string().min(3, '用户名至少3位'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                // 验证手机验证码
                const smsCode = await ctx.db.smsCode.findFirst({
                    where: {
                        phone: input.phone,
                        code: input.code,
                        type: 'REGISTER',
                        used: false,
                        expiresAt: {
                            gt: new Date(),
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                if (!smsCode) {
                    // 记录验证码验证失败日志
                    await logger.smsVerify(ctx, input.phone, 'REGISTER', false);
                    throw new Error('验证码无效或已过期');
                }

                // 检查手机号是否已被注册
                const existing = await ctx.db.user.findFirst({
                    where: { phone: input.phone },
                });
                if (existing) {
                    throw new Error('手机号已被注册');
                }

                // 标记验证码为已使用
                await ctx.db.smsCode.update({
                    where: { id: smsCode.id },
                    data: { used: true },
                });

                const hashed = await hash(input.password, 10);
                const user = await ctx.db.user.create({
                    data: {
                        phone: input.phone,
                        password: hashed,
                        name: input.name,
                        phoneVerified: new Date(),
                    },
                });

                // 记录用户注册成功日志
                await logger.userRegister(ctx, user.id, user.phone || '');

                return { id: user.id, phone: user.phone, name: user.name };
            } catch (error) {
                // 记录注册失败日志
                await logOperation(ctx, {
                    action: 'REGISTER',
                    module: 'USER',
                    description: `用户注册失败: ${input.phone}`,
                    status: 'FAILED',
                    errorMessage:
                        error instanceof Error ? error.message : String(error),
                    requestData: { phone: input.phone, name: input.name },
                });
                throw error;
            }
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
            const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;
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

    // 新增：修改密码接口
    /**
     * 为什么 hash(input.oldPassword, 10) 得到的 hash 跟 user.password 不一样？
     * 
     * 因为 bcrypt 的 hash 加密在每次调用时都会生成一个随机的 salt，
     * 所以即使明文密码一样，每次 hash 出来的密文也都不一样。
     * 
     * 正确的校验方式是用 bcrypt 的 compare(明文, 密文Hash)，
     * 它内部会取 hash 存储的 salt 重新 hash 明文，然后比较是否一致。
     */
    changePassword: protectedProcedure
        .input(
            z.object({
                oldPassword: z.string().min(6, '旧密码至少6位'),
                newPassword: z.string().min(6, '新密码至少6位'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const user = await ctx.db.user.findUnique({
                where: { id: userId },
                select: { password: true },
            });

            if (!user || !user.password) {
                throw new Error('用户不存在或没有设置密码');
            }

            // bcrypt compare 才是比较密码的正确方式
            const isCorrect = await compare(input.oldPassword, user.password);
            if (!isCorrect) {
                throw new Error('旧密码输入错误');
            }

            const hashedNew = await hash(input.newPassword, 10);

            await ctx.db.user.update({
                where: { id: userId },
                data: { password: hashedNew },
            });

            // 记录操作日志
            await logOperation(ctx, {
                action: 'CHANGE_PASSWORD',
                module: 'USER',
                description: '用户修改密码成功',
                targetId: userId,
                targetType: 'User',
            });

            return { message: '密码修改成功' };
        }),

    // 获取所有供应商接口
    getAllVendors: superAdminProcedure.query(async ({ ctx }) => {
        // UserRole.VENDOR
        const vendors = await ctx.db.user.findMany({
            where: { role: ROLES.VENDOR },
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
                        .enum([
                            ROLES.SUPERADMIN,
                            ROLES.VENDOR,
                            'STORE',
                            ROLES.NORMAL,
                        ])
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
                phone: z.string(),
                status: z.boolean().optional(),
                role: z
                    .enum([ROLES.SUPERADMIN, ROLES.VENDOR, ROLES.NORMAL])
                    .default(ROLES.NORMAL),
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
                    status: input.status ?? true,
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
                role: z.enum([
                    ROLES.SUPERADMIN,
                    ROLES.VENDOR,
                    'STORE',
                    ROLES.NORMAL,
                ]),
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

            // 检查是否为超级管理员
            if (existingUser.role === ROLES.SUPERADMIN) {
                throw new Error('不能删除超级管理员');
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
            // 检查是否包含超级管理员
            const users = await ctx.db.user.findMany({
                where: { id: { in: input.ids } },
                select: { id: true, role: true },
            });

            const superAdminIds = users
                .filter((user) => user.role === ROLES.SUPERADMIN)
                .map((user) => user.id);

            if (superAdminIds.length > 0) {
                throw new Error('不能删除超级管理员');
            }

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

        // 记录查看统计信息日志
        await logOperation(ctx, {
            action: 'VIEW',
            module: 'USER',
            description: '查看用户统计信息',
            targetId: userId,
            targetType: 'User',
        });

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

        const result = {
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

        // 记录统计结果
        await logOperation(ctx, {
            action: 'VIEW',
            module: 'USER',
            description: '获取用户统计信息成功',
            targetId: userId,
            targetType: 'User',
            responseData: result,
        });

        return result;
    }),
});
