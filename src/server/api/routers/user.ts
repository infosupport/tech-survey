import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CommunicationMethod } from "~/prisma";
import { checkUserAuthorization } from "~/server/api/routers/shared";

export const usersRouter = createTRPCRouter({
    getUsers: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.prismaClient.users.getUsers();
    }),
    getUserInfo: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prismaClient.users.getUserInfo(input.userId);
        }),
    setDefaultRoleForUser: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            checkUserAuthorization(ctx.session, input.userId);
            await ctx.prismaClient.users.setDefaultRoleForUser(input.userId);
        }),
    setCommunicationMethodsForUser: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                methods: z.array(z.nativeEnum(CommunicationMethod)),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            checkUserAuthorization(ctx.session, input.userId);
            await ctx.prismaClient.users.setCommunicationMethodsForUser(
                input.userId,
                input.methods,
            );
        }),
    setBusinessUnitForUser: protectedProcedure
        .input(z.object({ userId: z.string(), businessUnitId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            checkUserAuthorization(ctx.session, input.userId);
            await ctx.prismaClient.users.setBusinessUnitForUser(
                input.userId,
                input.businessUnitId,
            );
        }),
    getRolesForUser: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prismaClient.users.getRolesForUser(input.userId);
        }),
    setRolesForUser: protectedProcedure
        .input(z.object({ userId: z.string(), roleIds: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const { userId, roleIds } = input;
            checkUserAuthorization(ctx.session, userId);
            await ctx.prismaClient.users.setRolesForUser(userId, roleIds);
        }),
});
