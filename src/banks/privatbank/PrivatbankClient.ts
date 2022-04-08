import crypto from 'crypto';
import logger from '../../infrastructure/logger';
import XmlHttpClient from '../../infrastructure/XmlHttpClient';

export interface PrivatbankStatement {
    appcode: string,
    description: string,
    trandate: string,
    trantime: string,
    cardamount: string,
    rest: string
    terminal: string
}

export interface PrivatbankOptions {
    apiUrl: string,
    merchantId: string,
    merchantPassword: string,
    cardNumber: string
}

export default class PrivatbankClient implements BankClient {
    private xmlHttpClient;
    private readonly merchantId;
    private readonly merchantPassword;
    private readonly cardNumber;

    constructor(options: PrivatbankOptions) {
        this.merchantId = options.merchantId;
        this.merchantPassword = options.merchantPassword;
        this.cardNumber = options.cardNumber;

        this.xmlHttpClient = new XmlHttpClient({
            baseUrl : options.apiUrl
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getStatements(fromTime: number, toTime: number) {
        const data = {
            oper    : 'cmt',
            wait    : '0',
            test    : '0',
            payment : {
                prop : [
                    { attrs: { name: 'sd', value: '01.05.2021' } },
                    { attrs: { name: 'ed', value: '01.06.2021' } },
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

        const statementsRows = response.data.info.statements.statement;
        const formattedStatements = [];

        for (const statementRow of statementsRows) {
            formattedStatements.push(this.formatStatement(statementRow.attrs));
        }

        return formattedStatements;
    }

    private formatStatement(sourceStatement: PrivatbankStatement): Statement {
        return {
            id          : sourceStatement.appcode,
            amount      : 50,
            balance     : 50,
            time        : 0,
            description : sourceStatement.description,
            category    : sourceStatement.terminal
        };
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
