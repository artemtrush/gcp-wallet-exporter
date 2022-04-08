import pino from 'pino';

class Logger {
    private pinoLogger;

    constructor() {
        this.pinoLogger = pino({
            transport : {
                target  : 'pino-pretty',
                options : {
                    singleLine : true,
                    ignore     : 'pid,hostname'
                }
            }
        });
    }

    info(message: string, params?: unknown) {
        if (params === undefined) {
            this.pinoLogger.info(message);
        } else {
            this.pinoLogger.info(params, message);
        }
    }

    error(message: string, params?: unknown) {
        if (params === undefined) {
            this.pinoLogger.error(message);
        } else {
            this.pinoLogger.error(params, message);
        }
    }
}

export default new Logger();
