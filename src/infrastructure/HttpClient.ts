import axios from 'axios';

const HTTP_REQUEST_TIMEOUT_MS = 10000;
const HTTP_STATUS_OK = 200;

export interface HttpClientOptions {
    baseUrl : string,
    timeout? : number,
    headers? : Record<string, string>
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
        const { status, data } = await this.axiosInstance.get(endpoint);

        if (status !== HTTP_STATUS_OK) {
            throw new Error('@REMOVE');
        }

        return data;
    }

    async post(endpoint: string, data: unknown) {
        const response = await this.axiosInstance.post(endpoint, data);

        if (response.status !== HTTP_STATUS_OK) {
            throw new Error('@REMOVE');
        }

        return response.data;
    }
}
