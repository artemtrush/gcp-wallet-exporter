// Resolve packages without type declarations
declare module 'confme';
declare module 'merchant-category-code';

interface BankClient {
    getStatements: (startDate: Date, endDate: endDate) => Promise<Statement[]>
}

interface Statement {
    id: string,
    amount: number,
    balance: number,
    datetime: string, // 2020-01-01 00:00:00
    description: string
}
