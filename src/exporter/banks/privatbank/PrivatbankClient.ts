import crypto from 'crypto';
import dateFormat from 'dateformat';
import logger from '../../../infrastructure/logger';
import XmlHttpClient from '../../../infrastructure/XmlHttpClient';
import { HttpProxyOptions } from '../../../infrastructure/HttpClient';

export interface PrivatbankTransaction {
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

const REQUEST_DATE_PATTERN = 'dd.mm.yyyy';
const RESPONSE_DATE_PATTERN = 'yyyy-mm-dd';

export default class PrivatbankClient implements BankClient {
    private xmlHttpClient;
    private readonly bankName;
    private readonly cardNumber;
    private readonly merchantId;
    private readonly merchantPassword;

    constructor(options: PrivatbankOptions, proxy?: HttpProxyOptions) {
        this.bankName = options.bankName;
        this.cardNumber = options.cardNumber;
        this.merchantId = options.merchantId;
        this.merchantPassword = options.merchantPassword;

        this.xmlHttpClient = new XmlHttpClient({
            baseUrl : options.apiUrl,
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
        const requestStartDate = dateFormat(startDate, REQUEST_DATE_PATTERN);
        const requestEndDate = dateFormat(endDate, REQUEST_DATE_PATTERN);

        const data = {
            oper    : 'cmt',
            wait    : '0',
            test    : '0',
            payment : {
                prop : [
                    { attrs: { name: 'sd', value: requestStartDate } },
                    { attrs: { name: 'ed', value: requestEndDate } },
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
        const transactions = this.extractTransactionsFromResponse(response);

        const responseStartDate = dateFormat(startDate, RESPONSE_DATE_PATTERN);
        const responseEndDate = dateFormat(endDate, RESPONSE_DATE_PATTERN);

        // Additionally filter transactions because of incorrect API behaviour
        const filteredTransactions = transactions.filter((transaction: PrivatbankTransaction) => {
            return transaction.trandate >= responseStartDate && transaction.trandate <= responseEndDate;
        });

        const formattedTransactions = filteredTransactions.map((transaction: PrivatbankTransaction) => {
            return this.formatTransaction(transaction);
        });

        return formattedTransactions;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private extractTransactionsFromResponse(response: any) {
        if (!response || !response.data || response.data.error) {
            logger.error('Invalid privatbank statement response', { response });

            throw new Error('PrivatbankClient Error');
        }

        let transactionsRows = response.data.info.statements.statement;

        if (transactionsRows === undefined) {
            transactionsRows = [];
        } else if (!Array.isArray(transactionsRows)) {
            transactionsRows = [ transactionsRows ];
        }

        return transactionsRows.map((row: { attrs: PrivatbankTransaction }) => row.attrs);
    }

    private formatTransaction(transaction: PrivatbankTransaction): Transaction {
        const amount = this.convertAmountStringToCents(transaction.cardamount);
        const balance = this.convertAmountStringToCents(transaction.rest);
        const datetime = `${transaction.trandate} ${transaction.trantime}`;

        return {
            id          : transaction.appcode,
            amount      : amount,
            balance     : balance,
            datetime    : datetime,
            description : transaction.description
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
