'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Box,
    Flex,
    Text,
    Image,
    Input,
    Button,
    VStack,
    HStack,
    Alert,
} from '@chakra-ui/react';
import { FiChevronRight, FiMapPin, FiCreditCard } from 'react-icons/fi';
import TopNav from '../_components/TopNav';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import Link from 'next/link';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

export default function ConfirmPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
        null
    );
    const productId = searchParams.get('productId');
    const specId = searchParams.get('specId');
    const quantity = parseInt(searchParams.get('quantity') ?? '1');

    const [remark, setRemark] = useState('');
    const [defaultAddress, setDefaultAddress] = useState(null);

    // 获取产品信息
    const { data: product } = api.product.get.useQuery(
        { id: productId!, isPage: false },
        { enabled: !!productId }
    );

    // 获取默认地址
    const { data: address } = api.address.list.useQuery(undefined, {
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        staleTime: 0,
        gcTime: 0,
    });

    // 监听localStorage变化和页面焦点
    useEffect(() => {
        const handleStorageChange = () => {
            const storedAddressId = localStorage.getItem('addressId');
            if (storedAddressId) {
                setSelectedAddressId(storedAddressId);
                localStorage.removeItem('addressId'); // 使用后清除
            }
        };

        const handleFocus = () => {
            handleStorageChange();
        };

        // 页面加载时检查
        handleStorageChange();

        // 监听页面焦点
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);
    useEffect(() => {
        if (address?.length) {
            if (selectedAddressId) {
                setDefaultAddress(
                    address.find((addr) => addr.id === selectedAddressId)
                );
            } else {
                setDefaultAddress(
                    address.find((addr) => addr.isDefault) ?? address[0]
                );
            }
            console.log(defaultAddress);
        }
    }, [address, selectedAddressId]);

    const createOrderMutation = api.order.create.useMutation({
        onSuccess: (data) => {
            showSuccessToast('订单创建成功');
            router.push(`/full/order/${data.id}`);
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });
    const selectedSpec = product?.specs?.find((spec) => spec.id === specId);
    const totalPrice = (selectedSpec?.price ?? 0) * quantity;
    const shippingFee = product?.logiPrice ?? 0;
    const finalPrice = totalPrice + shippingFee;

    const handleSubmitOrder = () => {
        openDeleteConfirm();
    };

    const {
        ConfirmDialog: DeleteConfirmDialog,
        open: openDeleteConfirm,
        close: closeDeleteConfirm,
    } = useConfirmDialog({
        title: '确认提交订单',
        content: `确定已扫码支付吗？总金额：¥${totalPrice.toFixed(2)}`,
        confirmText: '确认',
        cancelText: '取消',
        buttonProps: { style: { display: 'none' } }, // 不显示按钮，手动控制
        onConfirm: async () => {
            if (!address?.length || !defaultAddress) {
                showErrorToast('请先添加收货地址');
                return;
            }

            createOrderMutation.mutate({
                items: [
                    {
                        productId: productId,
                        specId: specId,
                        quantity,
                    },
                ],
                addressId: defaultAddress.id,
                remark: remark,
            });
        },
    });
    if (!productId || !specId) {
        router.push('/h5');
        return null;
    }

    return (
        <Box bg="#f5f5f7" minH="100vh" pb="100px">
            <TopNav title="确认订单" />

            {/* 收货人信息 */}
            <Box bg="white" borderRadius="xs" m={2} px={4} pt={1} pb={4}>
                {defaultAddress ? (
                    <Link
                        href={`/full/address?is_choose=1&${searchParams.toString()}`}
                    >
                        <Box mt={3}>
                            <Flex justify="space-between" fontSize="md" mb={1}>
                                <Text fontWeight="medium">
                                    {defaultAddress.name}
                                </Text>
                                <Text color="gray.600">
                                    {defaultAddress.phone}
                                </Text>
                            </Flex>
                            <Text color="gray.500" fontSize="sm">
                                {defaultAddress.province?.split('/')[1]}
                                {defaultAddress.city?.split('/')[1]}
                                {defaultAddress.district?.split('/')[1]}
                                {defaultAddress.detail}
                            </Text>
                        </Box>
                    </Link>
                ) : (
                    <Link
                        href={`/full/address?is_choose=1&${searchParams.toString()}`}
                    >
                        <Alert.Root status="error">
                            <Alert.Indicator />
                            <Alert.Title>
                                收货人信息尚未完善，请补充完整后再提交
                            </Alert.Title>
                        </Alert.Root>
                    </Link>
                )}
            </Box>

            {/* 商品信息 */}
            <Box bg="white" m={2} p={4} borderRadius="md">
                <Flex gap={3}>
                    <Image
                        src={
                            product?.images?.[0] ??
                            product?.specs?.[0]?.image ??
                            '/default.jpg'
                        }
                        alt={product?.title}
                        w={20}
                        h={20}
                        borderRadius="md"
                        objectFit="cover"
                    />
                    <Box flex={1}>
                        <Text fontWeight="medium" fontSize="md" mb={1}>
                            {product?.title}
                        </Text>
                        <Text color="gray.400" mb={2}>
                            {selectedSpec?.value} * {selectedSpec?.name}
                        </Text>
                        <Flex align="center">
                            <Text
                                color="red.500"
                                fontWeight="bold"
                                fontSize="lg"
                                mr={4}
                            >
                                ¥{selectedSpec?.price.toFixed(2)}
                            </Text>
                            <Text color="gray.400">x{quantity}</Text>
                        </Flex>
                    </Box>
                </Flex>

                {/* 配送方式 */}
                <Flex justify="space-between" align="center" my={3}>
                    <Text color="gray.600">配送方式</Text>
                    <Flex align="center" gap={1}>
                        <Text>{product?.logistics ?? '快递发货'}</Text>
                        <FiChevronRight color="#999" size={16} />
                    </Flex>
                </Flex>

                {/* 订单留言 */}
                <Flex align="center" gap={4} my={3}>
                    <Text color="gray.600" mb={2}>
                        订单留言
                    </Text>
                    <Input
                        flex="1"
                        textAlign="right"
                        placeholder="如有，请留言"
                        bgColor="white"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        bg="gray.50"
                        border="none"
                    />
                </Flex>

                {/* 价格明细 */}
                <VStack align="stretch" gap={2}>
                    <Flex justify="space-between" my={2}>
                        <Text color="gray.600">共{quantity}件</Text>
                        <Flex>
                            小计:
                            <Text ml={2} color="red.500">
                                ¥{totalPrice.toFixed(2)}
                            </Text>
                        </Flex>
                    </Flex>
                    <Flex justify="space-between" my={2}>
                        <Text color="gray.600">运费</Text>
                        <Text color="red.600">¥{shippingFee.toFixed(2)}</Text>
                    </Flex>
                </VStack>
            </Box>

            {/* 支付方式 */}
            <Box bg="white" m={2} p={4} borderRadius="md">
                <Flex align="center" justify="space-between" mb={4}>
                    <Text color="gray.600">支付方式</Text>
                    <Flex align="center" gap={2}>
                        <FiCreditCard color="#fa2222" />
                        <Text color="red.500">请扫二维码支付</Text>
                    </Flex>
                </Flex>
                <Image
                    m="auto"
                    maxW="50vw"
                    src="\userAvatar.jpg"
                    alt="请扫码支付"
                />
            </Box>

            {/* 底部提交栏 */}
            <Box
                position="fixed"
                left={0}
                right={0}
                bottom={0}
                bg="white"
                p={4}
                borderTop="1px solid #eee"
                zIndex={10}
            >
                <Flex justify="space-between" align="center">
                    <Flex align="center" gap={2}>
                        <Text fontSize="sm" color="gray.600">
                            总计:
                        </Text>
                        <Text fontSize="xl" fontWeight="bold" color="red.500">
                            ¥{finalPrice.toFixed(2)}
                        </Text>
                    </Flex>
                    <Button
                        bg="#fa2222"
                        color="white"
                        size="lg"
                        px={8}
                        borderRadius="full"
                        onClick={handleSubmitOrder}
                        loading={createOrderMutation.isPending}
                        disabled={!defaultAddress}
                    >
                        确认订单
                    </Button>
                </Flex>
            </Box>
            {DeleteConfirmDialog}
        </Box>
    );
}
