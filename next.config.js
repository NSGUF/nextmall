/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.js';

/** @type {import("next").NextConfig} */
const config = {
    experimental: {
        optimizePackageImports: ['@chakra-ui/react'],
    },
    eslint: {
        // 在构建时忽略 ESLint 错误
        ignoreDuringBuilds: true,
    },
    // Docker 部署配置
    output: 'standalone',
    // 静态文件配置
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: '/api/uploads/:path*',
            },
        ];
    },
};

export default config;
