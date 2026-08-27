import { getSmtpConfig, sendPasswordResetEmail } from "../server/mail";

const config = getSmtpConfig();
await sendPasswordResetEmail({
  email: config.from,
  token: "a".repeat(64),
});

console.info("Entrega SMTP de recuperação de senha verificada com sucesso.");
