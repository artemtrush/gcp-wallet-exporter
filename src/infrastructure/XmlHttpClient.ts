import { Builder as XmlBuilder, Parser as XmlParser } from 'xml2js';
import HttpClient, { HttpClientOptions } from './HttpClient';

export type XmlHttpClientOptions = HttpClientOptions;

export default class XmlHttpClient {
    private xmlBuilder;
    private xmlParser;
    private httpClient;

    constructor(options: XmlHttpClientOptions) {
        this.xmlBuilder = new XmlBuilder({ attrkey: 'attrs', renderOpts: { pretty: false } });
        this.xmlParser = new XmlParser({ attrkey: 'attrs', explicitArray: false });

        this.httpClient = new HttpClient({
            ...options,
            headers : {
                ...options.headers,
                'Content-Type' : 'application/xml'
            }
        });
    }

    async request(endpoint: string, data: unknown) {
        const requestXml = this.buildXml(data);

        const responseXml = await this.httpClient.post(endpoint, requestXml) as string;

        const response = await this.parseXml(responseXml);

        return response;
    }

    buildXml(data: unknown, options?: { onlyBody: boolean }): string {
        let sourceObject = data;

        if (options?.onlyBody) {
            sourceObject = { __body__: data };
        }

        const xml = this.xmlBuilder.buildObject(sourceObject);

        if (options?.onlyBody) {
            return xml.substring(
                xml.indexOf('<__body__>') + '<__body__>'.length,
                xml.lastIndexOf('</__body__>')
            );
        }

        return xml;
    }

    async parseXml(xml: string) {
        this.xmlParser.reset();

        return this.xmlParser.parseStringPromise(xml);
    }
}
