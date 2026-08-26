import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { HOME_BREW_MODULES } from "../../shared/homebrewRules";
import * as db from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const createInput = z.object({
  title: z.string().trim().min(3, "Informe um título com ao menos 3 caracteres.").max(160),
  summary: z.string().trim().max(800).default(""),
  visibility: z.enum(["private", "unlisted", "public"]).default("private"),
  manualMode: z.boolean().default(false),
  modules: z.array(z.enum(HOME_BREW_MODULES)).min(1, "Selecione pelo menos um módulo."),
});

const updateInput = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(3).max(160).optional(),
  summary: z.string().trim().max(800).optional(),
  visibility: z.enum(["private", "unlisted", "public"]).optional(),
  manualMode: z.boolean().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  characterLevel: z.number().int().min(0).max(20).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

async function assertOwner(homebrewId: number, userId: number) {
  const homebrew = await db.getHomebrewById(homebrewId);
  if (!homebrew) throw new TRPCError({ code: "NOT_FOUND", message: "Homebrew não encontrada." });
  if (homebrew.ownerId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode editar esta Homebrew." });
  return homebrew;
}

export const homebrewRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().trim().max(120).optional() }).optional())
    .query(({ ctx, input }) => db.listHomebrewsForUser(ctx.user.id, input?.search)),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertOwner(input.id, ctx.user.id);
    return db.getHomebrewDetail(input.id);
  }),

  create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const shareId = nanoid(11);
    return db.createHomebrew({ ownerId: ctx.user.id, shareId, ...input });
  }),

  update: protectedProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
    await assertOwner(input.id, ctx.user.id);
    const { id, ...changes } = input;
    return db.updateHomebrew(id, changes);
  }),

  remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.id, ctx.user.id);
    await db.deleteHomebrew(input.id);
    return { success: true } as const;
  }),

  duplicate: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const source = await assertOwner(input.id, ctx.user.id);
    return db.duplicateHomebrew(source, ctx.user.id, nanoid(11));
  }),

  addModule: protectedProcedure
    .input(z.object({ homebrewId: z.number().int().positive(), type: z.enum(HOME_BREW_MODULES) }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(input.homebrewId, ctx.user.id);
      return db.addModule(input.homebrewId, input.type);
    }),

  addImageUrl: protectedProcedure
    .input(z.object({
      homebrewId: z.number().int().positive(),
      url: z.string().url("Informe uma URL de imagem válida."),
      moduleId: z.number().int().positive().optional(),
      elementId: z.number().int().positive().optional(),
      altText: z.string().trim().max(240).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(input.homebrewId, ctx.user.id);
      return db.addHomebrewImage({ ...input, source: "url" });
    }),

  uploadImage: protectedProcedure
    .input(z.object({
      homebrewId: z.number().int().positive(),
      fileName: z.string().trim().min(1).max(120),
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      base64: z.string().min(1).max(1_500_000),
      moduleId: z.number().int().positive().optional(),
      elementId: z.number().int().positive().optional(),
      altText: z.string().trim().max(240).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(input.homebrewId, ctx.user.id);
      const bytes = Buffer.from(input.base64, "base64");
      if (bytes.length > 1_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Use imagens de até 1 MB." });
      const extension = input.contentType.split("/")[1] ?? "png";
      const stored = await storagePut(`homebrews/${ctx.user.id}/${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}.${extension}`, bytes, input.contentType);
      return db.addHomebrewImage({ ...input, source: "upload", url: stored.url, storageKey: stored.key });
    }),

  removeImage: protectedProcedure
    .input(z.object({ homebrewId: z.number().int().positive(), imageId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(input.homebrewId, ctx.user.id);
      return db.removeHomebrewImage(input.homebrewId, input.imageId);
    }),

  shared: publicProcedure.input(z.object({ shareId: z.string().min(6).max(32) })).query(async ({ input }) => {
    const homebrew = await db.getShareableHomebrew(input.shareId);
    if (!homebrew) throw new TRPCError({ code: "NOT_FOUND", message: "Esta Homebrew não está disponível para leitura." });
    return db.getHomebrewDetail(homebrew.id);
  }),
});
