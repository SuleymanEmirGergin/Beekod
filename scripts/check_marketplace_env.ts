
import 'dotenv/config';
const res = {
    N11_KEY: process.env.N11_API_KEY ? 'YES' : 'NO',
    N11_SEC: process.env.N11_API_SECRET ? 'YES' : 'NO',
    HB_MID: process.env.HEPSIBURADA_MERCHANT_ID ? 'YES' : 'NO',
    HB_KEY: process.env.HEPSIBURADA_API_KEY ? 'YES' : 'NO'
};
console.log(JSON.stringify(res));
