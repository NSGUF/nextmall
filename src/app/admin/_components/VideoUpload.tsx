'use client';

import React, { useRef, useState } from 'react';
import { Box, Button, VStack, Text, IconButton } from '@chakra-ui/react';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

interface VideoUploadProps {
    value?: string;
    onChange: (value: string) => void;
    onThumbnailGenerated?: (thumbnailBase64: string) => void;
    onDurationExtracted?: (duration: number) => void;
    folder?: string;
    placeholder?: string;
    disabled?: boolean;
}

export default function VideoUpload({
    value,
    onChange,
    onThumbnailGenerated,
    onDurationExtracted,
    folder = 'courses',
    placeholder = '点击上传视频',
    disabled = false,
}: VideoUploadProps) {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // 从视频文件提取第一帧缩略图和时长
    const extractVideoInfo = (
        file: File
    ): Promise<{ thumbnail: string; duration: number }> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('无法创建 Canvas 上下文'));
                return;
            }

            let videoDuration = 0;

            video.addEventListener('loadedmetadata', () => {
                // 获取视频时长（秒）
                videoDuration = Math.round(video.duration || 0);

                // 设置 canvas 尺寸
                canvas.width = 640;
                canvas.height = 360;

                // 跳转到第1秒
                video.currentTime = 1;
            });

            video.addEventListener('seeked', () => {
                try {
                    // 绘制视频帧到 canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // 转换为 base64
                    const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.8);

                    resolve({
                        thumbnail: thumbnailBase64,
                        duration: videoDuration,
                    });
                } catch (error) {
                    reject(error);
                } finally {
                    // 清理资源
                    video.src = '';
                    URL.revokeObjectURL(video.src);
                }
            });

            video.addEventListener('error', () => {
                reject(new Error('视频加载失败'));
            });

            // 设置视频源
            video.src = URL.createObjectURL(file);
            video.load();
        });
    };

    // 处理视频上传
    const uploadVideo = api.util.uploadVideo.useMutation({
        onSuccess: (data) => {
            showSuccessToast('视频上传成功');
            onChange(data.url);
            setUploading(false);
        },
        onError: (error) => {
            showErrorToast(error.message || '上传失败');
            setUploading(false);
        },
    });

    // 处理文件选择
    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // 验证文件类型
        if (!file.type.startsWith('video/')) {
            showErrorToast('请选择视频文件');
            return;
        }

        // 验证文件大小 (限制为 100MB)
        if (file.size > 100 * 1024 * 1024) {
            showErrorToast('视频大小不能超过100MB');
            return;
        }

        setUploading(true);

        try {
            // 提取视频信息（缩略图和时长）
            if (onThumbnailGenerated || onDurationExtracted) {
                try {
                    const videoInfo = await extractVideoInfo(file);

                    // 回调缩略图
                    if (onThumbnailGenerated) {
                        onThumbnailGenerated(videoInfo.thumbnail);
                    }

                    // 回调时长
                    if (onDurationExtracted) {
                        onDurationExtracted(videoInfo.duration);
                    }
                } catch (error) {
                    console.warn('视频信息提取失败:', error);
                    // 继续上传，即使提取失败
                }
            }

            // 上传视频文件
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                uploadVideo.mutate({
                    video: base64,
                    filename: file.name,
                    folder,
                });
            };
            reader.readAsDataURL(file);
        } catch (error) {
            showErrorToast('处理视频文件失败');
            setUploading(false);
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

    // 删除视频
    const removeVideo = () => {
        onChange('');
    };

    return (
        <VStack align="stretch" gap={3}>
            {/* 视频预览区域 */}
            {value && (
                <Box position="relative">
                    <video
                        src={value}
                        controls
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                        }}
                    />
                    {!disabled && (
                        <IconButton
                            aria-label="删除视频"
                            size="xs"
                            position="absolute"
                            top="-15px"
                            right="-16px"
                            borderRadius="full"
                            onClick={removeVideo}
                        >
                            <FiTrash2 />
                        </IconButton>
                    )}
                </Box>
            )}

            {/* 上传按钮 */}
            {!value && !disabled && (
                <Box>
                    <Button
                        onClick={triggerFileSelect}
                        loading={uploading}
                        variant="outline"
                        w="fit-content"
                    >
                        <FiUpload style={{ marginRight: '8px' }} />
                        {placeholder}
                    </Button>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                        支持 MP4、AVI、MOV、WebM 等格式，单个文件不超过 100MB
                    </Text>
                </Box>
            )}

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
        </VStack>
    );
}
