'use client';

import { Container, Heading, Text, Input } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button, InputGroup, Field } from '@/app/_components/ui';
import useCustomToast from '@/app/hooks/useCustomToast';
import { FiMail } from 'react-icons/fi';
import { api } from '@/trpc/react';

import { emailPattern, handleError } from '@/app/utils';
interface RecoverForm {
    email: string;
}

export default function RecoverPassword() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<RecoverForm>({
        mode: 'onBlur',
        defaultValues: { email: '' },
    });
    const { showSuccessToast } = useCustomToast();

    const recoverMutation = api.user.recoverPassword.useMutation({
        onSuccess: () => {
            showSuccessToast('已发送密码找回邮件，请查收邮箱。');
            reset();
        },
        onError: (err: any) => {
            handleError(err ?? '发送失败');
        },
    });

    const onSubmit = async (data: RecoverForm) => {
        await recoverMutation.mutateAsync({ email: data.email });
    };

    return (
        <Container
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            h="calc(100vh - 64px)"
            maxW="sm"
            alignItems="stretch"
            justifyContent="center"
            gap={4}
            centerContent
        >
            <Heading size="xl" color="ui.main" textAlign="center" mb={2}>
                密码找回
            </Heading>
            <Text textAlign="center">密码找回邮件将发送到注册的账户。</Text>
            <Field invalid={!!errors.email} errorText={errors.email?.message}>
                <InputGroup w="100%" startElement={<FiMail />}>
                    <Input
                        id="email"
                        {...register('email', {
                            required: 'Email is required',
                            pattern: emailPattern,
                        })}
                        placeholder="Email"
                        type="email"
                    />
                </InputGroup>
            </Field>
            <Button variant="solid" type="submit" loading={isSubmitting}>
                确定
            </Button>
        </Container>
    );
}
