import StatementExporter from './StatementExporter';

const EXIT_STATUS_SUCCESS = 0;
const EXIT_STATUS_ERROR = 1;

async function main() {
    try {
        const statementExporter = new StatementExporter();

        await statementExporter.run();

        process.exit(EXIT_STATUS_SUCCESS);
    } catch (error) {
        console.log(error);

        process.exit(EXIT_STATUS_ERROR);
    }
}

main();
