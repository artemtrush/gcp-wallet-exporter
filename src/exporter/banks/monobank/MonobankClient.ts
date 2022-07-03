import mcc from 'merchant-category-code';
import logger from '../../../infrastructure/logger';
import HttpClient, { HttpProxyOptions } from '../../../infrastructure/HttpClient';

export interface MonobankTransaction {
    id: string,
    time: number,
    description: string,
    mcc: number,
    amount: number,
    balance: number,
    comment?: string
}

export interface MonobankOptions extends BankOptions {
    apiUrl: string,
    accessToken: string
}

export default class MonobankClient implements BankClient {
    private httpClient;
    private readonly bankName;
    private readonly cardNumber;
    private accountId?: string;

    constructor(options: MonobankOptions, proxy?: HttpProxyOptions) {
        this.bankName = options.bankName;
        this.cardNumber = options.cardNumber;

        this.httpClient = new HttpClient({
            baseUrl : options.apiUrl,
            headers : {
                'X-Token' : options.accessToken
            },
            proxy
        });
    }

    getBankName() {
        return this.bankName;
    }

    getCardNumber() {
        return this.cardNumber;
    }

    async getTransactions(startDate: Date, endDate: Date): Promise<Transaction[]> {
        const accountId = await this.getAccoundId();
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();

        const transactions = await this.httpClient.get(`/personal/statement/${accountId}/${startTime}/${endTime}`);

        const formattedTransactions = transactions.map((transaction: MonobankTransaction) => {
            return this.formatTransaction(transaction);
        });

        return formattedTransactions;
    }

    private formatTransaction(transaction: MonobankTransaction): Transaction {
        const description = this.formatTransactionDescription(transaction);

        return {
            id          : transaction.id,
            amount      : transaction.amount,
            balance     : transaction.balance,
            datetime    : transaction.time * 1000,
            description : description
        };
    }

    private formatTransactionDescription(transaction: MonobankTransaction) {
        const descriptionParts = [ transaction.description ];

        if (transaction.comment) {
            descriptionParts.push(transaction.comment);
        }

        if (transaction.mcc) {
            const merchantCategory = mcc(transaction.mcc);

            if (merchantCategory) {
                descriptionParts.push(merchantCategory.edited_description);
            }
        }

        return descriptionParts.join(' | ');
    }

    private async getAccoundId() {
        if (this.accountId !== undefined) {
            return this.accountId;
        }

        const clientInfo = await this.httpClient.get('/personal/client-info');

        let accountId;

        for (const account of clientInfo.accounts) {
            const cardMask = account.maskedPan[0];

            if (cardMask && this.isCardNumberMatchesWithMask(this.cardNumber, cardMask)) {
                accountId = account.id;
                break;
            }
        }

        if (accountId === undefined) {
            logger.error('Not found account for provided card number');

            throw new Error('MonobankClient Error');
        }

        this.accountId = accountId;

        return accountId;
    }

    private isCardNumberMatchesWithMask(cardNumber: string, cardMask: string) {
        if (cardNumber.length != cardMask.length) {
            return false;
        }

        for (let index = 0; index < cardMask.length; index++) {
            if (cardMask[index] === '*') {
                continue;
            }

            if (cardNumber[index] !== cardMask[index]) {
                return false;
            }
        }

        return true;
    }
}
