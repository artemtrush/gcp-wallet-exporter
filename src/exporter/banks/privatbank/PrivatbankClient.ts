import crypto from 'crypto';
import dateFormat from 'dateformat';
import logger from '../../../infrastructure/logger';
import XmlHttpClient from '../../../infrastructure/XmlHttpClient';

export interface PrivatbankStatement {
    appcode: string,
    description: string,
    trandate: string,
    trantime: string,
    cardamount: string,
    rest: string
    terminal: string
}

export interface PrivatbankOptions extends BankOptions {
    apiUrl: string,
    merchantId: string,
    merchantPassword: string
}

export default class PrivatbankClient implements BankClient {
    private xmlHttpClient;
    private readonly bankName;
    private readonly cardNumber;
    private readonly merchantId;
    private readonly merchantPassword;

    constructor(options: PrivatbankOptions) {
        this.bankName = options.bankName;
        this.cardNumber = options.cardNumber;
        this.merchantId = options.merchantId;
        this.merchantPassword = options.merchantPassword;

        this.xmlHttpClient = new XmlHttpClient({
            baseUrl : options.apiUrl
        });
    }

    getBankName() {
        return this.bankName;
    }

    getCardNumber() {
        return this.cardNumber;
    }

    async getStatements(startDate: Date, endDate: Date): Promise<Statement[]> {
        const datePattern = 'dd.mm.yyyy';
        const formattedStartDate = dateFormat(startDate, datePattern);
        const formattedEndDate = dateFormat(endDate, datePattern);

        const data = {
            oper    : 'cmt',
            wait    : '0',
            test    : '0',
            payment : {
                prop : [
                    { attrs: { name: 'sd', value: formattedStartDate } },
                    { attrs: { name: 'ed', value: formattedEndDate } },
                    { attrs: { name: 'card', value: this.cardNumber } }
                ]
            }
        };

        const request = {
            attrs    : { version: '1.0' },
            merchant : {
                id        : this.merchantId,
                signature : this.buildMerchantSignature(data)
            },
            data
        };

        const { response } = await this.xmlHttpClient.request('/rest_fiz', { request });

        if (!response || response.data.error) {
            logger.error('Invalid privatbank statement response', { response });

            throw new Error('PrivatbankClient Error');
        }

        const bankStatementsRows = response.data.info.statements.statement || [];

        const statements = bankStatementsRows.map((row: { attrs: PrivatbankStatement }) => {
            return this.formatStatement(row.attrs);
        });

        return statements;
    }

    private formatStatement(bankStatement: PrivatbankStatement): Statement {
        const amount = this.convertAmountStringToCents(bankStatement.cardamount);
        const balance = this.convertAmountStringToCents(bankStatement.rest);
        const datetime = `${bankStatement.trandate} ${bankStatement.trantime}`;

        return {
            id          : bankStatement.appcode,
            amount      : amount,
            balance     : balance,
            datetime    : datetime,
            description : bankStatement.description
        };
    }

    private convertAmountStringToCents(amountString: string) {
        const cents = parseInt(amountString.split('.').join(''));

        if (!Number.isInteger(cents)) {
            logger.error('Invalid amount string received', { amountString });

            throw new Error('PrivatbankClient Error');
        }

        return cents;
    }

    private buildMerchantSignature(data: unknown) {
        const dataXml = this.xmlHttpClient.buildXml(data, { onlyBody: true });
        const sourceString = `${dataXml}${this.merchantPassword}`;

        const md5 = crypto.createHash('md5');
        const sha1 = crypto.createHash('sha1');

        const firstHash = md5.update(sourceString).digest('hex');
        const secondHash = sha1.update(firstHash).digest('hex');

        const signature = secondHash;

        return signature;
    }
}
