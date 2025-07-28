'use client';

import React, { useState, useEffect } from 'react';
import { Input, HStack, Text } from '@chakra-ui/react';
import { formatDuration, parseDuration } from '@/app/utils/formatDuration';

interface DurationInputProps {
    value?: number; // 秒数
    onChange: (seconds: number) => void;
    placeholder?: string;
    disabled?: boolean;
    name?: string;
    onBlur?: () => void;
}

export default function DurationInput({
    value = 0,
    onChange,
    placeholder = '00:00:00',
    disabled = false,
    name,
    onBlur,
}: DurationInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    // 当外部 value 变化时更新显示值
    useEffect(() => {
        setDisplayValue(formatDuration(value));
    }, [value]);

    // 处理输入变化
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        setDisplayValue(inputValue);

        // 尝试解析输入的时间格式
        const seconds = parseDuration(inputValue);
        onChange(seconds);
    };

    // 处理失焦事件，格式化输入值
    const handleBlur = () => {
        const seconds = parseDuration(displayValue);
        const formattedValue = formatDuration(seconds);
        setDisplayValue(formattedValue);
        onChange(seconds);
        onBlur?.();
    };

    // 处理键盘输入，只允许数字和冒号
    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const char = event.key;
        const isNumber = /[0-9]/.test(char);
        const isColon = char === ':';
        const isBackspace = char === 'Backspace';
        const isDelete = char === 'Delete';
        const isArrow = [
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
        ].includes(char);
        const isTab = char === 'Tab';

        if (
            !isNumber &&
            !isColon &&
            !isBackspace &&
            !isDelete &&
            !isArrow &&
            !isTab
        ) {
            event.preventDefault();
        }
    };

    return (
        <HStack align="center">
            <Input
                value={displayValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled}
                name={name}
                maxLength={8} // HH:MM:SS 最大长度
                fontFamily="mono"
                textAlign="center"
                width="120px"
            />
            <Text fontSize="sm" color="gray.500">
                (时:分:秒)
            </Text>
        </HStack>
    );
}
