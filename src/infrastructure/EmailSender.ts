import nodemailer from 'nodemailer';
import logger from './logger';

export interface MailAttachment {
    filename: string,
    content: string
}

export interface Mail {
    from: string,
    to: string,
    subject: string,
    text: string,
    attachments?: MailAttachment[]
}

export interface EmailSenderOptions {
    smtpHost: string,
    smtpPort: number,
    smtpUsername: string,
    smtpPassword: string
}

export default class EmailSender {
    private readonly smtpClient;

    constructor(options: EmailSenderOptions) {
        this.smtpClient = nodemailer.createTransport({
            host : options.smtpHost,
            port : options.smtpPort,
            auth : {
                user : options.smtpUsername,
                pass : options.smtpPassword
            }
        });
    }

    async verify() {
        try {
            await this.smtpClient.verify();
        } catch (error) {
            if (error instanceof Error) {
                logger.error('Failed to establish connection with SMTP server', { reason: error.message });
            }

            throw new Error('EmailSender Error');
        }
    }

    async send(mail: Mail) {
        await this.smtpClient.sendMail({
            from        : mail.from,
            to          : mail.to,
            subject     : mail.subject,
            text        : mail.text,
            attachments : mail.attachments
        });
    }
}
