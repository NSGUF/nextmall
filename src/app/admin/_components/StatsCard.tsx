'use client';

import { Box, Text, Grid, Flex, Icon, VStack, HStack, Separator } from '@chakra-ui/react';
import type { IconType } from 'react-icons';

interface UserStatsData {
    total: number | string;
    todayActive: number | string;
    yesterdayActive: number | string;
    currentMonthActive: number | string;
    lastMonthActive: number | string;
    title: string;
    icon: IconType;
}

interface UserStatsCardProps {
    data: UserStatsData;
}

export default function UserStatsCard({ data }: UserStatsCardProps) {
    return (
        <Box
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="xs"
            flex="1"
            _hover={{ shadow: 'md' }}
            transition="all 0.2s"
        >
            <Flex align="center" justify="space-between" mb={0}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {data.title}
                </Text>
                <Box borderRadius="full" bg="blue.50">
                    <Icon as={data.icon} w={5} h={5} color="blue.500" />
                </Box>
            </Flex>

            <Text fontSize="3xl" fontWeight="bold" color="gray.900" mb={2}>
                {data.total.toLocaleString()}
            </Text>

           <Flex justify="space-between">
                    <Text fontSize="xs" color="gray.500" mb={1}>
                        今日： {data.todayActive}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                        昨日： {data.yesterdayActive}
                    </Text>
                </Flex>

<Separator my={2}/>

                <Flex justify="space-between">
                    <Text fontSize="xs" color="gray.500" mb={1}>
                        当月：{data.currentMonthActive}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                        上月：{data.lastMonthActive}
                    </Text>
                    </Flex>

        </Box>
    );
}
