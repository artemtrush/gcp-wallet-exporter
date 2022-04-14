import { Storage } from '@google-cloud/storage';
import logger from './logger';

const STATUS_CODE_NOT_FOUND = 404;

export interface CloudStorageOptions {
    bucketName: string
}

export default class CloudStorage {
    private readonly storage;
    private readonly bucketName;

    constructor(options: CloudStorageOptions) {
        this.bucketName = options.bucketName;

        // Credentials are provided by GOOGLE_APPLICATION_CREDENTIALS env-variable
        // It is applied automatically inside CloudFunction environment
        this.storage = new Storage();
    }

    async getFile(filePath: string) {
        try {
            const fileContent = await this.storage
                .bucket(this.bucketName)
                .file(filePath)
                .download();

            return fileContent.toString();
        } catch (error) {
            if (error.code === STATUS_CODE_NOT_FOUND) {
                return undefined;
            }

            logger.error('Failed to download file from storage', { reason: error.message });

            throw new Error('CloudStorage Error');
        }
    }

    async saveFile(filePath: string, fileContent: string) {
        try {
            await this.storage
                .bucket(this.bucketName)
                .file(filePath)
                .save(fileContent);
        } catch (error) {
            logger.error('Failed to upload file to storage', { reason: error.message });

            throw new Error('CloudStorage Error');
        }
    }
}
