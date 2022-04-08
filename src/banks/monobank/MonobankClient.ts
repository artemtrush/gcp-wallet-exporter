import HttpClient from '../../infrastructure/HttpClient';

export interface MonobankStatement {
    id: string,
    time: number,
    description: string,
    comment?: string,
    amount: number,
    balance: number,
    mcc: number
}

export interface MonobankOptions {
    apiUrl: string,
    accessToken: string,
    cardNumber: string
}

export default class MonobankClient implements BankClient {
    private httpClient;
    private readonly cardNumber;

    constructor(options: MonobankOptions) {
        this.cardNumber = options.cardNumber

        this.httpClient = new HttpClient({
            baseUrl : options.apiUrl,
            headers : {
                'X-Token' : options.accessToken
            }
        });
    }

    // async getAccounts() {
    //     const response = await this.httpClient.get('/personal/client-info');

    //     return response;
    // }

    async getStatements(fromTime: number, toTime: number) {
        const response = await this.httpClient.get(`/personal/statement/0/${fromTime}/${toTime}`);

        return response;
    }
}
