import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashPassword, verifyPassword } from "./_core/password";
import { sdk, readSessionToken } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { homebrewRouter } from "./routers/homebrews";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

function setSessionCookie(ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: { cookie: Function } }, token: string) {
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure
      .input(credentialsSchema.extend({ name: z.string().trim().min(1).max(120).optional() }))
      .mutation(async ({ input, ctx }) => {
        if (await db.getUserByEmail(input.email)) throw new Error("Este e-mail já está cadastrado.");
        const user = await db.createLocalUser({
          email: input.email,
          name: input.name ?? null,
          passwordHash: await hashPassword(input.password),
        });
        if (!user) throw new Error("Não foi possível criar o usuário.");
        setSessionCookie(ctx, await sdk.createSession(user.id));
        return user;
      }),
    login: publicProcedure.input(credentialsSchema).mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new Error("E-mail ou senha inválidos.");
      }
      setSessionCookie(ctx, await sdk.createSession(user.id));
      return user;
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await sdk.destroySession(readSessionToken(ctx.req));
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  homebrew: homebrewRouter,
});

export type AppRouter = typeof appRouter;
