import crypto from 'crypto';
import XmlHttpClient from '../infrastructure/XmlHttpClient';

export interface PrivatbankStatement {
    appcode : string,
    description : string,
    trandate : string,
    trantime : string,
    cardamount : string,
    rest : string
    terminal : string
}

export interface PrivatbankOptions {
    apiUrl : string,
    merchantId : string,
    merchantPassword : string
}

export default class PrivatbankClient {
    private xmlHttpClient;
    private merchantId;
    private merchantPassword;

    constructor(options: PrivatbankOptions) {
        this.merchantId = options.merchantId;
        this.merchantPassword = options.merchantPassword;

        this.xmlHttpClient = new XmlHttpClient({
            baseUrl : options.apiUrl
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getStatement(cardNumber: string, fromTime: number, toTime: number) {
        const data = {
            oper    : 'cmt',
            wait    : '0',
            test    : '0',
            payment : {
                prop : [
                    { attrs: { name: 'sd', value: '01.05.2021' } },
                    { attrs: { name: 'ed', value: '01.06.2021' } },
                    { attrs: { name: 'card', value: cardNumber } }
                ]
            }
        };

        const request = {
            attrs    : { version: '1.0' },
            merchant : this.buildMerchantParams(data),
            data
        };

        const { response } = await this.xmlHttpClient.request('/rest_fiz', { request });

        if (!response || response.data.error) {
            throw new Error('@REMOVE');
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

    private buildMerchantParams(data: unknown) {
        const dataXml = this.xmlHttpClient.buildXml(data, { onlyBody: true });

        return {
            id        : this.merchantId,
            signature : this.buildMerchantSignature(this.merchantPassword, dataXml)
        }
    }

    private buildMerchantSignature(merchantPassword: string, dataXml: string): string {
        const md5 = crypto.createHash('md5');
        const sha1 = crypto.createHash('sha1');

        const sourceString = `${dataXml}${merchantPassword}`;

        const firstHash = md5.update(sourceString).digest('hex');
        const secondHash = sha1.update(firstHash).digest('hex');

        const signature = secondHash;

        return signature;
    }
}
