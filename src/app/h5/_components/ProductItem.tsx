import { Box, Flex, Image, Text, Button } from '@chakra-ui/react';
import Link from 'next/link';
export default function ProductItem({
    products,
    isShowDelete = false,
    onDelete = (id) => {},
}) {
    return (
        <>
            {products?.map((item) => (
                <Box
                    key={item.id}
                    w="100%"
                    textAlign="center"
                    bg="white"
                    borderRadius="xs"
                    boxShadow="1sx"
                    p={2}
                    py={2}
                    _hover={{ boxShadow: 'md' }}
                >
                    <Link href={'/full/product?id=' + item.id}>
                        <Flex
                            align="center"
                            justify="flex-start"
                            w="100%"
                            h="100%"
                        >
                            <Image
                                src={item.images?.[0] ?? '/logo.svg'}
                                alt={item.title}
                                w="80px"
                                h="80px"
                                borderRadius="md"
                                objectFit="cover"
                                bg="gray.100"
                                mr={2}
                            />
                            <Flex
                                direction="column"
                                h="100%"
                                flex="1"
                                justify="space-between"
                                minW={0}
                            >
                                <Text
                                    fontSize="md"
                                    textAlign="left"
                                    whiteSpace="nowrap"
                                    w="100%"
                                    fontWeight="medium"
                                    overflow="hidden"
                                    color="gray.700"
                                    textOverflow="ellipsis"
                                    minW={0}
                                >
                                    {item.title}
                                </Text>
                                <Text
                                    fontSize="sm"
                                    color="red.500"
                                    textAlign="left"
                                    fontWeight="medium"
                                >
                                    ￥{item.specs[0]?.price.toFixed(2)}
                                </Text>
                                <Flex align="center" justify="space-between">
                                    <Text
                                        color="gray.400"
                                        fontSize="xs"
                                        textAlign="left"
                                    >
                                        已售{item.sales}件
                                    </Text>
                                    {isShowDelete && (
                                        <Button
                                            size="2xs"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDelete(item.id);
                                            }}
                                        >
                                            删除
                                        </Button>
                                    )}
                                </Flex>
                            </Flex>
                        </Flex>
                    </Link>
                </Box>
            ))}
        </>
    );
}
