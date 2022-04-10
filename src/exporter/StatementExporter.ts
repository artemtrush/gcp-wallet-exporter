import logger from '../infrastructure/logger';
import EmailSender, { EmailSenderOptions } from '../infrastructure/EmailSender';
import TimeManager, { TimeManagerOptions } from './TimeManager';
import CsvGenerator from './CsvGenerator';
import { buildBankClient } from './banks'

export interface StatementExporterOptions extends TimeManagerOptions, EmailSenderOptions  {
    bankName: string,
    mailTo: string,
    mailFrom: string,
    mailSubject: string,
}

export default class StatementExporter {
    private readonly bankClient;
    private readonly timeManager;
    private readonly csvGenerator;
    private readonly emailSender;

    private readonly mailTo;
    private readonly mailFrom;
    private readonly mailSubject;

    constructor(options: StatementExporterOptions) {
        this.mailTo = options.mailTo;
        this.mailFrom = options.mailFrom;
        this.mailSubject = options.mailSubject;

        this.bankClient = buildBankClient(options.bankName);
        this.timeManager = new TimeManager(options);
        this.csvGenerator = new CsvGenerator();
        this.emailSender = new EmailSender(options);
    }

    async run() {
        this.timeManager.initGlobalTimeZone();
        await this.emailSender.verify();

        const lastExportTime = 0;
        const { startDate, endDate } = this.timeManager.buildExportPeriod(lastExportTime);

        logger.info('Get statements for export period', { startDate, endDate });
        const statements = await this.bankClient.getStatements(startDate, endDate);

        if (statements.length) {
            logger.info('Generate csv', { count: statements.length });
            const statementsCsv = this.csvGenerator.generateStatementsCsv(statements);

            logger.info('Send mail', { to: this.mailTo });
            await this.emailSender.send({
                from        : this.mailFrom,
                to          : this.mailTo,
                subject     : this.mailSubject,
                text        : '',
                attachments : [
                    {
                        filename : 'test.csv',
                        content  : statementsCsv
                    }
                ]
            });
        } else {
            logger.info('@REMOVE');
        }

        // SET LAST EXPORT TIME
    }
}
