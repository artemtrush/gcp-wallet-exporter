import nodemailer from 'nodemailer';
import logger from './logger';

export interface MailAttachment {
    fileName: string,
    fileContent: string | Buffer
}

export interface Mail {
    from?: string,
    to?: string,
    subject: string,
    text: string,
    attachments?: MailAttachment[]
}

export interface MailSenderOptions {
    from?: string,
    to?: string,
    smtp: {
        host: string,
        port: number,
        username: string,
        password: string
    }
}

export default class MailSender {
    private readonly smtpClient;
    private readonly defaultFrom;
    private readonly defaultTo;

    constructor(options: MailSenderOptions) {
        this.defaultFrom = options.from;
        this.defaultTo = options.to;

        this.smtpClient = nodemailer.createTransport({
            host : options.smtp.host,
            port : options.smtp.port,
            auth : {
                user : options.smtp.username,
                pass : options.smtp.password
            }
        });
    }

    async verifyConnection() {
        try {
            await this.smtpClient.verify();
        } catch (error) {
            logger.error('Failed to establish connection with SMTP server', { reason: error.message });

            throw new Error('MailSender Error');
        }
    }

    async send(mail: Mail) {
        try {
            const attachments = [];

            for (const item of mail.attachments ?? []) {
                attachments.push({
                    filename : item.fileName,
                    content  : item.fileContent,
                });
            }

            await this.smtpClient.sendMail({
                from        : mail.from ?? this.defaultFrom,
                to          : mail.to ?? this.defaultTo,
                subject     : mail.subject,
                text        : mail.text,
                attachments : attachments
            });
        } catch (error) {
            logger.error('Failed to send email', { reason: error.message });

            throw new Error('MailSender Error');
        }
    }
}
