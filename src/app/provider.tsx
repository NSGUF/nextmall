'use client';

import * as React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { createSystem, defaultConfig } from '@chakra-ui/react';
import { buttonRecipe } from './theme/button.recipe';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/app/_components/ui/toaster';
export const system = createSystem(defaultConfig, {
    globalCss: {
        html: {
            fontSize: '16px',
        },
        body: {
            fontSize: '0.875rem',
            margin: 0,
            padding: 0,
        },
        '.main-link': {
            color: 'ui.link',
            textDecoration: 'underline',
        },
    },
    theme: {
        tokens: {
            colors: {
                ui: {
                    main: { value: '#ff0000' },
                    link: { value: '#697284' },
                },
            },
        },
        recipes: {
            button: buttonRecipe,
        },
    },
});

export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ChakraProvider value={system}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    suppressHydrationWarning
                >
                    {children}
                </ThemeProvider>
                <Toaster />
            </ChakraProvider>
        </SessionProvider>
    );
}
