'use client';

import { Container, Image, Input, Text, Flex, Link } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FiLock, FiPhone } from 'react-icons/fi';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Field, InputGroup, PasswordInput } from '@/app/_components/ui';
import useCustomToast from '@/app/hooks/useCustomToast';
import { handleError } from '../utils';

type LoginForm = {
    phone: string;
    password: string;
};

export default function Login() {
    const router = useRouter();
    const { data: session, update } = useSession();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        mode: 'onBlur',
        criteriaMode: 'all',
        defaultValues: {
            phone: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginForm) => {
        try {
            const res = await signIn('credentials', {
                phone: data.phone,
                password: data.password,
                redirect: false, // 防止自动跳转，方便前端拿到 session
            });

            if (res?.error) {
                handleError('手机号或密码错误');
            } else if (res?.ok) {
                // 强制更新session
                await update();

                // 等待一小段时间确保session更新
                setTimeout(() => {
                    router.replace('/');
                }, 500);
            }
        } catch (error) {
            console.error('Login error:', error);
            handleError('登录失败，请重试');
        }
    };
    return (
        <Container
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            h="100vh"
            maxW="sm"
            alignItems="stretch"
            justifyContent="center"
            gap={4}
            centerContent
        >
            <Image
                src="/logo.svg"
                alt="FastAPI logo"
                height="auto"
                maxW="2xs"
                alignSelf="center"
                mb={4}
            />
            <Field invalid={!!errors.phone} errorText={errors.phone?.message}>
                <InputGroup w="100%" startElement={<FiPhone />}>
                    <Input
                        id="phone"
                        {...register('phone', {
                            required: '请输入手机号',
                            pattern: {
                                value: /^1[3-9]\d{9}$/,
                                message: '手机号格式不正确',
                            },
                        })}
                        placeholder="请输入手机号"
                        type="tel"
                    />
                </InputGroup>
            </Field>
            <PasswordInput
                type="password"
                startElement={<FiLock />}
                {...register('password', {
                    required: '请输入密码',
                    minLength: { value: 6, message: '密码至少6位' },
                })}
                placeholder="请输入密码"
                errors={errors}
            />
            <Flex w="100%" justify="space-between">
                <Link
                    href="/recover-password"
                    color="gray.500"
                    textDecoration="underline"
                    className="main-link"
                >
                    忘记密码?
                </Link>
                <Text>
                    还没有账号?{' '}
                    <Link
                        color="gray.500"
                        textDecoration="underline"
                        href="/signup"
                        className="main-link"
                    >
                        立即注册
                    </Link>
                </Text>
            </Flex>
            <Button
                variant="solid"
                type="submit"
                loading={isSubmitting}
                size="md"
            >
                登录
            </Button>
        </Container>
    );
}
