"use client";

import { Container, Image, Input, Text, Flex, Link } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { FiLock, FiMail } from "react-icons/fi";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Field, InputGroup, PasswordInput } from "@/app/_components/ui";
import useCustomToast from "@/app/hooks/useCustomToast"
import { handleError } from "../utils";

type LoginForm = {
    username: string;
    password: string;
};

export default function Login() {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginForm) => {
        const res = await signIn("credentials", {
            email: data.username,
            password: data.password,
            redirect: false, // 防止自动跳转，方便前端拿到 session
        });
        console.log(res)
        debugger;
        if (res?.error) {
            handleError({ message: "邮箱或密码错误" });
        } else {
            // router.replace("/");
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
            <Field
                invalid={!!errors.username}
                errorText={errors.username?.message}
            >
                <InputGroup w="100%" startElement={<FiMail />}>
                    <Input
                        id="username"
                        {...register("username", {
                            required: "请输入邮箱",
                            pattern: {
                                value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                                message: "邮箱格式不正确",
                            },
                        })}
                        placeholder="请输入邮箱"
                        type="email"
                    />
                </InputGroup>
            </Field>
            <PasswordInput
                type="password"
                startElement={<FiLock />}
                {...register("password", {
                    required: "请输入密码",
                    minLength: { value: 6, message: "密码至少6位" },
                })}
                placeholder="请输入密码"
                errors={errors}
            />
            <Flex w="100%" justify="space-between">
                <Link href="/recover-password"
                    color="gray.500"
                    textDecoration="underline" className="main-link">
                    忘记密码?
                </Link>
                <Text>
                    还没有账号?{' '}
                    <Link
                        color="gray.500"
                        textDecoration="underline" href="/signup" className="main-link">
                        立即注册
                    </Link>
                </Text>
            </Flex>
            <Button variant="solid" type="submit" loading={isSubmitting} size="md">
                登录
            </Button>
        </Container>
    );
}