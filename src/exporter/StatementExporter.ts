import dateFormat from 'dateformat';
import logger from '../infrastructure/logger';
import CloudStorage, { CloudStorageOptions } from '../infrastructure/CloudStorage';
import MailSender, { MailSenderOptions } from '../infrastructure/MailSender';
import TimeManager from './TimeManager';
import CsvGenerator from './CsvGenerator';
import { buildBankClient } from './banks'

export interface StatementExporterOptions {
    bankName: string,
    maxMonthsToExport: number,
    timeZone: string
    cloudStorage: CloudStorageOptions,
    mail: MailSenderOptions,
}

export default class StatementExporter {
    private readonly bankClient;
    private readonly cloudStorage;
    private readonly timeManager;
    private readonly csvGenerator;
    private readonly mailSender;

    constructor(options: StatementExporterOptions) {
        this.bankClient = buildBankClient(options.bankName);
        this.cloudStorage = new CloudStorage(options.cloudStorage);
        this.timeManager = new TimeManager(options);
        this.csvGenerator = new CsvGenerator();
        this.mailSender = new MailSender(options.mail);
    }

    async init() {
        this.timeManager.initGlobalTimeZone();
        await this.mailSender.verifyConnection();
    }

    async run() {
        const lastExportTime = await this.getLastExportTime();
        const { startDate, endDate } = this.timeManager.buildExportPeriod(lastExportTime);

        logger.info('Get transactions for export period', { startDate, endDate });
        const transactions = await this.bankClient.getTransactions(startDate, endDate);

        if (transactions.length) {
            const statementFileName = this.buildStatementFileName(startDate, endDate);

            logger.info('Generate statement csv', { statementFileName });
            const statementCsv = this.csvGenerator.generateStatementCsv(transactions);

            logger.info('Save statement csv to cloud storage');
            await this.saveStatementCsvToCloud(statementCsv, statementFileName);

            logger.info('Send statement csv by mail');
            await this.sendStatementCsvByMail(statementCsv, statementFileName);
        } else {
            logger.info('No transactions found for specified period');
        }

        await this.setLastExportTime(endDate.getTime());
    }

    private async getLastExportTime() {
        const folderName = this.buildBankCaption();
        const settingsJson = await this.cloudStorage.getFile(`${folderName}/settings.json`);

        if (!settingsJson) {
            return 0;
        }

        const settings = JSON.parse(settingsJson);

        return settings.lastExportTime;
    }

    private async setLastExportTime(lastExportTime: number) {
        const folderName = this.buildBankCaption();
        const settingsJson = JSON.stringify({ lastExportTime });

        await this.cloudStorage.saveFile(`${folderName}/settings.json`, settingsJson);
    }

    private async saveStatementCsvToCloud(statementCsv: string, statementFileName: string) {
        const folderName = this.buildBankCaption();

        await this.cloudStorage.saveFile(`${folderName}/${statementFileName}`, statementCsv);
    }

    private async sendStatementCsvByMail(statementCsv: string, statementFileName: string) {
        const subject = `Statement export [${this.buildBankCaption()}]`;

        await this.mailSender.send({
            subject     : subject,
            text        : '',
            attachments : [
                {
                    fileName    : statementFileName,
                    fileContent : statementCsv
                }
            ]
        });
    }

    private buildBankCaption() {
        const bankName = this.bankClient.getBankName();
        const cardNumber = this.bankClient.getCardNumber();
        const cardLastDigits = cardNumber.substring(cardNumber.length - 4);

        return `${bankName}-${cardLastDigits}`;
    }

    private buildStatementFileName(startDate: Date, endDate: Date) {
        const datePattern = 'yyyy-mm-dd';
        const startString = dateFormat(startDate, datePattern);
        const endString = dateFormat(endDate, datePattern);

        if (startString === endString) {
            return `${startString}.csv`;
        }

        return `${startString}_${endString}.csv`;
    }
}

