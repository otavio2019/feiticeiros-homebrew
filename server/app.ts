import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

/**
 * Monta o backend HTTP sem iniciar uma porta. O mesmo app é usado pelo
 * servidor local e pela Function Node da Vercel.
 */
export function createApp() {
  const app = express();

  // Vercel termina TLS antes de encaminhar a requisição. Confiar no proxy
  // preserva req.protocol e, por consequência, o atributo Secure do cookie.
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
