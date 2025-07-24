// 存储键前缀
const STORAGE_PREFIX = 'nextmall_';

// 动态生成带前缀的存储键
export const createStorageKey = (key: string) => `${STORAGE_PREFIX}${key}`;
