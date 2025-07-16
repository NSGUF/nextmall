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

# 邮箱登录配置
EMAIL_SERVER=smtp://用户名:密码@smtp服务器:端口
EMAIL_FROM=发件人邮箱

# 例如：
# EMAIL_SERVER=smtp://user:pass@smtp.163.com:465
# EMAIL_FROM=your@email.com

## 更改数据库
1. 更改schema.prisma
2. npx prisma generate
2. npx prisma db push