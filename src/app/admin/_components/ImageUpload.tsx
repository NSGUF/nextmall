'use client';

import React, { useRef, useState } from 'react';
import {
    Box,
    Button,
    Image,
    VStack,
    HStack,
    Text,
    IconButton,
    Flex,
} from '@chakra-ui/react';
import { FiUpload, FiTrash2, FiPlus } from 'react-icons/fi';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

interface ImageUploadProps {
    value?: string | string[];
    onChange: (value: string | string[]) => void;
    multiple?: boolean;
    maxFiles?: number;
    folder?: string;
    placeholder?: string;
    disabled?: boolean;
}

export default function ImageUpload({
    value,
    onChange,
    multiple = false,
    maxFiles = 5,
    folder = 'uploads',
    placeholder = '点击上传图片',
    disabled = false,
}: ImageUploadProps) {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // 处理单个文件上传
    const uploadSingleImage = api.util.uploadImage.useMutation({
        onSuccess: (data) => {
            showSuccessToast('图片上传成功');
            if (multiple) {
                const currentValues = Array.isArray(value)
                    ? value
                    : value
                      ? [value]
                      : [];
                onChange([...currentValues, data.url]);
            } else {
                onChange(data.url);
            }
            setUploading(false);
        },
        onError: (error) => {
            showErrorToast(error.message || '上传失败');
            setUploading(false);
        },
    });

    // 处理多个文件上传
    const uploadMultipleImages = api.util.uploadMultipleImages.useMutation({
        onSuccess: (data) => {
            showSuccessToast(`成功上传 ${data.results.length} 张图片`);
            const urls = data.results.map((result) => result.url);
            if (multiple) {
                const currentValues = Array.isArray(value)
                    ? value
                    : value
                      ? [value]
                      : [];
                onChange([...currentValues, ...urls]);
            } else {
                onChange(urls[0] || '');
            }
            setUploading(false);
        },
        onError: (error) => {
            showErrorToast(error.message || '上传失败');
            setUploading(false);
        },
    });

    // 处理文件选择
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        // 检查文件数量限制
        if (multiple) {
            const currentCount = Array.isArray(value)
                ? value.length
                : value
                  ? 1
                  : 0;
            if (currentCount + fileArray.length > maxFiles) {
                showErrorToast(`最多只能上传 ${maxFiles} 张图片`);
                return;
            }
        } else if (fileArray.length > 1) {
            showErrorToast('只能上传一张图片');
            return;
        }

        // 验证文件类型和大小
        for (const file of fileArray) {
            if (!file.type.startsWith('image/')) {
                showErrorToast('请选择图片文件');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showErrorToast('图片大小不能超过5MB');
                return;
            }
        }

        setUploading(true);

        if (fileArray.length === 1) {
            // 单个文件上传
            const file = fileArray[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                uploadSingleImage.mutate({
                    image: base64,
                    filename: file.name,
                    folder,
                });
            };
            reader.readAsDataURL(file);
        } else {
            // 多个文件上传
            const promises = fileArray.map((file) => {
                return new Promise<{ image: string; filename: string }>(
                    (resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolve({
                                image: e.target?.result as string,
                                filename: file.name,
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                );
            });

            Promise.all(promises).then((images) => {
                uploadMultipleImages.mutate({
                    images,
                    folder,
                });
            });
        }

        // 清空文件输入
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 触发文件选择
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    // 删除图片
    const removeImage = (index: number) => {
        if (multiple && Array.isArray(value)) {
            const newValues = value.filter((_, i) => i !== index);
            onChange(newValues);
        } else {
            onChange(multiple ? [] : '');
        }
    };

    // 获取当前图片列表
    const getImageList = (): string[] => {
        if (multiple) {
            return Array.isArray(value) ? value : value ? [value] : [];
        } else {
            return value ? [value as string] : [];
        }
    };

    const imageList = getImageList();
    const canAddMore = multiple
        ? imageList.length < maxFiles
        : imageList.length === 0;

    return (
        <VStack align="stretch" gap={3}>
            {/* 图片预览区域 */}
            {imageList.length > 0 && (
                <Flex wrap="wrap" gap={3}>
                    {imageList.map((url, index) => (
                        <Box key={index} position="relative">
                            <Image
                                src={url}
                                alt={`上传的图片 ${index + 1}`}
                                w="100px"
                                h="100px"
                                objectFit="cover"
                                borderRadius="md"
                                border="1px solid"
                                borderColor="gray.200"
                            />
                            {!disabled && (
                                <IconButton
                                    aria-label="删除图片"
                                    size="xs"
                                    position="absolute"
                                    top="-15px"
                                    right="-16px"
                                    borderRadius="full"
                                    onClick={() => removeImage(index)}
                                >
                                    <FiTrash2 />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                </Flex>
            )}

            {/* 上传按钮 */}
            {canAddMore && !disabled && (
                <Box>
                    <Button
                        onClick={triggerFileSelect}
                        loading={uploading}
                        variant="outline"
                        w="fit-content"
                    >
                        {multiple && imageList.length > 0 ? (
                            <FiPlus />
                        ) : (
                            <FiUpload />
                        )}
                        {multiple && imageList.length > 0
                            ? '添加更多图片'
                            : placeholder}
                    </Button>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                        支持 JPG、PNG、GIF 格式，单个文件不超过 5MB
                        {multiple && ` (最多 ${maxFiles} 张)`}
                    </Text>
                </Box>
            )}

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={multiple}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
        </VStack>
    );
}
