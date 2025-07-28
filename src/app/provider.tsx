'use client';

import * as React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { createSystem, defaultConfig } from '@chakra-ui/react';
import { buttonRecipe } from './theme/button.recipe';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/app/_components/ui/toaster';
import RouteGuard from '@/app/_components/RouteGuard';
import { useState, useEffect } from 'react';

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <SessionProvider>
            <ChakraProvider value={system}>
                <ThemeProvider
                    attribute="class"
                    disableTransitionOnChange
                    defaultTheme="light"
                    enableSystem={false}
                >
                    <RouteGuard>{children}</RouteGuard>
                    <Toaster />
                </ThemeProvider>
            </ChakraProvider>
        </SessionProvider>
    );
}
