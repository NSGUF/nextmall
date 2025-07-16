import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const userRouter = createTRPCRouter({
    register: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
                password: z.string().min(6, "密码至少6位"),
                name: z.string().min(3, "用户名至少3位"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
            if (existing) {
                throw new Error("邮箱已被注册");
            }
            const hashed = await hash(input.password, 10);
            const user = await ctx.db.user.create({
                data: {
                    email: input.email,
                    password: hashed,
                    name: input.name,
                },
            });
            return { id: user.id, email: user.email, name: user.name };
        }),
    registerFormConfig: publicProcedure.query(() => {
        return [
            {
                name: "name",
                label: "用户名",
                type: "text",
                required: true,
                minLength: 3,
            },
            {
                name: "email",
                label: "邮箱",
                type: "email",
                required: true,
                pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
            },
            {
                name: "password",
                label: "密码",
                type: "password",
                required: true,
                minLength: 6,
            },
        ];
    }),
    recoverPassword: publicProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({ where: { email: input.email } });
            if (!user) throw new Error("该邮箱未注册");

            // 生成 JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.AUTH_SECRET!,
                { expiresIn: "30m" }
            );

            // 发送邮件
            const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
            const options = {
                host: process.env.SMTP_HOST, // SMTP 服务器地址，如 smtp.qq.com
                port: Number(process.env.SMTP_PORT) || 465, // SMTP 端口，常用465(SSL)或587(TLS)
                secure: true, // true=SSL, false=STARTTLS
                auth: {
                    user: process.env.SMTP_USER, // 发件邮箱账号
                    pass: process.env.SMTP_PASS, // 发件邮箱授权码/密码
                },
            };
            console.log(options)
            const transporter = nodemailer.createTransport(options);
            await transporter.sendMail({
                from: `"NextMall" <${process.env.SMTP_USER}>`, // 必须和 SMTP_USER 一致
                to: user.email,
                subject: "密码重置",
                html: `<p>点击 <a href="${resetUrl}">这里</a> 重置你的密码。30分钟内有效。</p>`,
            });

            return { message: "已发送密码找回邮件" };
        }),
}); 