'use client';

import {
    Box,
    Text,
    Table,
    Badge,
    Image,
    Flex,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { api } from '@/trpc/react';

export default function StockAlert() {
    const {
        data: stockAlerts,
        isLoading,
        error,
    } = api.dashboard.getStockAlerts.useQuery();

    if (isLoading) {
        return (
            <Box bg="white" p={6} borderRadius="lg">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                    库存预警
                </Text>
                <Center py={8}>
                    <Spinner />
                </Center>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                bg="white"
                p={6}
                borderRadius="lg"
                borderWidth={1}
                borderColor="gray.200"
            >
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                    库存预警
                </Text>
                <Box
                    p={4}
                    bg="red.50"
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="red.200"
                >
                    <Text fontSize="sm" color="red.600" fontWeight="medium">
                        加载失败: {error.message}
                    </Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            bg="white"
            p={6}
            borderRadius="lg"
            borderWidth={1}
            borderColor="gray.200"
        >
            <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" fontWeight="bold">
                    库存预警
                </Text>
                <Badge colorScheme="red" variant="subtle">
                    {stockAlerts?.length || 0} 个商品
                </Badge>
            </Flex>

            {!stockAlerts || stockAlerts.length === 0 ? (
                <Box
                    p={4}
                    bg="green.50"
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="green.200"
                >
                    <Text fontSize="sm" color="green.600" fontWeight="medium">
                        库存充足 - 暂无库存不足的商品
                    </Text>
                </Box>
            ) : (
                <Box overflowX="auto">
                    <Table.Root size="sm">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>商品</Table.ColumnHeader>
                                <Table.ColumnHeader>规格</Table.ColumnHeader>
                                <Table.ColumnHeader>供应商</Table.ColumnHeader>
                                <Table.ColumnHeader>
                                    当前库存
                                </Table.ColumnHeader>
                                <Table.ColumnHeader>价格</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {stockAlerts.map((alert) => (
                                <Table.Row key={alert.id}>
                                    <Table.Cell>
                                        <Flex align="center" gap={3}>
                                            <Image
                                                src={alert.product.image}
                                                alt={alert.product.title}
                                                w={10}
                                                h={10}
                                                objectFit="cover"
                                                borderRadius="md"
                                            />
                                            <Box>
                                                <Text
                                                    fontSize="sm"
                                                    fontWeight="medium"
                                                >
                                                    {alert.product.title}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Text fontSize="sm">
                                            {alert.value} * {alert.name}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Text fontSize="sm">
                                            {alert.product.vendor.name ||
                                                '未知'}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>{alert.stock}</Table.Cell>
                                    <Table.Cell>
                                        <Text
                                            fontSize="sm"
                                            color="red.500"
                                            fontWeight="medium"
                                        >
                                            ¥{alert.price.toFixed(2)}
                                        </Text>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>
            )}
        </Box>
    );
}
