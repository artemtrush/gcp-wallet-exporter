// Resolve packages without type declarations
declare module 'confme';
declare module 'merchant-category-code';

interface BankOptions {
    bankName: string,
    cardNumber: string
}

interface BankClient {
    getBankName: () => string,
    getCardNumber: () => string,
    getStatements: (startDate: Date, endDate: endDate) => Promise<Statement[]>
}

interface Statement {
    id: string,
    amount: number,
    balance: number,
    datetime: string, // 2020-01-01 00:00:00
    description: string
}
