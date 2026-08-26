import nodemailer from "nodemailer";

type MailEnvironment = {
  APP_URL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;
};

export function getSmtpConfig(env?: MailEnvironment) {
  const source = env ?? process.env;
  const host = source.SMTP_HOST?.trim();
  const user = source.SMTP_USER?.trim();
  const password = source.SMTP_PASSWORD;
  const from = source.SMTP_FROM?.trim();
  const port = Number(source.SMTP_PORT ?? 587);

  if (!host || !user || !password || !from || !Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP não configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD e SMTP_FROM.");
  }

  return { host, port, user, password, from, secure: port === 465 };
}

export function buildPasswordResetUrl(token: string, appUrl = process.env.APP_URL) {
  if (!appUrl) throw new Error("APP_URL é obrigatório para enviar links de recuperação de senha.");
  const url = new URL("/login", appUrl);
  url.searchParams.set("reset", token);
  return url.toString();
}

export async function sendPasswordResetEmail(input: { email: string; token: string }) {
  const config = getSmtpConfig();
  const resetUrl = buildPasswordResetUrl(input.token);
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });

  await transport.sendMail({
    from: config.from,
    to: input.email,
    subject: "Recupere sua senha — Homebrew Forge",
    text: `Use este link para definir uma nova senha: ${resetUrl}`,
    html: `<p>Use o link abaixo para definir uma nova senha no Homebrew Forge.</p><p><a href="${resetUrl}">Redefinir minha senha</a></p><p>Este link expira em uma hora.</p>`,
  });
}
