
import axios from 'axios';

const urls = {
    trendyol: "https://cdn.dsmcdn.com/ty995/product/media/images/prod/PIM/20230913/23/e8/e8c9c0c1-be56-4702-8951-404543788775/1_org_zoom.jpg",
    hepsiburada: "https://productimages.hepsiburada.net/s/442/550/110000477174690.jpg",
    n11: "https://n11scdn.akamaized.net/a1/1024/elektronik/cep-telefonu/apple-iphone-15-128-gb_1130617.jpg",
    ptt: "https://cdn.pttavm.com/product_images/original/102434522/iphone-15-128-gb--yesil--1_1000.jpg",
    ciceksepeti: "https://cdn.ciceksepeti.com/cicek/kcm98765432/1/apple-iphone-15-128gb-sari-kcm98765432-1-d1c9e8a7b6.jpg"
};

async function fetchAndConvert() {
    for (const [key, url] of Object.entries(urls)) {
        try {
            console.log(`Fetching ${key}...`);
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const base64 = Buffer.from(response.data, 'binary').toString('base64');
            const mimeType = response.headers['content-type'];
            console.log(`\n--- ${key.toUpperCase()} START2 ---`);
            console.log(`data:${mimeType};base64,${base64}`);
            console.log(`--- ${key.toUpperCase()} END2 ---\n`);
        } catch (error: any) {
            console.log(`Failed ${key}: ${error.message}`);
            // Fallback to a generic reliably hosted image if specific one fails
        }
    }
}

fetchAndConvert();
