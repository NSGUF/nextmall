import { type PrismaClient } from '@prisma/client';
import { LogStatus } from '@prisma/client';
import { type Session } from 'next-auth';

export interface LogContext {
    db: PrismaClient;
    session?: Session | null;
    req?: {
        headers?: {
            'x-forwarded-for'?: string;
            'user-agent'?: string;
        };
        ip?: string;
    };
}

export interface LogData {
    action: string;
    module: string;
    description: string;
    targetId?: string;
    targetType?: string;
    requestData?: any;
    responseData?: any;
    status?: LogStatus;
    errorMessage?: string;
    duration?: number;
}

/**
 * 记录操作日志
 */
export async function logOperation(ctx: LogContext, data: LogData) {
    try {
        // 获取用户信息
        const userId = ctx.session?.user?.id;
        const userInfo = ctx.session?.user
            ? JSON.stringify({
                  id: ctx.session.user.id,
                  name: ctx.session.user.name,
                  email: ctx.session.user.email,
                  role: ctx.session.user.role,
              })
            : undefined;

        // 获取IP地址
        const ipAddress = getClientIP(ctx.req);

        // 获取User Agent
        const userAgent = ctx.req?.headers?.['user-agent'];

        // 序列化请求和响应数据
        const requestData = data.requestData
            ? JSON.stringify(data.requestData)
            : undefined;
        const responseData = data.responseData
            ? JSON.stringify(data.responseData)
            : undefined;

        await ctx.db.operationLog.create({
            data: {
                action: data.action,
                module: data.module,
                description: data.description,
                targetId: data.targetId,
                targetType: data.targetType,
                userId,
                userInfo,
                ipAddress,
                userAgent,
                requestData,
                responseData,
                status: data.status || LogStatus.SUCCESS,
                errorMessage: data.errorMessage,
                duration: data.duration,
            },
        });
    } catch (error) {
        // 日志记录失败不应该影响主业务流程
        console.error('Failed to log operation:', error);
    }
}

/**
 * 获取客户端IP地址
 */
function getClientIP(req?: LogContext['req']): string | undefined {
    if (!req) return undefined;

    // 尝试从不同的header中获取真实IP
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        // x-forwarded-for可能包含多个IP，取第一个
        return forwarded.split(',')[0]?.trim();
    }

    return req.ip;
}

/**
 * 创建日志记录装饰器
 */
export function withLogging<T extends any[], R>(
    action: string,
    module: string,
    getDescription: (...args: T) => string,
    getTargetInfo?: (...args: T) => { targetId?: string; targetType?: string }
) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: any, ...args: T): Promise<R> {
            const startTime = Date.now();
            const ctx = this.ctx as LogContext;

            try {
                const result = await originalMethod.apply(this, args);
                const duration = Date.now() - startTime;

                // 记录成功日志
                await logOperation(ctx, {
                    action,
                    module,
                    description: getDescription(...args),
                    ...getTargetInfo?.(...args),
                    requestData: args[0], // 通常第一个参数是input
                    responseData: result,
                    status: LogStatus.SUCCESS,
                    duration,
                });

                return result;
            } catch (error) {
                const duration = Date.now() - startTime;

                // 记录失败日志
                await logOperation(ctx, {
                    action,
                    module,
                    description: `${getDescription(...args)} - 失败`,
                    ...getTargetInfo?.(...args),
                    requestData: args[0],
                    status: LogStatus.FAILED,
                    errorMessage:
                        error instanceof Error ? error.message : String(error),
                    duration,
                });

                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * 操作类型常量
 */
export const LOG_ACTIONS = {
    // 用户相关
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    UPDATE_PROFILE: 'UPDATE_PROFILE',
    CHANGE_PASSWORD: 'CHANGE_PASSWORD',

    // 通用CRUD
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    VIEW: 'VIEW',
    LIST: 'LIST',

    // 商品相关
    PRODUCT_FAVORITE: 'PRODUCT_FAVORITE',
    PRODUCT_UNFAVORITE: 'PRODUCT_UNFAVORITE',

    // 订单相关
    ORDER_CREATE: 'ORDER_CREATE',
    ORDER_PAY: 'ORDER_PAY',
    ORDER_SHIP: 'ORDER_SHIP',
    ORDER_COMPLETE: 'ORDER_COMPLETE',
    ORDER_CANCEL: 'ORDER_CANCEL',

    // 购物车相关
    CART_ADD: 'CART_ADD',
    CART_UPDATE: 'CART_UPDATE',
    CART_REMOVE: 'CART_REMOVE',

    // 管理员相关
    ADMIN_LOGIN: 'ADMIN_LOGIN',
    ADMIN_EXPORT: 'ADMIN_EXPORT',
    ADMIN_IMPORT: 'ADMIN_IMPORT',
} as const;

/**
 * 模块类型常量
 */
export const LOG_MODULES = {
    USER: 'USER',
    PRODUCT: 'PRODUCT',
    ORDER: 'ORDER',
    CART: 'CART',
    CATEGORY: 'CATEGORY',
    BANNER: 'BANNER',
    COURSE: 'COURSE',
    COLLECTION: 'COLLECTION',
    ADDRESS: 'ADDRESS',
    PAYMENT: 'PAYMENT',
    ADMIN: 'ADMIN',
    SYSTEM: 'SYSTEM',
} as const;

/**
 * 快捷日志记录函数
 */
export const logger = {
    // 用户操作
    userLogin: (ctx: LogContext, userId: string, method = 'email') =>
        logOperation(ctx, {
            action: LOG_ACTIONS.LOGIN,
            module: LOG_MODULES.USER,
            description: `用户登录 (${method})`,
            targetId: userId,
            targetType: 'User',
        }),

    userLogout: (ctx: LogContext, userId: string) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.LOGOUT,
            module: LOG_MODULES.USER,
            description: '用户退出登录',
            targetId: userId,
            targetType: 'User',
        }),

    userRegister: (ctx: LogContext, userId: string, email: string) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.REGISTER,
            module: LOG_MODULES.USER,
            description: `用户注册 (${email})`,
            targetId: userId,
            targetType: 'User',
        }),

    userCreate: (ctx: LogContext, userId: string, userName: string) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.CREATE,
            module: LOG_MODULES.USER,
            description: `创建用户: ${userName}`,
            targetId: userId,
            targetType: 'User',
        }),

    userUpdate: (ctx: LogContext, userId: string, userName: string) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.UPDATE,
            module: LOG_MODULES.USER,
            description: `更新用户: ${userName}`,
            targetId: userId,
            targetType: 'User',
        }),

    userDelete: (ctx: LogContext, userId: string, userName: string) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.DELETE,
            module: LOG_MODULES.USER,
            description: `删除用户: ${userName}`,
            targetId: userId,
            targetType: 'User',
        }),

    userBatchDelete: (ctx: LogContext, userIds: string[]) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.DELETE,
            module: LOG_MODULES.USER,
            description: `批量删除用户 (${userIds.length}个)`,
            requestData: { userIds },
            targetType: 'User',
        }),

    // 商品操作
    productView: (ctx: LogContext, productId: string, productTitle: string) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.VIEW,
            module: LOG_MODULES.PRODUCT,
            description: `查看商品: ${productTitle}`,
            targetId: productId,
            targetType: 'Product',
        }),

    productFavorite: (
        ctx: LogContext,
        productId: string,
        productTitle: string,
        isFavorited: boolean
    ) =>
        logOperation(ctx, {
            action: isFavorited
                ? LOG_ACTIONS.PRODUCT_FAVORITE
                : LOG_ACTIONS.PRODUCT_UNFAVORITE,
            module: LOG_MODULES.PRODUCT,
            description: `${isFavorited ? '收藏' : '取消收藏'}商品: ${productTitle}`,
            targetId: productId,
            targetType: 'Product',
        }),

    // 订单操作
    orderCreate: (ctx: LogContext, orderId: string, totalPrice: number) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.ORDER_CREATE,
            module: LOG_MODULES.ORDER,
            description: `创建订单，金额: ¥${totalPrice}`,
            targetId: orderId,
            targetType: 'Order',
        }),

    // 购物车操作
    cartAdd: (
        ctx: LogContext,
        productId: string,
        productTitle: string,
        quantity: number
    ) =>
        logOperation(ctx, {
            action: LOG_ACTIONS.CART_ADD,
            module: LOG_MODULES.CART,
            description: `添加商品到购物车: ${productTitle} x${quantity}`,
            targetId: productId,
            targetType: 'Product',
        }),
};
