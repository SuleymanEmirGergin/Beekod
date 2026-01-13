
import axios from 'axios';

const urls = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/IPhone_15_Pro_Black_Titanium.svg/200px-IPhone_15_Pro_Black_Titanium.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/IPhone_15_Pro_White_Titanium.svg/200px-IPhone_15_Pro_White_Titanium.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/IPhone_15_Pro_Blue_Titanium.svg/200px-IPhone_15_Pro_Blue_Titanium.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/IPhone_15_Pro_Natural_Titanium.svg/200px-IPhone_15_Pro_Natural_Titanium.svg.png"
];

async function run() {
    for (const url of urls) {
        try {
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            const b64 = Buffer.from(res.data).toString('base64');
            console.log(`\n### START ${url.split('/').pop()} ###`);
            console.log(`data:image/png;base64,${b64}`);
            console.log(`### END ###\n`);
        } catch (e) {
            console.error("Failed:", e.message);
        }
    }
}

run();
