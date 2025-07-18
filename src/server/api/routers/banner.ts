import { z } from "zod";
import { createTRPCRouter, publicProcedure, superAdminProcedure } from "@/server/api/trpc";

export const bannerRouter = createTRPCRouter({
    // 获取所有banner，支持排序
    list: superAdminProcedure
        .input(
            z.object({
                orderBy: z.string().optional(),
                order: z.enum(["asc", "desc"]).optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            return ctx.db.banner.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? "asc" }
                    : { sort: "asc" },
            });
        }),

    create: superAdminProcedure
        .input(
            z.object({
                title: z.string(),
                description: z.string().optional(),
                image: z.string(),
                isActive: z.boolean(),
                sort: z.number().optional(),
                link: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.banner.create({ data: input });
            return {
                message: '创建成功'
            };
        }),

    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().optional(),
                image: z.string(),
                isActive: z.boolean(),
                sort: z.number().optional(),
                link: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.banner.update({ where: { id }, data });
        }),

    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.banner.delete({ where: { id: input.id } });
        }),

    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.banner.deleteMany({ where: { id: { in: input.ids } } });
        }),
}); 