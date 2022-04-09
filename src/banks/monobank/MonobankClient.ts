import dateFormat from 'dateformat';
import mcc from 'merchant-category-code';
import HttpClient from '../../infrastructure/HttpClient';
import logger from '../../infrastructure/logger';

export interface MonobankStatement {
    id: string,
    time: number,
    description: string,
    mcc: number,
    amount: number,
    balance: number,
    comment?: string
}

export interface MonobankOptions {
    apiUrl: string,
    accessToken: string,
    cardNumber: string
}

export default class MonobankClient implements BankClient {
    private httpClient;
    private readonly cardNumber;
    private accountId?: string;

    constructor(options: MonobankOptions) {
        this.cardNumber = options.cardNumber

        this.httpClient = new HttpClient({
            baseUrl : options.apiUrl,
            headers : {
                'X-Token' : options.accessToken
            }
        });
    }

    async getStatements(startDate: Date, endDate: Date): Promise<Statement[]> {
        const accountId = await this.getAccoundId();
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();

        const bankStatements = await this.httpClient.get(`/personal/statement/${accountId}/${startTime}/${endTime}`);

        const statements = bankStatements.map((bankStatement: MonobankStatement) => {
            return this.formatStatement(bankStatement);
        });

        return statements;
    }

    private formatStatement(bankStatement: MonobankStatement): Statement {
        const datetime = dateFormat(bankStatement.time * 1000, 'yyyy-mm-dd HH:MM:ss');
        const description = this.formatStatementDescription(bankStatement);

        return {
            id          : bankStatement.id,
            amount      : bankStatement.amount,
            balance     : bankStatement.balance,
            datetime    : datetime,
            description : description
        };
    }

    private formatStatementDescription(bankStatement: MonobankStatement) {
        const descriptionParts = [ bankStatement.description ];

        if (bankStatement.comment) {
            descriptionParts.push(bankStatement.comment);
        }

        if (bankStatement.mcc) {
            const merchantCategory = mcc(bankStatement.mcc);

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
