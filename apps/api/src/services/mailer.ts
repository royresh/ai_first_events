import nodemailer from 'nodemailer';

export interface RsvpConfirmation {
  to: { name: string; email: string };
  event: { id: number; title: string; startsAt: Date; location: string };
}

export interface Mailer {
  sendRsvpConfirmation(msg: RsvpConfirmation): Promise<void>;
  close(): void;
}

export interface MailerOptions {
  host: string;
  port: number;
  from: string;
}

/** SMTP mailer. Locally this talks to Mailpit (http://localhost:8025 to read the mail). */
export function createMailer({ host, port, from }: MailerOptions): Mailer {
  const transport = nodemailer.createTransport({ host, port, secure: false });

  return {
    async sendRsvpConfirmation({ to, event }) {
      const when = event.startsAt.toUTCString();
      await transport.sendMail({
        from,
        to: { name: to.name, address: to.email },
        subject: `You're going to ${event.title}`,
        text: [
          `Hi ${to.name},`,
          '',
          `You're confirmed for ${event.title}.`,
          `When: ${when}`,
          `Where: ${event.location}`,
          '',
          'See you there!',
        ].join('\n'),
      });
    },
    close: () => transport.close(),
  };
}
