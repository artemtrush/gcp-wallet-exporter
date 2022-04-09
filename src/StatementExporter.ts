import logger from './infrastructure/logger';
import TimeManager from './TimeManager';
import { buildBankClient } from './banks'

export interface StatementExporterOptions {
    bankName: string,
    timeZone: string,
    maxMonthsToExport: number
}

export default class StatementExporter {
    private readonly bankClient;
    private readonly timeManager;
    private readonly timeZone;
    private readonly maxMonthsToExport;

    constructor(options: StatementExporterOptions) {
        this.timeZone = options.timeZone;
        this.maxMonthsToExport = options.maxMonthsToExport;

        this.bankClient = buildBankClient(options.bankName);
        this.timeManager = new TimeManager();
    }

    async run() {
        this.timeManager.setGlobalTimeZone(this.timeZone);

        const lastExportTime = 0;

        const { startDate, endDate } = this.timeManager.buildExportPeriod(lastExportTime, this.maxMonthsToExport);

        logger.info('Get statements for export period', { startDate, endDate });

        const statements = await this.bankClient.getStatements(startDate, endDate);

        // generate CSV
        // send by email

        // SET LAST EXPORT TIME
        // SET IDS
    }
}
