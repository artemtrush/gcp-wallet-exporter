import MonobankClient from './monobank/MonobankClient';
import PrivatbankClient from './privatbank/PrivatbankClient';

export default class StatementExporter {
    async run() {
        const monobankClient = new MonobankClient({ apiUrl, accessToken });
        const privatbankClient = new PrivatbankClient({ apiUrl, merchantId, merchantPassword });

        // const data = await privatbankClient.getStatement();

        // console.log(JSON.stringify(data, null, 4));
    }
}
