import { z } from "zod";
import { createTRPCRouter, publicProcedure, superAdminProcedure } from "@/server/api/trpc";

export const categoryRouter = createTRPCRouter({
    // 获取所有分类，支持排序
    list: publicProcedure
        .input(
            z.object({
                orderBy: z.string().optional(),
                order: z.enum(["asc", "desc"]).optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.category.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? "asc" }
                    : { createdAt: "desc" },
            });
        }),

    create: superAdminProcedure
        .input(
            z.object({
                name: z.string(),
                description: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.category.create({ data: input });
            return {
                message: '创建成功'
            };
        }),

    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string(),
                description: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.category.update({ where: { id }, data });
        }),

    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.category.delete({ where: { id: input.id } });
        }),

    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.category.deleteMany({ where: { id: { in: input.ids } } });
        }),
}); 