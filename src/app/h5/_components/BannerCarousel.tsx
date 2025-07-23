'use client';
import { useState, useRef, useEffect } from 'react';
import { Box, Image, Flex } from '@chakra-ui/react';

export default function BannerCarousel({ banners = [], height = '140px' }) {
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const prev = () => {
        setFade(false);
        setTimeout(() => {
            setIndex((i) => (i === 0 ? banners.length - 1 : i - 1));
            setFade(true);
        }, 200);
        resetAutoPlay();
    };
    const next = () => {
        setFade(false);
        setTimeout(() => {
            setIndex((i) => (i + 1 >= banners.length ? 0 : i + 1));
            setFade(true);
        }, 200);
        resetAutoPlay();
    };

    // 自动轮播
    useEffect(() => {
        startAutoPlay();
        return () => stopAutoPlay();
    }, [index, banners]);

    const startAutoPlay = () => {
        if (banners.length <= 1) return;
        stopAutoPlay();
        timerRef.current = setTimeout(() => {
            next();
        }, 6000);
    };
    const stopAutoPlay = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };
    const resetAutoPlay = () => {
        stopAutoPlay();
        timerRef.current = setTimeout(() => {
            next();
        }, 6000);
    };

    // 触摸事件处理
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches?.[0]?.clientX ?? 0;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches?.[0]?.clientX ?? 0;
    };
    const onTouchEnd = () => {
        const delta = touchEndX.current - touchStartX.current;
        if (Math.abs(delta) > 40) {
            if (delta < 0) {
                next(); // 左滑
            } else {
                prev(); // 右滑
            }
        }
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    return (
        <Box
            position="relative"
            w="100%"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {!banners || banners.length === 0 ? (
                <></>
            ) : (
                banners[index]?.image &&
                (banners[index]?.link ? (
                    <a
                        href={banners[index]?.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Image
                            src={banners[index].image}
                            alt={banners[index]?.description ?? 'banner'}
                            borderRadius="xl"
                            w="100%"
                            h={height}
                            objectFit="cover"
                            cursor="pointer"
                            transition="opacity 0.4s"
                            opacity={fade ? 1 : 0}
                        />
                    </a>
                ) : (
                    <Image
                        src={banners[index].image}
                        alt={banners[index]?.description ?? 'banner'}
                        w="100%"
                        h={height}
                        objectFit="cover"
                        cursor="pointer"
                        transition="opacity 0.4s"
                        opacity={fade ? 1 : 0}
                    />
                ))
            )}
            {/* 指示点 */}
            <Flex
                position="absolute"
                bottom="2"
                left="50%"
                transform="translateX(-50%)"
                gap={2}
            >
                {banners.map((_, i) => (
                    <Box
                        key={i}
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={i === index ? 'red.400' : 'gray.300'}
                        cursor="pointer"
                        onClick={() => setIndex(i)}
                    />
                ))}
            </Flex>
        </Box>
    );
}
