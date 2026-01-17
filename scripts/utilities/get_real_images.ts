
import axios from 'axios';

const urls = [
    "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-black-titanium-select?wid=200&hei=200&fmt=jpeg&qlt=80",
    "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-white-titanium-select?wid=200&hei=200&fmt=jpeg&qlt=80",
    "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-blue-titanium-select?wid=200&hei=200&fmt=jpeg&qlt=80",
    "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-natural-titanium-select?wid=200&hei=200&fmt=jpeg&qlt=80"
];

async function run() {
    console.log("Starting fetch...");
    for (const url of urls) {
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const b64 = Buffer.from(res.data).toString('base64');
            const color = url.includes("black") ? "BLACK" : url.includes("white") ? "WHITE" : url.includes("blue") ? "BLUE" : "NATURAL";

            console.log(`\n/// START ${color} ///`);
            console.log(`data:image/jpeg;base64,${b64}`);
            console.log(`/// END ${color} ///\n`);
        } catch (e: any) {
            console.error(`Failed ${url}: ${e.message}`);
        }
    }
}

run();
