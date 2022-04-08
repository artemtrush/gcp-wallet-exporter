import { buildBankClient } from './banks'

export interface StatementExporterOptions {
    bankName: string
}

export default class StatementExporter {
    private bankName;

    constructor(options: StatementExporterOptions) {
        this.bankName = options.bankName;
    }

    async run() {
        const bankClient = buildBankClient(this.bankName);

        const data = await bankClient.getStatements(0, 0);

        console.log(JSON.stringify(data, null, 4));
    }
}
