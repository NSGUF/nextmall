'use client';

import { Container, Flex, Image, Input, Text, Link } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FiLock, FiUser, FiPhone } from 'react-icons/fi';
import { useRef, useState } from 'react';
import {
    Button,
    Checkbox,
    Field,
    PasswordInput,
    InputGroup,
} from '@/app/_components/ui';
import { confirmPasswordRules, passwordRules } from '@/app/utils';
import { useRouter } from 'next/navigation';
import useCustomToast from '@/app/hooks/useCustomToast';

import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from '@/app/_components/ui/dialog';
import { api } from '@/trpc/react';

interface RegisterForm {
    phone: string;
    code: string;
    password: string;
    name: string;
    confirm_password: string;
}

export default function SignUp() {
    const { showErrorToast, showSuccessToast } = useCustomToast();
    const [agree, setAgree] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const cancelRef = useRef<HTMLButtonElement | null>(null);
    const [pendingSubmit, setPendingSubmit] = useState<null | RegisterForm>(
        null
    );
    const router = useRouter();

    const sendCodeMutation = api.sms.sendCode.useMutation({
        onSuccess: (data) => {
            // TODO
            showSuccessToast('验证码发送成功，测试环境，验证码为' + data.code);
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        },
        onError: (err: any) => {
            showErrorToast(err?.message ?? '验证码发送失败');
        },
    });

    const signUpMutation = api.user.register.useMutation({
        onSuccess: () => {
            showSuccessToast('注册成功，请登录');
            router.replace('/login');
        },
        onError: (err: any) => {
            showErrorToast(err?.message ?? '注册失败');
        },
    });
    const {
        register,
        handleSubmit,
        getValues,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
        mode: 'onBlur',
        criteriaMode: 'all',
        defaultValues: {
            phone: '',
            code: '',
            password: '',
            name: '',
            confirm_password: '',
        },
    });

    const phoneValue = watch('phone');

    const handleSendCode = async () => {
        if (!phoneValue || !/^1[3-9]\d{9}$/.test(phoneValue)) {
            showErrorToast('请输入正确的手机号');
            return;
        }
        await sendCodeMutation.mutateAsync({
            phone: phoneValue,
            type: 'REGISTER',
        });
    };

    const onSubmit = async (data: RegisterForm) => {
        if (!agree) {
            setPendingSubmit(data);
            setShowDialog(true);
            return;
        }
        const { confirm_password, ...userRegister } = data;
        await signUpMutation.mutateAsync(userRegister);
    };

    return (
        <Flex
            flexDir={{ base: 'column', md: 'row' }}
            justify="center"
            h="100vh"
        >
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
                <Field invalid={!!errors.name} errorText={errors.name?.message}>
                    <InputGroup w="100%" startElement={<FiUser />}>
                        <Input
                            id="name"
                            minLength={3}
                            {...register('name', {
                                required: '请输入用户名',
                            })}
                            placeholder="请输入用户名"
                            type="text"
                        />
                    </InputGroup>
                </Field>
                <Field
                    invalid={!!errors.phone}
                    errorText={errors.phone?.message}
                >
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
                <Field invalid={!!errors.code} errorText={errors.code?.message}>
                    <Flex gap={2} w="100%">
                        <InputGroup flex="1" startElement={<FiLock />}>
                            <Input
                                id="code"
                                {...register('code', {
                                    required: '请输入验证码',
                                    pattern: {
                                        value: /^\d{6}$/,
                                        message: '验证码必须是6位数字',
                                    },
                                })}
                                placeholder="请输入验证码"
                                type="text"
                                maxLength={6}
                            />
                        </InputGroup>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendCode}
                            disabled={
                                countdown > 0 || sendCodeMutation.isPending
                            }
                            loading={sendCodeMutation.isPending}
                            minW="100px"
                        >
                            {countdown > 0 ? `${countdown}s` : '发送验证码'}
                        </Button>
                    </Flex>
                </Field>
                <PasswordInput
                    type="password"
                    startElement={<FiLock />}
                    {...register('password', passwordRules())}
                    placeholder="请输入密码"
                    errors={errors}
                />
                <PasswordInput
                    type="confirm_password"
                    startElement={<FiLock />}
                    {...register(
                        'confirm_password',
                        confirmPasswordRules(getValues)
                    )}
                    placeholder="请输入确认密码"
                    errors={errors}
                />
                <Checkbox
                    checked={agree}
                    colorPalette="red"
                    onCheckedChange={({ checked }) => setAgree(!!checked)}
                    style={{ marginBottom: 8 }}
                    color="gray"
                >
                    注册/登录即表示同意
                    <Link
                        href="#"
                        style={{ color: '#2255A4', margin: '0 4px' }}
                    >
                        《用户协议》
                    </Link>
                    <Link
                        href="#"
                        style={{ color: '#2255A4', margin: '0 4px' }}
                    >
                        《隐私政策》
                    </Link>
                </Checkbox>
                <Button variant="solid" type="submit" loading={isSubmitting}>
                    注册
                </Button>
                <Text color="gray">
                    已有账号?{' '}
                    <Link
                        href="/login"
                        textDecoration="underline"
                        className="main-link"
                    >
                        登录
                    </Link>
                </Text>
            </Container>
            <DialogRoot
                open={showDialog}
                onOpenChange={({ open }) => setShowDialog(open)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>阅读并同意</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <div
                            style={{
                                textAlign: 'center',
                                color: '#2255A4',
                                fontWeight: 500,
                            }}
                        >
                            <Link
                                href="/#"
                                style={{ color: '#2255A4', margin: '0 4px' }}
                            >
                                《用户协议》
                            </Link>
                            <Link
                                href="/#"
                                style={{ color: '#2255A4', margin: '0 4px' }}
                            >
                                《隐私政策》
                            </Link>
                        </div>
                    </DialogBody>
                    <DialogFooter style={{ flexDirection: 'column', gap: 8 }}>
                        <Button
                            w="100%"
                            onClick={() => {
                                setAgree(true);
                                setShowDialog(false);
                                if (pendingSubmit) {
                                    const {
                                        confirm_password,
                                        ...userRegister
                                    } = pendingSubmit;
                                    signUpMutation.mutate(userRegister);
                                    setPendingSubmit(null);
                                }
                            }}
                        >
                            同意并继续
                        </Button>
                        <Button
                            ref={cancelRef}
                            w="100%"
                            onClick={() => setShowDialog(false)}
                        >
                            取消
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </Flex>
    );
}
