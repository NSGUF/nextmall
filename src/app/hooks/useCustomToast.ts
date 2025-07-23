'use client';

import { toaster } from '@/app/_components/ui/toaster';

const useCustomToast = () => {
    const showSuccessToast = (description: string) => {
        toaster.create({
            description,
            type: 'success',
        });
    };

    const showErrorToast = (description: string) => {
        toaster.create({
            description,
            type: 'error',
        });
    };

    return { showSuccessToast, showErrorToast };
};

export default useCustomToast;
