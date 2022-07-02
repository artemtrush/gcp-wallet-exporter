import confme from 'confme';
import MonobankClient from './monobank/MonobankClient';
import PrivatbankClient from './privatbank/PrivatbankClient';
import { HttpProxyOptions } from '../../infrastructure/HttpClient';

export const BANK_NAMES = {
    MONOBANK   : 'monobank',
    PRIVATBANK : 'privatbank',
};

function loadBankOptions(bankName: string) {
    return confme(
        `${__dirname}/${bankName}/config-env.json`,
        `${__dirname}/${bankName}/config-schema.json`
    );
}

export function buildBankClient(bankName: string, proxy?: HttpProxyOptions): BankClient {
    const options = {
        ...loadBankOptions(bankName),
        bankName
    };

    const builders = {
        [BANK_NAMES.MONOBANK]   : () => new MonobankClient(options, proxy),
        [BANK_NAMES.PRIVATBANK] : () => new PrivatbankClient(options, proxy)
    };

    return builders[bankName]();
}
