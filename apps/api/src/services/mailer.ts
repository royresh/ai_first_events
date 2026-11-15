import nodemailer from 'nodemailer';

interface MailEvent {
  id: number;
  title: string;
  startsAt: Date;
  location: string;
}

export interface RsvpConfirmation {
  to: { name: string; email: string };
  event: MailEvent;
  /** Secret token for the "cancel my RSVP" link. */
  cancelToken: string;
}

export interface RsvpCancellation {
  to: { name: string; email: string };
  event: MailEvent;
}

export interface Mailer {
  sendRsvpConfirmation(msg: RsvpConfirmation): Promise<void>;
  sendRsvpCancellation(msg: RsvpCancellation): Promise<void>;
  close(): void;
}

export interface MailerOptions {
  host: string;
  port: number;
  from: string;
  /** Public URL of the web app, used for links in emails. */
  webUrl: string;
}

/** SMTP mailer. Locally this talks to Mailpit (http://localhost:8025 to read the mail). */
export function createMailer({ host, port, from, webUrl }: MailerOptions): Mailer {
  const transport = nodemailer.createTransport({ host, port, secure: false });
  const base = webUrl.replace(/\/$/, '');

  return {
    async sendRsvpConfirmation({ to, event, cancelToken }) {
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
          '',
          `Can't make it? Cancel your RSVP: ${base}/rsvps/${cancelToken}/cancel`,
        ].join('\n'),
      });
    },
    async sendRsvpCancellation({ to, event }) {
      await transport.sendMail({
        from,
        to: { name: to.name, address: to.email },
        subject: `Your RSVP to ${event.title} is cancelled`,
        text: [
          `Hi ${to.name},`,
          '',
          `Your RSVP to ${event.title} is cancelled and your seat has been released.`,
          '',
          `Changed your mind? RSVP again: ${base}/events/${event.id}`,
        ].join('\n'),
      });
    },
    close: () => transport.close(),
  };
}
