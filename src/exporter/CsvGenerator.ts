import dateFormat from 'dateformat';
import { stringify, Options } from 'csv-stringify/sync';

const STATEMENT_HEADER = {
    id          : 'Id',
    datetime    : 'Datetime',
    income      : 'Income',
    expense     : 'Expense',
    balance     : 'Balance',
    description : 'Description'
};

export default class CsvGenerator {
    generateStatementCsv(transactions: Transaction[]) {
        const sortedTransactions = [ ...transactions ].sort((first, second) => {
            return first.datetime > second.datetime ? 1 : -1;
        });

        const formattedTransactions = sortedTransactions.map(transaction => {
            return this.formatTransactionForCsv(transaction);
        });

        const options: Options = {
            quoted  : true,
            header  : true,
            columns : STATEMENT_HEADER
        };

        return stringify(formattedTransactions, options);
    }

    private formatTransactionForCsv(transaction: Transaction) {
        let income = '';
        let expense = '';

        if (transaction.amount > 0) {
            income = this.formatAmountOfMoneyForCsv(transaction.amount);
        } else {
            expense = this.formatAmountOfMoneyForCsv(transaction.amount);
        }

        return {
            id          : transaction.id,
            datetime    : this.formatDatetimeForCsv(transaction.datetime),
            income      : income,
            expense     : expense,
            balance     : this.formatAmountOfMoneyForCsv(transaction.balance),
            description : transaction.description
        };
    }

    private formatAmountOfMoneyForCsv(amount: number) {
        return (amount / 100).toFixed(2);
    }

    private formatDatetimeForCsv(datetime: number) {
        return dateFormat(datetime, 'dd-mm-yyyy HH:MM:ss', true);
    }
}
