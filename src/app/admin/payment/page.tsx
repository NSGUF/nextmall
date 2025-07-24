'use client';

import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Heading,
    Image,
    Text,
    VStack,
    Center,
    Alert,
} from '@chakra-ui/react';
import { FiUpload, FiEdit3 } from 'react-icons/fi';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import { ContentLoading } from '@/app/_components/LoadingSpinner';

export default function PaymentCodePage() {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // 获取支付码数据
    const {
        data: payment,
        isLoading,
        refetch,
    } = api.payment.get.useQuery(undefined, {
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60, // 1分钟缓存
        gcTime: 1000 * 60 * 5, // 5分钟垃圾回收
    });

    // 上传支付码
    const uploadPaymentCode = api.payment.upload.useMutation({
        onSuccess: () => {
            showSuccessToast('支付码上传成功');
            refetch();
            setUploading(false);
        },
        onError: (error) => {
            showErrorToast(error.message || '上传失败');
            setUploading(false);
        },
    });

    // 处理文件选择
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            showErrorToast('请选择图片文件');
            return;
        }

        // 验证文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showErrorToast('图片大小不能超过5MB');
            return;
        }

        // 转换为 base64 并上传
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setUploading(true);
            uploadPaymentCode.mutate({
                image: base64,
                filename: file.name,
            });
        };
        reader.readAsDataURL(file);
    };

    // 触发文件选择
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    if (isLoading) {
        return (
            <Box
                borderRadius="lg"
                minHeight="full"
                p={4}
                bg="white"
                boxShadow="xs"
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={4}
                >
                    <Heading size="lg">支付码管理</Heading>
                </Box>
                <ContentLoading text="支付码数据加载中..." />
            </Box>
        );
    }

    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={6}
            >
                <Heading size="lg">支付码管理</Heading>
            </Box>

            <Alert.Root status="info" mb={6}>
                <Alert.Indicator />
                <Alert.Title>使用说明</Alert.Title>
                <Alert.Description>
                    <VStack align="start" gap={1}>
                        <Text>
                            • 支持 JPG、PNG、GIF 格式，文件大小不超过 5MB
                        </Text>
                        <Text>• 支付码将显示在订单确认页面供用户扫码支付</Text>
                    </VStack>
                </Alert.Description>
            </Alert.Root>

            <Center>
                <VStack gap={6} maxW="400px" w="100%">
                    {payment?.image ? (
                        // 显示已上传的支付码
                        <VStack gap={4}>
                            <Box
                                borderRadius="lg"
                                overflow="hidden"
                                border="2px solid"
                                borderColor="gray.200"
                                bg="gray.50"
                                p={4}
                            >
                                <Image
                                    src={payment.image}
                                    alt="支付码"
                                    maxW="500px"
                                    maxH="500px"
                                    objectFit="contain"
                                    borderRadius="md"
                                />
                            </Box>
                            <Text
                                fontSize="sm"
                                color="gray.600"
                                textAlign="center"
                            >
                                当前支付码
                            </Text>
                            <Button
                                colorScheme="blue"
                                onClick={triggerFileSelect}
                                loading={uploading}
                                size="lg"
                            >
                                <FiEdit3 style={{ marginRight: '8px' }} />
                                更改支付码
                            </Button>
                        </VStack>
                    ) : (
                        // 显示上传组件
                        <VStack gap={4}>
                            <Box
                                borderRadius="lg"
                                border="2px dashed"
                                borderColor="gray.300"
                                bg="gray.50"
                                p={8}
                                textAlign="center"
                                cursor="pointer"
                                onClick={triggerFileSelect}
                                _hover={{
                                    borderColor: 'blue.400',
                                    bg: 'blue.50',
                                }}
                                transition="all 0.2s"
                                w="300px"
                                h="300px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <VStack gap={3}>
                                    <FiUpload size={48} color="#CBD5E0" />
                                    <Text
                                        fontSize="lg"
                                        fontWeight="medium"
                                        color="gray.600"
                                    >
                                        点击上传支付码
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                        支持 JPG、PNG、GIF 格式
                                    </Text>
                                </VStack>
                            </Box>
                            <Button
                                colorScheme="blue"
                                onClick={triggerFileSelect}
                                loading={uploading}
                                size="lg"
                            >
                                <FiUpload style={{ marginRight: '8px' }} />
                                选择图片
                            </Button>
                        </VStack>
                    )}
                </VStack>
            </Center>

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
        </Box>
    );
}
