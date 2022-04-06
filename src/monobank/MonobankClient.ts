import HttpClient from '../infrastructure/HttpClient';

export interface MonobankStatement {
    id : string,
    time : number,
    description : string,
    comment? : string,
    amount : number,
    balance : number,
    mcc : number
}

export interface MonobankOptions {
    apiUrl : string,
    accessToken : string
}

export default class MonobankClient {
    private httpClient;

    constructor(options: MonobankOptions) {
        this.httpClient = new HttpClient({
            baseUrl : options.apiUrl,
            headers : {
                'X-Token' : options.accessToken
            }
        })
    }

    // async getAccounts() {
    //     const response = await this.httpClient.get('/personal/client-info');

    //     return response;
    // }

    async getStatement(cardNumber: string, fromTime: number, toTime: number) {
        const response = await this.httpClient.get(`/personal/statement/0/${fromTime}/${toTime}`);

        return response;
    }
}
