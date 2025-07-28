#!/bin/sh

# 等待数据库启动
echo "等待数据库启动..."
sleep 3

# 检查数据库连接
echo "检查数据库连接..."
npx prisma db push --accept-data-loss || {
    echo "数据库连接失败，退出..."
    exit 1
}

# 运行数据库迁移
echo "运行数据库迁移..."
npx prisma migrate deploy || {
    echo "数据库迁移失败，但继续执行..."
}

# 创建超级管理员
echo "创建超级管理员..."
echo "FIRST_SUPERUSER: $FIRST_SUPERUSER"
echo "FIRST_SUPERUSER_PASSWORD: $FIRST_SUPERUSER_PASSWORD"
npx prisma db seed || {
    echo "种子数据创建失败，但继续执行..."
}

# 启动应用
echo "启动应用..."
exec node server.js
