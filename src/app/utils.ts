import useCustomToast from './hooks/useCustomToast';
import { toaster } from '@/app/_components/ui/toaster';

export const emailPattern = {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: '无效邮箱',
};

export const namePattern = {
    value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
    message: 'Invalid name',
};

export const passwordRules = (isRequired = true) => {
    const rules: any = {
        minLength: {
            value: 8,
            message: '密码至少8位',
        },
    };

    if (isRequired) {
        rules.required = '请输入密码';
    }

    return rules;
};

export const confirmPasswordRules = (
    getValues: () => any,
    isRequired = true
) => {
    const rules: any = {
        validate: (value: string) => {
            const password = getValues().password || getValues().new_password;
            return value === password ? true : '密码不匹配';
        },
    };

    if (isRequired) {
        rules.required = '请输入确认密码';
    }

    return rules;
};

/**
 * @deprecated 请使用 handleGlobalError 代替
 */
export function handleError(err: any) {
    // 仅保留兼容性，推荐用 handleGlobalError
    let errorMessage = '发生未知错误';
    if (err instanceof Error) {
        errorMessage = err.message ?? errorMessage;
    } else if (typeof err === 'string') {
        errorMessage = err ?? errorMessage;
    }
    // 这里不能用 hook，直接用 toaster
    toaster.create({
        type: 'error',
        title: '错误',
        description: errorMessage,
    });
}

/**
 * 全局错误处理函数，自动弹出 toast
 * 用于 tRPC、fetch、React Query 等 API 错误处理
 */
export function handleGlobalError(error: any) {
    // tRPC error
    if (error?.data?.code && error?.message) {
        toaster.create({
            type: 'error',
            description: error.message,
        });
        return;
    }
    // 普通 Error
    if (error instanceof Error) {
        toaster.create({
            type: 'error',
            description: error.message,
        });
        return;
    }
    // 其它未知错误
    toaster.create({
        type: 'error',
        description: String(error),
    });
}
