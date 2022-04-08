// Resolve packages without type declarations
declare module 'confme';

interface BankClient {
    getStatements: (fromTime: number, toTime: number) => Promise<Statement[]>
}

interface Statement {
    id: string,
    amount: number,
    balance: number,
    time: number,
    description: string,
    category: string
}
