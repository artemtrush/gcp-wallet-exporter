import config from './config';
import logger from './infrastructure/logger';
import StatementExporter from './exporter/StatementExporter';

export async function exportStatement() {
    try {
        const { bankName, maxMonthsToExport, timeZone } = config;

        logger.info('Started statement export process', { bankName, maxMonthsToExport, timeZone });

        const statementExporter = new StatementExporter(config);

        await statementExporter.init();
        await statementExporter.run();

        logger.info('Completed statement export successfully');
    } catch (error) {
        logger.error('Failed statement export process', { reason: error.message });
    }
}
