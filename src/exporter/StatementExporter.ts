import dateFormat from 'dateformat';
import logger from '../infrastructure/logger';
import EmailSender, { EmailSenderOptions } from '../infrastructure/EmailSender';
import TimeManager, { TimeManagerOptions } from './TimeManager';
import CsvGenerator from './CsvGenerator';
import { buildBankClient } from './banks'

export interface StatementExporterOptions extends TimeManagerOptions, EmailSenderOptions  {
    bankName: string,
    mailTo: string,
    mailFrom: string
}

export default class StatementExporter {
    private readonly bankClient;
    private readonly timeManager;
    private readonly csvGenerator;
    private readonly emailSender;

    private readonly bankName;
    private readonly mailTo;
    private readonly mailFrom;

    constructor(options: StatementExporterOptions) {
        this.bankName = options.bankName;
        this.mailTo = options.mailTo;
        this.mailFrom = options.mailFrom;

        this.bankClient = buildBankClient(options.bankName);
        this.timeManager = new TimeManager(options);
        this.csvGenerator = new CsvGenerator();
        this.emailSender = new EmailSender(options);
    }

    async run() {
        this.timeManager.initGlobalTimeZone();
        await this.emailSender.verify();

        const lastExportTime = await this.getLastExportTime();
        const { startDate, endDate } = this.timeManager.buildExportPeriod(lastExportTime);

        logger.info('Get statements for export period', { startDate, endDate });

        const statements = await this.bankClient.getStatements(startDate, endDate);

        if (statements.length) {
            logger.info('Generate statements csv', { statementsCount: statements.length });

            const statementsCsv = this.csvGenerator.generateStatementsCsv(statements);
            const statementsCsvFilename = this.buildStatementsCsvFilename(startDate, endDate);

            await this.sendStatementsCsvByMail(statementsCsv, statementsCsvFilename);
        } else {
            logger.info('No statements found for specified period');
        }

        await this.setLastExportTime(endDate.getTime());
    }

    private async getLastExportTime() {
        return 0;
    }

    private async setLastExportTime(value: number) {
        console.log('SET', value);
    }

    private async sendStatementsCsvByMail(statementsCsv: string, statementsCsvFilename: string) {
        logger.info('Send statements csv by mail', {
            target   : this.mailTo,
            filename : statementsCsvFilename
        });

        const subject = `Statement export [${this.bankName}][${statementsCsvFilename}]`;

        await this.emailSender.send({
            from        : this.mailFrom,
            to          : this.mailTo,
            subject     : subject,
            text        : '',
            attachments : [
                {
                    filename : statementsCsvFilename,
                    content  : statementsCsv
                }
            ]
        });
    }

    private buildStatementsCsvFilename(startDate: Date, endDate: Date) {
        const datePattern = 'yyyy-mm-dd';
        const startString = dateFormat(startDate, datePattern);
        const endString = dateFormat(endDate, datePattern);

        if (startString === endString) {
            return `${startString}.csv`;
        }

        return `${startString}_${endString}.csv`;
    }
}
