"use client";

import { Box, Flex, Text, Button, Image, Grid, Badge } from "@chakra-ui/react";
import { Checkbox } from "@chakra-ui/react";
import { FiChevronRight, FiMinus, FiPlus, FiMapPin, FiChevronDown } from "react-icons/fi";
import * as React from "react";

// 假数据
interface CartItem {
    id: number;
    name: string;
    attrs?: string;
    price: number;
    img: string;
    count: number;
    checked: boolean;
}
interface CartShop {
    shop: {
        name: string;
        tag: string;
    };
    items: CartItem[];
}

const initialCartData: CartShop[] = [
    {
        shop: {
            name: "Mall4j蓝海商城",
            tag: "自营",
        },
        items: [
            {
                id: 1,
                name: "狗狗拔河发声玩具批发亚马逊爆款",
                attrs: "绿色 金属",
                price: 108.68,
                img: "/image.png",
                count: 1,
                checked: false,
            },
            {
                id: 2,
                name: "明星彩笔 无暇版",
                price: 8.99,
                img: "/image.png",
                count: 1,
                checked: false,
            },
        ],
    },
    {
        shop: {
            name: "很久很久",
            tag: "",
        },
        items: [
            {
                id: 3,
                name: "CD glasses",
                price: 8.99,
                img: "/image.png",
                count: 1,
                checked: false,
            },
        ],
    },
];

export default function CartPage() {
    // 购物车状态：每个商品有checked属性
    const [cart, setCart] = React.useState<CartShop[]>(() =>
        initialCartData.map(shop => ({
            ...shop,
            items: shop.items.map(item => ({ ...item })),
        }))
    );

    // 计算总价和结算数量
    const { totalPrice, totalCount } = React.useMemo(() => {
        let totalPrice = 0;
        let totalCount = 0;
        cart.forEach(shop => {
            shop.items.forEach(item => {
                if (item.checked) {
                    totalPrice += item.price * item.count;
                    totalCount += 1;
                }
            });
        });
        return { totalPrice, totalCount };
    }, [cart]);

    // 全选状态
    const allChecked = cart.every(shop => shop.items.every(item => item.checked));
    const indeterminate = cart.some(shop => shop.items.some(item => item.checked)) && !allChecked;

    // 全选/取消全选
    const handleAllChecked = (e: { checked: boolean | "indeterminate" }) => {
        const checked = e.checked === true || e.checked === "indeterminate";
        setCart(cart.map(shop => ({
            ...shop,
            items: shop.items.map(item => ({ ...item, checked })),
        })));
    };

    // 店铺下所有商品选中/取消
    const handleShopChecked = (shopIdx: number, e: { checked: boolean | "indeterminate" }) => {
        const checked = e.checked === true || e.checked === "indeterminate";
        setCart(cart.map((shop, idx) => idx === shopIdx ? {
            ...shop,
            items: shop.items.map(item => ({ ...item, checked })),
        } : shop));
    };

    // 单个商品选中/取消
    const handleItemChecked = (shopIdx: number, itemIdx: number, e: { checked: boolean | "indeterminate" }) => {
        setCart(cart.map((shop, sIdx) => sIdx === shopIdx ? {
            ...shop,
            items: shop.items.map((item, iIdx) => iIdx === itemIdx ? { ...item, checked: !!e.checked && e.checked !== "indeterminate" } : item),
        } : shop));
    };

    // 数量加减
    const handleCountChange = (shopIdx: number, itemIdx: number, delta: number) => {
        setCart(cart => cart.map((shop, sIdx) => sIdx === shopIdx ? {
            ...shop,
            items: shop.items.map((item, iIdx) => iIdx === itemIdx ? { ...item, count: Math.max(1, item.count + delta) } : item),
        } : shop));
    };

    return (
        <Box bg="#f5f5f7" minH="100vh" pb="80px">
            {/* 地址栏 */}
            <Flex align="center" justify="space-between" px={4} py={3} bg="#fff" >
                <Flex align="center" gap={1} color="gray.600">
                    <FiMapPin />
                    <Text fontSize="md">请添加收货地址</Text>
                </Flex>
                <Text fontSize="md" color="red.500" fontWeight="medium" cursor="pointer">管理</Text>
            </Flex>

            {/* 购物车店铺和商品 */}
            <Box px={4} pt={4}>
                {cart.map((shop, shopIdx) => {
                    const shopAllChecked = shop.items.every(item => item.checked);
                    const shopIndeterminate = shop.items.some(item => item.checked) && !shopAllChecked;
                    return (
                        <Box key={shop.shop.name + shopIdx} bg="#fff" borderRadius="xl" mb={4} p={3} boxShadow="xs">
                            <Flex align="center" mb={2}>
                                <Checkbox.Root
                                    checked={shopIndeterminate ? "indeterminate" : shopAllChecked}
                                    onCheckedChange={e => handleShopChecked(shopIdx, e)}
                                    style={{ marginRight: 8 }}
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                </Checkbox.Root>
                                {shop.shop.tag && <Badge colorScheme="red" mr={2}>{shop.shop.tag}</Badge>}
                                <Text fontWeight="bold" color="#222" fontSize="md">{shop.shop.name}</Text>
                                <FiChevronRight style={{ marginLeft: 4, color: '#bbb' }} />
                            </Flex>
                            {shop.items.map((item, itemIdx) => (
                                <Flex key={item.id} align="center" py={2} borderTop="1px solid #f5f5f7" _first={{ borderTop: 'none' }}>
                                    <Checkbox.Root
                                        checked={item.checked}
                                        onCheckedChange={e => handleItemChecked(shopIdx, itemIdx, e)}
                                        style={{ marginRight: 8 }}
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                    </Checkbox.Root>
                                    <Image src={item.img} alt={item.name} boxSize="64px" borderRadius="lg" objectFit="cover" mr={3} />
                                    <Box flex={1} minW={0}>
                                        <Text fontWeight="medium" fontSize="sm" truncate>{item.name}</Text>
                                        {item.attrs && (
                                            <Flex
                                                align="center"
                                                bg="#f5f5f5"
                                                borderRadius="full"
                                                px={3}
                                                py={1}
                                                w="fit-content"
                                                mt={1}
                                                fontSize="xs"
                                                color="#222"
                                                gap={1}
                                            >
                                                {item.attrs}
                                                <Box as="span" ml={1} display="flex" alignItems="center">
                                                    <FiChevronDown />
                                                </Box>
                                            </Flex>
                                        )}
                                        <Flex align="center" mt={1} justify="space-between">
                                            <Text color="red.500" fontWeight="bold" fontSize="lg">
                                                ￥<Text as="span" fontSize="xl">{item.price}</Text>
                                            </Text>
                                            {/* 数量操作 */}
                                            <Flex align="center" border="1px solid #eee" borderRadius="full" px={2} gap={1}>
                                                <Button size="2xs" variant="ghost" minW={6} p={0} onClick={() => handleCountChange(shopIdx, itemIdx, -1)}><FiMinus /></Button>
                                                <Text minW={4} textAlign="center">{item.count}</Text>
                                                <Button size="2xs" variant="ghost" minW={6} p={0} onClick={() => handleCountChange(shopIdx, itemIdx, 1)}><FiPlus /></Button>
                                            </Flex>
                                        </Flex>
                                    </Box>

                                </Flex>
                            ))}
                        </Box>
                    );
                })}
            </Box>

            {/* 底部操作栏 */}
            <Flex position="fixed" left={0} right={0} bottom="64px" bg="#fff" align="center" px={4} py={3} borderTop="1px solid #eee" zIndex={10}>
                <Checkbox.Root
                    checked={indeterminate ? "indeterminate" : allChecked}
                    onCheckedChange={handleAllChecked}
                    style={{ marginRight: 8 }}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                </Checkbox.Root>
                <Text fontSize="md" mr={2}>全选</Text>
                <Box flex={1} />
                <Text fontSize="md">合计：<Text as="span" color="red.500" fontWeight="bold" fontSize="xl">￥{totalPrice.toFixed(2)}</Text></Text>
                <Button colorScheme="red" borderRadius="full" ml={4} px={8} size="lg">结算 ({totalCount})</Button>
            </Flex>
        </Box>
    );
} 