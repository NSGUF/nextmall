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
import {
    STORE_ADDRESS_KEY,
    STORE_GOOD_DATA_KEY,
    STORE_LAUNCH_INFO_KEY,
} from '@/app/const';

export default function ConfirmPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
        null
    );
    const data = searchParams.get('data');
    const goodData = JSON.parse(localStorage.getItem(STORE_GOOD_DATA_KEY));
    const isValid = data === localStorage.getItem(STORE_LAUNCH_INFO_KEY);
    const [defaultAddress, setDefaultAddress] = useState(null);

    // 添加状态来管理每个商品的备注
    const [remarks, setRemarks] = useState<Record<number, string>>({});

    // 更新备注的函数
    const updateRemark = (index: number, value: string) => {
        setRemarks((prev) => ({
            ...prev,
            [index]: value,
        }));
    };

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
            const storedAddressId = localStorage.getItem(STORE_ADDRESS_KEY);
            if (storedAddressId) {
                setSelectedAddressId(storedAddressId);
                localStorage.removeItem(STORE_ADDRESS_KEY); // 使用后清除
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
        }
    }, [address, selectedAddressId]);

    const createOrderMutation = api.order.create.useMutation({
        onSuccess: (data) => {
            console.log(data);
            showSuccessToast('订单创建成功');
            router.push(`/full/order?type=paid`);
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const totalPrice = goodData.reduce((acc, item) => {
        return acc + item.selectedSpec.price * item.quantity;
    }, 0);
    const shippingFee = goodData.reduce((acc, item) => {
        return acc + item.product.logiPrice;
    }, 0);
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
        content: `确定已扫码支付吗？总金额：¥${finalPrice.toFixed(2)}`,
        confirmText: '确认',
        cancelText: '取消',
        buttonProps: { style: { display: 'none' } }, // 不显示按钮，手动控制
        onConfirm: async () => {
            if (!address?.length || !defaultAddress) {
                showErrorToast('请先添加收货地址');
                return;
            }

            const items = goodData.map((item, index) => ({
                productId: item.product.id,
                specId: item.selectedSpec.id,
                quantity: item.quantity,
                remark: remarks[index] || '', // 使用状态中的备注
            }));

            createOrderMutation.mutate({
                items,
                addressId: defaultAddress.id,
            });
        },
    });
    if (!isValid) {
        showErrorToast('商品信息有误，请重新选择商品');
        setTimeout(() => router.push('/h5'), 1000);
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
            {goodData?.map(({ product, selectedSpec, quantity }, index) => (
                <Box bg="white" key={product.id} m={2} p={4} borderRadius="md">
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
                        <Box flex={1} minW={0}>
                            <Text
                                fontWeight="medium"
                                fontSize="md"
                                mb={1}
                                overflow="hidden"
                                textOverflow="ellipsis"
                                whiteSpace="nowrap"
                                minW={0}
                                w="100%"
                            >
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
                            value={remarks[index] || ''}
                            onChange={(e) =>
                                updateRemark(index, e.target.value)
                            }
                            bg="gray.50"
                            border="none"
                        />
                    </Flex>

                    {/* 价格明细 */}
                    <VStack align="stretch" gap={2}>
                        <Flex justify="space-between" my={2}>
                            <Text color="gray.600">运费</Text>
                            <Text color="red.600">
                                ¥{product?.logiPrice.toFixed(2)}
                            </Text>
                        </Flex>
                        <Flex justify="space-between" my={2}>
                            <Text color="gray.600">商品总价</Text>
                            <Flex>
                                <Text ml={2} color="red.500">
                                    ¥
                                    {(selectedSpec?.price * quantity).toFixed(
                                        2
                                    )}
                                </Text>
                            </Flex>
                        </Flex>
                        <Flex justify="space-between" my={2}>
                            <Text color="gray.600">实付:</Text>
                            <Flex>
                                <Text ml={2} color="red.500">
                                    ¥
                                    {(
                                        selectedSpec?.price * quantity +
                                        product?.logiPrice
                                    ).toFixed(2)}
                                </Text>
                            </Flex>
                        </Flex>
                    </VStack>
                </Box>
            ))}

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
