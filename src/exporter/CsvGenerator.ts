import { stringify, Options } from 'csv-stringify/sync';

const STATEMENT_HEADER = {
    id          : 'Id',
    datetime    : 'Datetime',
    amount      : 'Amount',
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
        return {
            ...transaction,
            amount  : this.formatAmountOfMoneyForCsv(transaction.amount),
            balance : this.formatAmountOfMoneyForCsv(transaction.balance),
        };
    }

    private formatAmountOfMoneyForCsv(amount: number) {
        return (amount / 100).toFixed(2);
    }
}
