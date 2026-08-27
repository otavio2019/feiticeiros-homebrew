import nodemailer from "nodemailer";
import { describe, expect, it } from "vitest";

describe("SMTP credentials", () => {
  it("authenticates with the configured SMTP server", async () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    expect(host).toBeTruthy();
    expect(port).toBeGreaterThan(0);
    expect(user).toBeTruthy();
    expect(password).toBeTruthy();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });

    await expect(transporter.verify()).resolves.toBe(true);
    transporter.close();
  }, 15_000);
});
