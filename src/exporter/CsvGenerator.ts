import { stringify, Options } from 'csv-stringify/sync';

export default class CsvGenerator {
    generateStatementsCsv(statements: Statement[]) {
        const options: Options = {
            quoted  : true,
            header  : true,
            columns : {
                id          : 'Id',
                datetime    : 'Datetime',
                amount      : 'Amount',
                balance     : 'Balance',
                description : 'Description'
            }
        };

        return stringify(statements, options);
    }
}
