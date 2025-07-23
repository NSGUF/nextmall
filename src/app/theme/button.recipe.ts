import { defineRecipe } from '@chakra-ui/react';

export const buttonRecipe = defineRecipe({
    base: {
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        colorPalette: 'red',
        // bg: "#ff0000",      // 使用主题色
        // color: "white",     // 文字颜色
    },
    variants: {
        variant: {
            ghost: {
                bg: 'transparent',
                _hover: {
                    bg: 'gray.100',
                },
            },
        },
    },
});
