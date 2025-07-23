'use client';

import { Container, Flex, Image, Input, Text, Link } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FiLock, FiUser } from 'react-icons/fi';
import { useRef, useState } from 'react';
import {
    Button,
    Checkbox,
    Field,
    PasswordInput,
    InputGroup,
} from '@/app/_components/ui';
import { confirmPasswordRules, emailPattern, passwordRules } from '@/app/utils';
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
    email: string;
    password: string;
    name: string;
    confirm_password: string;
}

export default function SignUp() {
    const { showErrorToast } = useCustomToast();
    const [agree, setAgree] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const cancelRef = useRef<HTMLButtonElement | null>(null);
    const [pendingSubmit, setPendingSubmit] = useState<null | RegisterForm>(
        null
    );
    const router = useRouter();
    const signUpMutation = api.user.register.useMutation({
        onSuccess: () => {
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
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
        mode: 'onBlur',
        criteriaMode: 'all',
        defaultValues: {
            email: '',
            password: '',
            name: '',
            confirm_password: '',
        },
    });

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
                    invalid={!!errors.email}
                    errorText={errors.email?.message}
                >
                    <InputGroup w="100%" startElement={<FiUser />}>
                        <Input
                            id="email"
                            {...register('email', {
                                required: '请输入邮箱',
                                pattern: emailPattern,
                            })}
                            placeholder="请输入邮箱"
                            type="email"
                        />
                    </InputGroup>
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
