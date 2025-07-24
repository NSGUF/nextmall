'use client';

import {
    Box,
    Flex,
    Text,
    Button,
    Image,
    Grid,
    Badge,
    Input,
} from '@chakra-ui/react';
import { Checkbox } from '@chakra-ui/react';
import {
    FiChevronRight,
    FiMinus,
    FiPlus,
    FiMapPin,
    FiChevronDown,
    FiTrash2,
} from 'react-icons/fi';
import * as React from 'react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import useCustomToast from '@/app/hooks/useCustomToast';
import { STORE_GOOD_DATA_KEY, STORE_LAUNCH_INFO_KEY } from '@/app/const';
import { ContentLoading } from '@/app/_components/LoadingSpinner';

// 购物车商品接口
interface CartItem {
    id: string;
    productId: string;
    specId?: string;
    quantity: number;
    checked: boolean;
    product: {
        id: string;
        title: string;
        images: string[];
        vendor: {
            id: string;
            name: string;
        };
        logiPrice: number;
    };
    spec?: {
        id: string;
        name: string;
        value: string;
        price: number;
        image?: string;
        stock?: number;
    };
}

interface CartVendor {
    vendor: {
        id: string;
        name: string;
    };
    items: CartItem[];
}

export default function CartPage() {
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();

    // 获取购物车数据
    const {
        data: cartData = [],
        refetch,
        isLoading: cartLoading,
    } = api.cart.list.useQuery(undefined, {
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60, // 1分钟缓存
        gcTime: 1000 * 60 * 5, // 5分钟垃圾回收
    });

    // 批量删除购物车商品
    const removeManyCartItems = api.cart.removeMany.useMutation({
        onSuccess: () => {
            showSuccessToast('删除成功');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 更新购物车商品数量
    const updateQuantity = api.cart.updateQuantity.useMutation({
        onSuccess: () => void refetch(),
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 处理购物车数据，按供应商分组
    const cart: CartVendor[] = React.useMemo(() => {
        const vendorMap = new Map<string, CartVendor>();

        cartData.forEach((item) => {
            const vendorId = item.product?.vendor?.id;
            if (!vendorId) return;

            const cartItem: CartItem = {
                id: item.id!,
                productId: item.productId!,
                specId: item.specId || undefined,
                quantity: item.quantity!,
                checked: false, // 默认不选中
                product: {
                    id: item.product!.id!,
                    title: item.product!.title!,
                    images: item.product!.images || [],
                    vendor: {
                        id: item.product!.vendor!.id!,
                        name: item.product!.vendor!.name!,
                    },
                    logiPrice: item.product!.logiPrice || 0,
                },
                spec: item.spec
                    ? {
                          id: item.spec.id,
                          name: item.spec.name,
                          value: item.spec.value,
                          price: item.spec.price,
                          image: item.spec.image || undefined,
                          stock: item.spec.stock || 0,
                      }
                    : undefined,
            };

            if (vendorMap.has(vendorId)) {
                vendorMap.get(vendorId)!.items.push(cartItem);
            } else {
                vendorMap.set(vendorId, {
                    vendor: {
                        id: item.product!.vendor!.id!,
                        name: item.product!.vendor!.name!,
                    },
                    items: [cartItem],
                });
            }
        });

        return Array.from(vendorMap.values());
    }, [cartData]);

    // 购物车状态：每个商品有checked属性
    const [cartState, setCartState] = React.useState<CartVendor[]>([]);
    const prevCartRef = React.useRef<CartVendor[]>([]);

    React.useEffect(() => {
        // 比较当前 cart 和之前的 cart，只有真正变化时才更新
        const cartChanged =
            JSON.stringify(cart) !== JSON.stringify(prevCartRef.current);
        if (cartChanged) {
            setCartState(cart);
            prevCartRef.current = cart;
        }
    }, [cart]);

    // 计算总价和结算数量
    const { totalPrice, totalCount } = React.useMemo(() => {
        let totalPrice = 0;
        let totalCount = 0;
        cartState.forEach((vendor) => {
            vendor.items.forEach((item) => {
                if (item.checked) {
                    const price = item.spec?.price || 0;
                    totalPrice += price * item.quantity;
                    totalCount += 1;
                }
            });
        });
        return { totalPrice, totalCount };
    }, [cartState]);

    // 全选状态
    const allChecked = cartState.every((vendor) =>
        vendor.items.every((item) => item.checked)
    );
    const indeterminate =
        cartState.some((vendor) => vendor.items.some((item) => item.checked)) &&
        !allChecked;

    // 全选/取消全选
    const handleAllChecked = (e: { checked: boolean | 'indeterminate' }) => {
        const checked = e.checked === true || e.checked === 'indeterminate';
        setCartState(
            cartState.map((vendor) => ({
                ...vendor,
                items: vendor.items.map((item) => ({ ...item, checked })),
            }))
        );
    };

    // 供应商下所有商品选中/取消
    const handleVendorChecked = (
        vendorIdx: number,
        e: { checked: boolean | 'indeterminate' }
    ) => {
        const checked = e.checked === true || e.checked === 'indeterminate';
        setCartState(
            cartState.map((vendor, idx) =>
                idx === vendorIdx
                    ? {
                          ...vendor,
                          items: vendor.items.map((item) => ({
                              ...item,
                              checked,
                          })),
                      }
                    : vendor
            )
        );
    };

    // 单个商品选中/取消
    const handleItemChecked = (
        vendorIdx: number,
        itemIdx: number,
        e: { checked: boolean | 'indeterminate' }
    ) => {
        setCartState(
            cartState.map((vendor, vIdx) =>
                vIdx === vendorIdx
                    ? {
                          ...vendor,
                          items: vendor.items.map((item, iIdx) =>
                              iIdx === itemIdx
                                  ? {
                                        ...item,
                                        checked:
                                            !!e.checked &&
                                            e.checked !== 'indeterminate',
                                    }
                                  : item
                          ),
                      }
                    : vendor
            )
        );
    };

    // 数量加减
    const handleCountChange = (
        vendorIdx: number,
        itemIdx: number,
        delta: number
    ) => {
        const vendor = cartState[vendorIdx];
        const item = vendor.items[itemIdx];
        const maxStock = item.spec?.stock || 999;
        const newQuantity = Math.max(
            1,
            Math.min(maxStock, item.quantity + delta)
        );

        // 如果数量没有变化，不执行更新
        if (newQuantity === item.quantity) {
            if (item.quantity >= maxStock && delta > 0) {
                showErrorToast('库存不足');
            }
            return;
        }

        // 更新本地状态
        setCartState((cartState) =>
            cartState.map((vendor, vIdx) =>
                vIdx === vendorIdx
                    ? {
                          ...vendor,
                          items: vendor.items.map((item, iIdx) =>
                              iIdx === itemIdx
                                  ? {
                                        ...item,
                                        quantity: newQuantity,
                                    }
                                  : item
                          ),
                      }
                    : vendor
            )
        );

        // 更新后台数据
        updateQuantity.mutate({
            id: item.id,
            quantity: newQuantity,
        });
    };

    // 删除选中的商品
    const handleDeleteSelected = () => {
        const selectedIds: string[] = [];
        cartState.forEach((vendor) => {
            vendor.items.forEach((item) => {
                if (item.checked) {
                    selectedIds.push(item.id);
                }
            });
        });

        if (selectedIds.length === 0) {
            showErrorToast('请选择要删除的商品');
            return;
        }

        removeManyCartItems.mutate({ ids: selectedIds });
    };

    // 结算
    const handleCheckout = () => {
        const selectedItems: any[] = [];
        cartState.forEach((vendor) => {
            vendor.items.forEach((item) => {
                if (item.checked) {
                    selectedItems.push({
                        product: item.product,
                        selectedSpec: item.spec,
                        quantity: item.quantity,
                    });
                }
            });
        });

        if (selectedItems.length === 0) {
            showErrorToast('请选择要结算的商品');
            return;
        }

        // 跳转到订单确认页
        const params = btoa(Date.now().toString());
        localStorage.setItem(STORE_LAUNCH_INFO_KEY, params);
        localStorage.setItem(
            STORE_GOOD_DATA_KEY,
            JSON.stringify(selectedItems)
        );
        router.push(`/full/confirm?data=${params}`);
    };

    if (cartLoading) {
        return <ContentLoading text="购物车加载中..." />;
    }

    return (
        <Box bg="#f5f5f7" minH="100vh" pb="80px">
            {/* 地址栏 */}
            <Flex
                align="center"
                justify="space-between"
                px={4}
                py={3}
                bg="#fff"
            >
                <Flex align="center" fontSize="md" fontWeight="medium" gap={1}>
                    购物车
                    <Text fontSize="xs">（{cartData.length}）</Text>
                </Flex>
                <Button
                    variant="ghost"
                    size="sm"
                    color="red.500"
                    fontWeight="medium"
                    onClick={handleDeleteSelected}
                >
                    <FiTrash2 />
                    删除
                </Button>
            </Flex>

            {/* 购物车供应商和商品 */}
            <Box px={4} pt={4}>
                {cartState.map((vendor, vendorIdx) => {
                    const vendorAllChecked = vendor.items.every(
                        (item) => item.checked
                    );
                    const vendorIndeterminate =
                        vendor.items.some((item) => item.checked) &&
                        !vendorAllChecked;
                    return (
                        <Box
                            key={vendor.vendor.id}
                            bg="#fff"
                            borderRadius="xl"
                            mb={4}
                            p={3}
                            boxShadow="xs"
                        >
                            <Flex align="center" mb={2}>
                                <Checkbox.Root
                                    checked={
                                        vendorIndeterminate
                                            ? 'indeterminate'
                                            : vendorAllChecked
                                    }
                                    onCheckedChange={(e) =>
                                        handleVendorChecked(vendorIdx, e)
                                    }
                                    style={{ marginRight: 8 }}
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                </Checkbox.Root>
                                {/* <Badge colorScheme="blue" mr={2}>
                                    供应商
                                </Badge> */}
                                <Text
                                    fontWeight="bold"
                                    color="#222"
                                    fontSize="md"
                                >
                                    {vendor.vendor.name}
                                </Text>
                                {/* <FiChevronRight
                                    style={{ marginLeft: 4, color: '#bbb' }}
                                /> */}
                            </Flex>
                            {vendor.items.map((item, itemIdx) => (
                                <Flex
                                    key={item.id}
                                    align="center"
                                    py={2}
                                    borderTop="1px solid #f5f5f7"
                                    _first={{ borderTop: 'none' }}
                                >
                                    <Checkbox.Root
                                        checked={item.checked}
                                        onCheckedChange={(e) =>
                                            handleItemChecked(
                                                vendorIdx,
                                                itemIdx,
                                                e
                                            )
                                        }
                                        style={{ marginRight: 8 }}
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                    </Checkbox.Root>
                                    <Image
                                        src={
                                            item.spec?.image ||
                                            item.product.images[0] ||
                                            '/logo.svg'
                                        }
                                        alt={item.product.title}
                                        boxSize="60px"
                                        borderRadius="md"
                                        mr={3}
                                    />
                                    <Box flex={1} minW="0">
                                        <Text
                                            fontWeight="medium"
                                            color="#222"
                                            textOverflow="ellipsis"
                                            overflow="hidden"
                                            whiteSpace="nowrap"
                                            minW="0"
                                        >
                                            {item.product.title}
                                        </Text>
                                        {item.spec && (
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
                                                {item.spec.value}{' '}
                                                {item.spec.name}
                                                <Box
                                                    as="span"
                                                    ml={1}
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    <FiChevronDown />
                                                </Box>
                                            </Flex>
                                        )}
                                        <Flex
                                            align="center"
                                            justify="space-between"
                                            mt={2}
                                        >
                                            <Text
                                                fontSize="lg"
                                                fontWeight="bold"
                                                color="red.500"
                                            >
                                                ¥
                                                {item.spec?.price?.toFixed(2) ||
                                                    '0.00'}
                                            </Text>
                                            <Flex
                                                align="center"
                                                border="1px solid #eee"
                                                borderRadius="full"
                                                px={2}
                                                gap={0}
                                            >
                                                <Button
                                                    size="2xs"
                                                    variant="ghost"
                                                    p={0}
                                                    onClick={() =>
                                                        handleCountChange(
                                                            vendorIdx,
                                                            itemIdx,
                                                            -1
                                                        )
                                                    }
                                                >
                                                    <FiMinus />
                                                </Button>
                                                <Input
                                                    size="2xs"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const maxStock =
                                                            item.spec?.stock ||
                                                            999;
                                                        const newQuantity =
                                                            Math.max(
                                                                1,
                                                                Math.min(
                                                                    maxStock,
                                                                    parseInt(
                                                                        e.target
                                                                            .value
                                                                    ) || 1
                                                                )
                                                            );
                                                        handleCountChange(
                                                            vendorIdx,
                                                            itemIdx,
                                                            newQuantity -
                                                                item.quantity
                                                        );
                                                    }}
                                                    textAlign="center"
                                                    border="none"
                                                    p={0}
                                                    minW={6}
                                                    maxW={8}
                                                    fontSize="sm"
                                                    fontWeight="medium"
                                                    _focus={{
                                                        border: 'none',
                                                        boxShadow: 'none',
                                                    }}
                                                />
                                                <Button
                                                    size="2xs"
                                                    variant="ghost"
                                                    p={0}
                                                    disabled={
                                                        item.quantity >=
                                                        item.spec?.stock
                                                    }
                                                    onClick={() =>
                                                        handleCountChange(
                                                            vendorIdx,
                                                            itemIdx,
                                                            1
                                                        )
                                                    }
                                                >
                                                    <FiPlus />
                                                </Button>
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
            <Flex
                position="fixed"
                left={0}
                right={0}
                bottom="64px"
                bg="#fff"
                align="center"
                px={4}
                py={3}
                borderTop="1px solid #eee"
                zIndex={10}
            >
                <Checkbox.Root
                    checked={indeterminate ? 'indeterminate' : allChecked}
                    onCheckedChange={handleAllChecked}
                    style={{ marginRight: 8 }}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                </Checkbox.Root>
                <Text fontSize="md" mr={2}>
                    全选
                </Text>
                <Box flex={1} />
                <Text fontSize="md">
                    合计：
                    <Text
                        as="span"
                        color="red.500"
                        fontWeight="bold"
                        fontSize="xl"
                    >
                        ￥{totalPrice.toFixed(2)}
                    </Text>
                </Text>
                <Button
                    colorScheme="red"
                    borderRadius="full"
                    ml={4}
                    px={8}
                    size="lg"
                    onClick={handleCheckout}
                >
                    结算 ({totalCount})
                </Button>
            </Flex>
        </Box>
    );
}
