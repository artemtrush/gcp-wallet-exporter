import HttpClient from '../infrastructure/HttpClient';

export interface WalletOptions {
    importUrl: string,
    userId: string
}

export default class WalletClient {
    private importClient;
    private userId;

    constructor(options: WalletOptions) {
        this.importClient = new HttpClient({
            baseUrl : options.importUrl
        });
        this.userId = options.userId
    }

    async importStatementCsv(statementCsv: string, statementFileName: string): Promise<void> {
        await this.importClient.post('', statementCsv, {
            headers : {
                'x-userid'   : this.userId,
                'x-filename' : statementFileName
            }
        });
    }
}
