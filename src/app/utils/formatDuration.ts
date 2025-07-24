/**
 * 将秒数格式化为 HH:MM:SS 格式
 * @param seconds 总秒数
 * @returns 格式化后的时间字符串，如 "01:23:45"
 */
export function formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) {
        return '00:00:00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // 格式化为两位数
    const formatNumber = (num: number): string => {
        return num.toString().padStart(2, '0');
    };

    const res = hours ? formatNumber(hours) + ':' : '';
    return `${res}${formatNumber(minutes)}:${formatNumber(remainingSeconds)}`;
}

/**
 * 将 HH:MM:SS 格式转换为秒数
 * @param timeString 时间字符串，如 "01:23:45"
 * @returns 总秒数
 */
export function parseDuration(timeString: string): number {
    if (!timeString) return 0;

    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    const seconds = parseInt(parts[2] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
}
