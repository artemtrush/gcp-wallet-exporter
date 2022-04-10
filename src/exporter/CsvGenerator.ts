import { stringify, Options } from 'csv-stringify/sync';

const STATEMENT_HEADER = {
    id          : 'Id',
    datetime    : 'Datetime',
    amount      : 'Amount',
    balance     : 'Balance',
    description : 'Description'
};

export default class CsvGenerator {
    generateStatementsCsv(statements: Statement[]) {
        const sortedStatements = [ ...statements ].sort((first, second) => first.datetime > second.datetime ? 1 : -1);
        const formattedStatements = sortedStatements.map(statement => this.formatStatementForCsv(statement));

        const options: Options = {
            quoted  : true,
            header  : true,
            columns : STATEMENT_HEADER
        };

        return stringify(formattedStatements, options);
    }

    private formatStatementForCsv(statement: Statement) {
        return {
            ...statement,
            amount  : this.formatAmountOfMoneyForCsv(statement.amount),
            balance : this.formatAmountOfMoneyForCsv(statement.balance),
        };
    }

    private formatAmountOfMoneyForCsv(amount: number) {
        return (amount / 100).toFixed(2);
    }
}
