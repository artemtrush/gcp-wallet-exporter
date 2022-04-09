import logger from './infrastructure/logger';

export default class TimeManager {
    setGlobalTimeZone(timeZone: string) {
        process.env.TZ = timeZone;
    }

    /* Period limitations:
    ** Min period (1 day): from [2000-01-01 00:00:00.000] to [2000-01-01 23:59:59.999]
    ** Max period (1 month): from [2000-01-01 00:00:00.000] to [2000-01-31 23:59:59.999]
    */
    buildExportPeriod(lastExportTime: number, maxMonthsToExport: number): { startDate: Date, endDate: Date } {
        const startDate = this.buildExportStartDate(lastExportTime, maxMonthsToExport);
        const endDate = this.buildExportEndDate(startDate);

        return { startDate, endDate };
    }

    private buildExportStartDate(lastExportTime: number, maxMonthsToExport: number): Date {
        let startDate;

        if (lastExportTime) {
            // Move to the start of the next day
            startDate = new Date(lastExportTime + 1);
        } else {
            // The first day of the month in the past
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - maxMonthsToExport);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }

        const isStartOfTheDay = (
            startDate.getHours() +
            startDate.getMinutes() +
            startDate.getSeconds() +
            startDate.getMilliseconds()
        ) === 0;

        if (!isStartOfTheDay) {
            logger.error('Invalid startDate - it should be start of the day', { startDate, lastExportTime });

            throw new Error('TimeManager Error');
        }

        return startDate;
    }

    private buildExportEndDate(startDate: Date): Date {
        // Set time to the end of the previous day
        const endDate = new Date(startDate.getTime() - 1);
        const currentDate = new Date();

        while (true) {
            endDate.setDate(endDate.getDate() + 1);

            const isDateInThePast = endDate < currentDate;
            const isDateInTheSameMonth = endDate.getMonth() === startDate.getMonth();

            if (!isDateInThePast || !isDateInTheSameMonth) {
                endDate.setDate(endDate.getDate() - 1);
                break;
            }
        }

        // In case when loop was terminated on first iteration
        if (endDate < startDate) {
            logger.info('Try later: 24 hours have not passed since the startDate', { startDate, currentDate });

            throw new Error('TimeManager Error');
        }

        return endDate;
    }
}
