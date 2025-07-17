import { Box, IconButton, Wrap, Avatar, Flex } from "@chakra-ui/react";
import {
    FiBell,
    FiCalendar,
    FiMenu,
    FiList,
} from "react-icons/fi";

const Header = () => {
    return (
        <Box
            borderBottomWidth="1px"
            px={3}
            h="54px"
            bg="white"
            _dark={{ bg: "black" }}
            backdropFilter="blur(2px)"
        >
            <Flex justifyContent="space-between" alignItems="center" h="full">
                <IconButton
                    aria-label="Menu"
                    variant="ghost"
                    fontSize="xl"
                    rounded="full"
                ><FiMenu /></IconButton>
                <Wrap gap={0} alignItems="center">
                    <IconButton
                        aria-label="Notifications"
                        title="Notifications"
                        variant="ghost"
                        rounded="full"
                        color="gray.600"
                        _dark={{ color: "initial" }}
                    >
                        <FiBell size={24} color="#1e40af" />
                    </IconButton>
                    <IconButton
                        aria-label="Reminder"
                        title="Reminder"
                        variant="ghost"
                        rounded="full"
                        color="gray.600"
                        _dark={{ color: "initial" }}
                    >
                        <FiCalendar size={21} />
                    </IconButton>
                    <IconButton
                        aria-label="Tasks"
                        title="Tasks"
                        variant="ghost"
                        rounded="full"
                        color="gray.600"
                        _dark={{ color: "initial" }}
                    >
                        <FiList size={21} />
                    </IconButton>
                    <Avatar.Root colorPalette="orange" ml={1} size="sm">
                        <Avatar.Fallback name="Rahul Bayad" />
                        <Avatar.Image src="/userAvatar.jpg" h="36px" w="36px" />
                    </Avatar.Root>
                </Wrap>
            </Flex>
        </Box>
    );
};

export default Header; 