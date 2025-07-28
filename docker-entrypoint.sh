#!/bin/sh

# 等待数据库启动
echo "等待数据库启动..."
sleep 10

# 运行数据库迁移
echo "运行数据库迁移..."
npx prisma migrate deploy

# 创建超级管理员
echo "创建超级管理员..."
npx prisma db seed

# 启动应用
echo "启动应用..."
exec node server.js