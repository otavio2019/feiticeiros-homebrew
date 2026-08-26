import { createApp } from "../../server/app";

// A Vercel invoca este app Express como uma Function Node. Não chame listen()
// neste módulo: a plataforma controla o ciclo de vida HTTP e o escalonamento.
const app = createApp();

export default app;
