import { useState } from 'react';
import { Button, Text } from '@chakra-ui/react';
import {
    DialogRoot,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from '@/app/_components/ui/dialog';
import { useForm } from 'react-hook-form';

interface UseConfirmDialogProps {
    buttonProps?: React.ComponentProps<typeof Button>;
    title?: React.ReactNode;
    content?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => Promise<void> | void;
    onSuccess?: () => void;
    onError?: () => void;
    onCancel?: () => void;
}

export function useConfirmDialog({
    buttonProps,
    title = '确认操作',
    content = '确定要执行此操作吗？',
    confirmText = '确认',
    cancelText = '取消',
    onConfirm,
    onSuccess,
    onError,
    onCancel,
}: UseConfirmDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const {
        handleSubmit,
        formState: { isSubmitting },
    } = useForm();

    const handleConfirm = async () => {
        try {
            await onConfirm();
            setIsOpen(false);
            onSuccess?.();
        } catch (e) {
            onError?.();
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        onCancel?.();
    };

    const ConfirmDialog = (
        <DialogRoot
            size={{ base: 'xs', md: 'md' }}
            placement="center"
            role="alertdialog"
            open={isOpen}
            onOpenChange={({ open }) => setIsOpen(open)}
        >
            <DialogTrigger asChild>
                <Button {...buttonProps} onClick={() => setIsOpen(true)}>
                    {buttonProps?.children ?? '操作'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit(handleConfirm)}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {typeof content === 'string' ? (
                            <Text mb={4}>{content}</Text>
                        ) : (
                            content
                        )}
                    </DialogBody>
                    <DialogFooter gap={2}>
                        <DialogActionTrigger asChild>
                            <Button
                                variant="subtle"
                                colorScheme="gray"
                                disabled={isSubmitting}
                                onClick={handleCancel}
                                type="button"
                            >
                                {cancelText}
                            </Button>
                        </DialogActionTrigger>
                        <Button
                            variant="solid"
                            colorScheme={buttonProps?.colorScheme ?? 'blue'}
                            type="submit"
                            loading={isSubmitting}
                        >
                            {confirmText}
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </form>
            </DialogContent>
        </DialogRoot>
    );

    return {
        ConfirmDialog,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
    };
}
