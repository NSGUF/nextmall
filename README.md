# 商城

轻量商城：一堆开源的商城东西太多，我就想真的做一个简单的商城，next+prisma+thilwind+tRPC
docker就能跑起来，谢谢！

# 截图

## 后台管理

## h5界面

# 技术栈

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Chakra](https://chakra-ui.com/)
- [tRPC](https://trpc.io)

# 快速体验

docker compose up -d

# 本地如何启动

将.env.example改名为.env，并修改对应配置信息，然后执行下

1. pnpm i
2. pnpm db:push
3. pnpm dev

# 环境变量

1. 修改secret: openssl rand -base64 44 命令行快速生成
2.

# 邮箱登录配置

EMAIL_SERVER=smtp://用户名:密码@smtp服务器:端口
EMAIL_FROM=发件人邮箱

# 例如：

# EMAIL_SERVER=smtp://user:pass@smtp.163.com:465

# EMAIL_FROM=your@email.com

## 更改数据库

1. 更改schema.prisma
2. npx prisma generate
3. 开发阶段 npx prisma db push
   生产阶段： npx prisma migrate dev --name add-super-admin-to-user 迁移新增到数据库
   npx prisma db seed 创建超级管理员
   npx prisma migrate deploy

dev环境

1. npx prisma db push

# 报错

1. EPERM: operation not permitted, rename 'D:\nextmall\node_modules\.pnpm\@prisma+client@6.12.0_prism_852c2f50
   8fa5d5c04099a9cee124d4df\node_modules\.prisma\client\query_engine-windows.dll.node.tmp9116' ->
   'D:\nextmall\node_modules\.pnpm\@prisma+client@6.12.0_prism_852c2f508fa5d5c04099a9cee124d4df\node_modules\.
   prisma\client\query_engine-windows.dll.node' 你的数据库 schema 已经同步成功，不影响开发。这个 EPERM 错误通常是 Windows 下文件被占用或权限问题，重启、关闭杀毒、用管理员权限、清理 node_modules 都能解决。不用处理
