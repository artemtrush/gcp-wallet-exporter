import dateFormat from 'dateformat';
import XLSX from 'xlsx';
import { stringify, Options } from 'csv-stringify/sync';

export type StatementFileFormat = 'csv' | 'xlsx';
export type StatementFileContent = string | Buffer;

type TransactionData = {
  id: string;
  datetime: string;
  income: string;
  expense: string;
  balance: string;
  description: string;
}

const STATEMENT_HEADER: TransactionData = {
    id          : 'Id',
    datetime    : 'Datetime',
    income      : 'Income',
    expense     : 'Expense',
    balance     : 'Balance',
    description : 'Description'
};

export default class StatementGenerator {
    generateStatementFile(transactions: Transaction[], fileFormat: StatementFileFormat): StatementFileContent {
        const sortedTransactions = [ ...transactions ].sort((first, second) => {
            return first.datetime > second.datetime ? 1 : -1;
        });

        const formattedTransactions = sortedTransactions.map(transaction => {
            return this.formatTransaction(transaction);
        });

        switch (fileFormat) {
            case 'csv':
                return this.generateStatementCsv(formattedTransactions);
            case 'xlsx':
                return this.generateStatementXslx(formattedTransactions);
            default:
                throw new Error('Invalid file format');
        }
    }

    private generateStatementCsv(data: TransactionData[]): StatementFileContent {
        const options: Options = {
            quoted  : true,
            header  : true,
            columns : STATEMENT_HEADER
        };

        return stringify(data, options);
    }

    private generateStatementXslx(data: TransactionData[]): StatementFileContent {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        XLSX.utils.book_append_sheet(workbook, worksheet);

        const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        return xlsxBuffer;
    }

    private formatTransaction(transaction: Transaction): TransactionData {
        let income = '';
        let expense = '';

        if (transaction.amount > 0) {
            income = this.formatAmountOfMoney(transaction.amount);
        } else {
            expense = this.formatAmountOfMoney(transaction.amount);
        }

        return {
            id          : transaction.id,
            datetime    : this.formatDatetime(transaction.datetime),
            income      : income,
            expense     : expense,
            balance     : this.formatAmountOfMoney(transaction.balance),
            description : transaction.description
        };
    }

    private formatAmountOfMoney(amount: number): string {
        return (amount / 100).toFixed(2);
    }

    private formatDatetime(datetime: number): string {
        return dateFormat(datetime, 'dd-mm-yyyy HH:MM:ss', true);
    }
}
