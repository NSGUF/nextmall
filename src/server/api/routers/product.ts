import { z } from "zod";
import { createTRPCRouter, publicProcedure, superAdminProcedure } from "@/server/api/trpc";

export const productRouter = createTRPCRouter({
    // 获取所有商品，支持排序
    list: publicProcedure
        .input(
            z.object({
                orderBy: z.string().optional(),
                order: z.enum(["asc", "desc"]).optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.product.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? "asc" }
                    : { createdAt: "desc" },
            });
        }),

    create: superAdminProcedure
        .input(
            z.object({
                title: z.string(),
                images: z.array(z.string()),
                price: z.number(),
                stock: z.number(),
                logistics: z.string(),
                description: z.string(),
                isActive: z.boolean(),
                categoryId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.product.create({
                data: {
                    ...input,
                    ownerId: ctx.session.user.id,
                }
            });
            return {
                message: '创建成功'
            };
        }),

    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string(),
                images: z.array(z.string()),
                price: z.number(),
                stock: z.number(),
                ownerId: z.string(),
                logistics: z.string(),
                description: z.string(),
                isActive: z.boolean(),
                categoryId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.product.update({ where: { id }, data });
        }),

    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.product.delete({ where: { id: input.id } });
        }),

    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.product.deleteMany({ where: { id: { in: input.ids } } });
        }),
}); 