'use client';

import React, { useEffect, useState } from 'react';
import TopNav from '../_components/TopNav';
import BannerCarousel from '@/app/h5/_components/BannerCarousel';
import { api } from '@/trpc/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Flex, Text, Tag, Center } from '@chakra-ui/react';
import { Button } from '@/app/_components/ui';
import useCustomToast from '@/app/hooks/useCustomToast';
import { FiChevronRight, FiMinus, FiStar, FiPlus } from 'react-icons/fi';
import Link from 'next/link';
import {
    CloseButton,
    IconButton,
    Drawer,
    Portal,
    Spinner,
} from '@chakra-ui/react';
import { FaStar } from 'react-icons/fa';
import { STORE_GOOD_DATA_KEY, STORE_LAUNCH_INFO_KEY } from '@/app/const';
import { useSession } from 'next-auth/react';

export default function ProductPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const { showSuccessToast, showErrorToast } = useCustomToast();

    if (!id) {
        router.push('/h5');
    }
    const { data: product, isLoading } = api.product.get.useQuery({
        id,
        isPage: true,
    });
    const toggleFavoriteMutation = api.product.toggleFavorite.useMutation({
        onSuccess: (data) => {
            showSuccessToast(data.message);
            setCollected(data.isFavorited);
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });
    const [selectedSpec, setSelectedSpec] = useState({
        id: '',
        name: '',
        price: 1,
        productId: '',
        stock: 0,
        value: '',
    });
    const [collected, setCollected] = useState(false);
    const handlerCollect = () => {
        toggleFavoriteMutation.mutate({ productId: id });
    };
    useEffect(() => {
        if (product?.specs?.[0]) {
            setSelectedSpec(product.specs[0]);
            setCollected(product.isFavorited);
        }
    }, [product]);
    const [quantity, setQuantity] = useState<number>(1);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const specPrices = product?.specs?.map((spec) => spec.price) ?? [];
    const minPrice = Math.min(...specPrices);
    const maxPrice = Math.max(...specPrices);
    const priceRange =
        minPrice !== maxPrice ? `${minPrice}~${maxPrice}` : minPrice;

    const title = product?.title ?? '';
    const [actionType, setActionType] = useState<'cart' | 'buy' | null>(null);

    const handlerToCart = () => {
        if (!session) {
            showErrorToast('请先登录');
            router.push('/login');
            return;
        }
        setActionType('cart');
        setIsDrawerOpen(true);
    };

    const handlerToBuy = () => {
        if (!session) {
            showErrorToast('请先登录');
            router.push('/login');
            return;
        }
        setActionType('buy');
        setIsDrawerOpen(true);
    };
    const createPost = api.cart.add.useMutation({
        onSuccess: async (data) => {
            setIsDrawerOpen(false);
            showSuccessToast('添加成功');
        },
    });
    const handleConfirmAction = () => {
        if (actionType === 'cart') {
            createPost.mutate({
                productId: id,
                specId: selectedSpec.id,
                quantity,
            });
        } else if (actionType === 'buy') {
            // 跳转到订单确认页
            const params = btoa(id);
            localStorage.setItem(STORE_LAUNCH_INFO_KEY, params);
            localStorage.setItem(
                STORE_GOOD_DATA_KEY,
                JSON.stringify([
                    {
                        product: product,
                        selectedSpec: selectedSpec,
                        quantity,
                    },
                ])
            );
            router.push(`/full/confirm?data=${params}`);
        }
    };
    return (
        <Box bg="gray.50" minH="100vh" pb="80px">
            <TopNav title={product?.title} />
            <BannerCarousel
                banners={
                    product?.images?.map((item: string) => ({ image: item })) ??
                    []
                }
                height="380px"
            />
            <Box px={4} py={3} bg="white" boxShadow="2xs">
                <Flex align="center" justifyContent="space-between" mb={2}>
                    <Text
                        color="red.500"
                        fontWeight="bold"
                        fontSize="2xl"
                        mr={2}
                    >
                        ￥{priceRange}
                    </Text>
                    <Text color="gray.500">已售 {product?.sales ?? 0}</Text>
                </Flex>
                <Text fontWeight="semibold" fontSize="lg" mb={2}>
                    {title}
                </Text>
                <Box h="1px" bg="gray.100" my={2} />
                <Drawer.Root
                    placement="bottom"
                    open={isDrawerOpen}
                    onOpenChange={(e) => setIsDrawerOpen(e.open)}
                >
                    <Drawer.Trigger asChild>
                        <Flex
                            align="center"
                            justify="space-between"
                            cursor="pointer"
                        >
                            <Flex align="center">
                                <Text color="gray.500" mr={2}>
                                    选择
                                </Text>
                                <Text color="gray.800">
                                    {selectedSpec.value} * {selectedSpec.name}{' '}
                                    {quantity}件
                                </Text>
                            </Flex>
                            <FiChevronRight />
                        </Flex>
                    </Drawer.Trigger>
                    <Portal>
                        <Drawer.Backdrop />
                        <Drawer.Positioner>
                            <Drawer.Content>
                                <Drawer.Header>
                                    <Drawer.Title>
                                        <Flex align="center" w="100%">
                                            <Box boxSize="80px" mr={4}>
                                                <img
                                                    src={
                                                        product?.images?.[0] ??
                                                        '/default.jpg'
                                                    }
                                                    alt={title}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        borderRadius: '8px',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            </Box>
                                            <Box flex="1">
                                                <Text
                                                    color="orange.500"
                                                    fontWeight="bold"
                                                    fontSize="xl"
                                                >
                                                    ￥{selectedSpec.price}
                                                </Text>

                                                <Flex
                                                    fontSize="sm"
                                                    align="center"
                                                    mt={4}
                                                    w="100%"
                                                >
                                                    <Text
                                                        fontWeight="normal"
                                                        color="gray.500"
                                                        mr={4}
                                                        mt={1}
                                                    >
                                                        库存{' '}
                                                        {selectedSpec?.stock}
                                                    </Text>
                                                    <Flex
                                                        align="center"
                                                        bgColor="gray.100"
                                                        borderRadius="full"
                                                        px={4}
                                                    >
                                                        <IconButton
                                                            disabled={
                                                                quantity === 1
                                                            }
                                                            variant="ghost"
                                                            size="2xs"
                                                            onClick={() => {
                                                                setQuantity(
                                                                    quantity - 1
                                                                );
                                                            }}
                                                        >
                                                            <FiMinus />
                                                        </IconButton>
                                                        <Box px={4}>
                                                            {quantity}
                                                        </Box>
                                                        <IconButton
                                                            disabled={
                                                                quantity >=
                                                                selectedSpec.stock
                                                            }
                                                            variant="ghost"
                                                            size="2xs"
                                                            onClick={() => {
                                                                setQuantity(
                                                                    quantity + 1
                                                                );
                                                            }}
                                                        >
                                                            <FiPlus />
                                                        </IconButton>
                                                    </Flex>
                                                </Flex>
                                            </Box>
                                        </Flex>
                                    </Drawer.Title>
                                </Drawer.Header>
                                <Drawer.Body>
                                    <Flex
                                        direction="column"
                                        align="center"
                                        mb={6}
                                    >
                                        <Box w="100%" mt={2}>
                                            <Text color="gray.500" mb={4}>
                                                规格
                                            </Text>

                                            {product?.specs?.map((item) => (
                                                <Box key={item.id}>
                                                    <Tag.Root
                                                        mb={2}
                                                        size="lg"
                                                        onClick={() =>
                                                            setSelectedSpec(
                                                                item
                                                            )
                                                        }
                                                        colorPalette={
                                                            selectedSpec.id ===
                                                            item.id
                                                                ? 'red'
                                                                : ''
                                                        }
                                                    >
                                                        <Tag.Label>
                                                            {item.value} *{' '}
                                                            {item.name}
                                                        </Tag.Label>
                                                    </Tag.Root>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Flex>
                                </Drawer.Body>
                                <Drawer.Footer>
                                    <Button
                                        w="100%"
                                        borderRadius="md"
                                        bg="#fa2222"
                                        color="#fff"
                                        size="xl"
                                        onClick={handleConfirmAction}
                                        loading={createPost.isPending}
                                    >
                                        确认
                                    </Button>
                                </Drawer.Footer>
                                <Drawer.CloseTrigger asChild>
                                    <CloseButton size="sm" />
                                </Drawer.CloseTrigger>
                            </Drawer.Content>
                        </Drawer.Positioner>
                    </Portal>
                </Drawer.Root>

                <Text color="gray.400" fontSize="sm" mt={1}>
                    共{product?.specs.length ?? 0}种可选
                </Text>
                <Box h="1px" bg="gray.100" my={2} />
                <Flex align="center">
                    <Text color="gray.400" mr={2}>
                        配送
                    </Text>
                    <Text mr={2}>{product?.logistics ?? '快递配送'}</Text>
                    <Text color="gray.400" mr={2}>
                        快递费用
                    </Text>
                    <Text color="red.500">
                        ￥{product?.logiPrice ?? '快递配送'}
                    </Text>
                </Flex>
            </Box>
            <Box pt={2} mb="64px">
                {product?.description}
            </Box>
            {/* 底部操作栏 */}
            <Flex
                position="fixed"
                left={0}
                bottom={0}
                w="100vw"
                bg="white"
                boxShadow="0 -2px 8px rgba(0,0,0,0.05)"
                zIndex={10}
                h="64px"
                align="center"
                px={4}
            >
                {collected ? (
                    <Flex
                        flex={1}
                        align="center"
                        gap={1}
                        color="red.500"
                        cursor="pointer"
                        onClick={() => handlerCollect()}
                    >
                        <FaStar />
                        已收藏
                    </Flex>
                ) : (
                    <Flex
                        flex={1}
                        align="center"
                        gap={1}
                        cursor="pointer"
                        onClick={() => handlerCollect()}
                    >
                        <FiStar />
                        收藏
                    </Flex>
                )}
                <Button
                    colorPalette="yellow"
                    w={32}
                    color="white"
                    borderRadius="24px 0 0 24px"
                    onClick={() => handlerToCart()}
                >
                    加入购物车
                </Button>
                <Button
                    w={32}
                    borderRadius="0 24px 24px 0"
                    onClick={() => handlerToBuy()}
                >
                    立即购买
                </Button>
            </Flex>
            {isLoading && (
                <Box pos="absolute" inset="0" bg="bg/80">
                    <Center h="full">
                        <Spinner
                            color="red.500"
                            css={{ '--spinner-track-color': 'colors.gray.200' }}
                        />
                    </Center>
                </Box>
            )}
        </Box>
    );
}
