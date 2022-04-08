import axios from 'axios';
import logger from './logger';

const HTTP_REQUEST_TIMEOUT_MS = 20000;

export interface HttpClientOptions {
    baseUrl: string,
    timeout?: number,
    headers?: Record<string, string>
}

export default class HttpClient {
    private axiosInstance;

    constructor(options: HttpClientOptions) {
        this.axiosInstance = axios.create({
            baseURL : options.baseUrl,
            timeout : options.timeout ?? HTTP_REQUEST_TIMEOUT_MS,
            headers : options.headers ?? {}
        });
    }

    async get(endpoint: string) {
        try {
            const response = await this.axiosInstance.get(endpoint);

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    logger.error('Http response error [GET]', {
                        endpoint,
                        status : error.response.status,
                        reason : error.response.data
                    });
                } else {
                    logger.error('Http request error [GET]', { reason: error.message });
                }
            }

            throw new Error('HttpClient Error');
        }
    }

    async post(endpoint: string, data: unknown) {
        try {
            const response = await this.axiosInstance.post(endpoint, data);

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    logger.error('Http response error [POST]', {
                        endpoint,
                        status : error.response.status,
                        reason : error.response.data
                    });
                } else {
                    logger.error('Http request error [POST]', { reason: error.message });
                }
            }

            throw new Error('HttpClient Error');
        }
    }
}
