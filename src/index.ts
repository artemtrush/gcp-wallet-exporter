import config from './config';
import StatementExporter from './StatementExporter';
import logger from './infrastructure/logger';

const EXIT_STATUS_SUCCESS = 0;
const EXIT_STATUS_ERROR = 1;

async function main() {
    try {
        logger.info('Started statement export process', config);

        const statementExporter = new StatementExporter(config);

        await statementExporter.run();

        logger.info('Completed statement export successfully');

        process.exit(EXIT_STATUS_SUCCESS);
    } catch (error) {
        if (error instanceof Error) {
            logger.error('Failed statement export process', { reason: error.message });
        }

        process.exit(EXIT_STATUS_ERROR);
    }
}

main();
