import { createApp } from "./app";

/**
 * Fonte do bundle da Function Vercel. O build produz api/trpc/[...trpc].js,
 * mantendo a Function autocontida e sem iniciar um listener HTTP.
 */
const app = createApp();

export default app;
