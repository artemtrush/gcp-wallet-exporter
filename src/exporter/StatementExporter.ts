import dateFormat from 'dateformat';
import logger from '../infrastructure/logger';
import CloudStorage, { CloudStorageOptions } from '../infrastructure/CloudStorage';
import MailSender, { MailSenderOptions } from '../infrastructure/MailSender';
import WalletClient, { WalletOptions } from '../infrastructure/WalletClient';
import { HttpProxyOptions } from '../infrastructure/HttpClient';
import TimeManager from './TimeManager';
import StatementGenerator, { StatementFileContent, StatementFileFormat } from './StatementGenerator';
import { buildBankClient } from './banks'
import { IMPORT_WAY, IMPORT_FILE_FORMAT } from './constants';

export interface StatementExporterOptions {
    bankName: string,
    maxMonthsToExport: number,
    timeZone: string,
    importVia: IMPORT_WAY,
    importFileFormat: IMPORT_FILE_FORMAT,
    cloudStorage: CloudStorageOptions,
    proxy: HttpProxyOptions,
    wallet: WalletOptions,
    mail: MailSenderOptions
}

export default class StatementExporter {
    private readonly bankClient;
    private readonly cloudStorage;
    private readonly timeManager;
    private readonly statementGenerator;
    private readonly walletClient;
    private readonly mailSender;
    private readonly importVia;
    private readonly importFileFormat;

    constructor(options: StatementExporterOptions) {
        this.bankClient = buildBankClient(options.bankName, options.proxy);
        this.cloudStorage = new CloudStorage(options.cloudStorage);
        this.timeManager = new TimeManager(options);
        this.statementGenerator = new StatementGenerator();

        if (options.importVia === IMPORT_WAY.WALLET_API) {
            this.walletClient = new WalletClient(options.wallet);
        } else if (options.importVia === IMPORT_WAY.MAIL) {
            this.mailSender = new MailSender(options.mail);
        }

        this.importVia = options.importVia;
        this.importFileFormat = options.importFileFormat as IMPORT_FILE_FORMAT;
    }

    async init() {
        this.timeManager.initGlobalTimeZone();

        if (this.mailSender) {
            await this.mailSender.verifyConnection();
        }
    }

    async run() {
        const lastExportTime = await this.getLastExportTime();

        const { startDate, endDate } = this.timeManager.buildExportPeriod(lastExportTime);

        logger.info('Get transactions for export period', { startDate, endDate });
        const transactions = await this.bankClient.getTransactions(startDate, endDate);


        if (transactions.length) {
            const statementFileName = this.buildStatementFileName(startDate, endDate, this.importFileFormat);

            logger.info('Generate statement file', { statementFileName });
            const statementFile = this.statementGenerator.generateStatementFile(transactions, this.importFileFormat);

            logger.info('Save statement file to cloud storage');
            await this.saveStatementFileToCloud(statementFile, statementFileName);

            if (this.importVia === IMPORT_WAY.WALLET_API) {
                logger.info('Send statement file by wallet api');
                await this.sendStatementFileByWalletApi(statementFile, statementFileName);
            } else if (this.importVia === IMPORT_WAY.MAIL) {
                logger.info('Send statement file by mail');
                await this.sendStatementFileByMail(statementFile, statementFileName);
            }
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

    private async saveStatementFileToCloud(statementFileContent: StatementFileContent, statementFileName: string) {
        const folderName = this.buildBankCaption();

        await this.cloudStorage.saveFile(`${folderName}/${statementFileName}`, statementFileContent);
    }

    private async sendStatementFileByWalletApi(statementFileContent: StatementFileContent, statementFileName: string) {
        if (!this.walletClient) throw new Error('Wallet client is not defined');

        await this.walletClient.importStatementFile(statementFileContent, statementFileName);
    }

    private async sendStatementFileByMail(statementFileContent: StatementFileContent, statementFileName: string) {
        if (!this.mailSender) throw new Error('Mail sender is not defined');

        const subject = `Statement export [${this.buildBankCaption()}]`;

        await this.mailSender.send({
            subject     : subject,
            text        : '',
            attachments : [
                {
                    fileName    : statementFileName,
                    fileContent : statementFileContent
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

    private buildStatementFileName(startDate: Date, endDate: Date, fileFormat: StatementFileFormat) {
        const datePattern = 'yyyy-mm-dd';
        const startString = dateFormat(startDate, datePattern);
        const endString = dateFormat(endDate, datePattern);

        if (startString === endString) {
            return `${startString}.${fileFormat}`;
        }

        return `${startString}_${endString}.${fileFormat}`;
    }
}

