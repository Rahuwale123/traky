import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

declare module "fastify" {
  interface FastifyInstance {
    mailer: { sendMail: (input: SendMailInput) => Promise<void> };
  }
}

export default fp(async function mailerPlugin(app: FastifyInstance) {
  const transporter: Transporter | null = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : null;

  if (!transporter) {
    app.log.warn("SMTP_HOST not set — outgoing emails will be logged instead of sent. Set SMTP_* env vars in production.");
  }

  app.decorate("mailer", {
    async sendMail(input: SendMailInput) {
      if (!transporter) {
        app.log.info(`Email (dev fallback, not actually sent) → to=${input.to} subject="${input.subject}"\n${input.text}`);
        return;
      }
      await transporter.sendMail({ from: env.SMTP_FROM, to: input.to, subject: input.subject, html: input.html, text: input.text });
    },
  });
});
