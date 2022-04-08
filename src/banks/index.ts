import confme from 'confme';
import MonobankClient from './monobank/MonobankClient';
import PrivatbankClient from './privatbank/PrivatbankClient';

export const BANK_NAMES = {
    MONOBANK   : 'monobank',
    PRIVATBANK : 'privarbank',
};

function loadBankOptions(bankName: string) {
    return confme(
        `${__dirname}/${bankName}/config-env.json`,
        `${__dirname}/${bankName}/config-schema.json`
    );
}

export function buildBankClient(bankName: string): BankClient {
    const options = loadBankOptions(bankName);

    const builders = {
        [BANK_NAMES.MONOBANK]   : () => new MonobankClient(options),
        [BANK_NAMES.PRIVATBANK] : () => new PrivatbankClient(options)
    };

    return builders[bankName]();
}
