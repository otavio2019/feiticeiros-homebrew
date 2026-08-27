import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashPassword, verifyPassword } from "./_core/password";
import { hashToken, sdk, readSessionToken } from "./_core/sdk";
import { sendPasswordResetEmail } from "./mail";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { homebrewRouter } from "./routers/homebrews";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

const passwordResetTtlMs = 60 * 60 * 1000;

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
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });

      if (!user.passwordHash) {
        if (user.loginMethod === "google") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Esta conta foi criada via Google. Use 'Esqueci minha senha' para definir uma senha local." });
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
      }

      if (!(await verifyPassword(input.password, user.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
      }

      setSessionCookie(ctx, await sdk.createSession(user.id));
      return user;
    }),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        // Resposta neutra impede a enumeração de e-mails cadastrados.
        if (!user) return { success: true } as const;
        const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
        await db.createPasswordResetToken(user.id, hashToken(token), new Date(Date.now() + passwordResetTtlMs));
        await sendPasswordResetEmail({ email: input.email, token });
        return { success: true } as const;
      }),
    resetPassword: publicProcedure
      .input(z.object({ token: z.string().min(32).max(256), password: z.string().min(8).max(128) }))
      .mutation(async ({ input }) => {
        const user = await db.consumePasswordResetToken(hashToken(input.token));
        if (!user) throw new Error("O link de recuperação é inválido ou expirou.");
        await db.updateUserPasswordAndInvalidateSessions(user.id, await hashPassword(input.password));
        return { success: true } as const;
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
