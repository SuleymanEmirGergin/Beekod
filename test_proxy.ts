
import axios from 'axios';

const images = [
    // Trendyol (iPhone 15)
    "https://wsrv.nl/?url=cdn.dsmcdn.com/ty1019/product/media/images/prod/PIM/20231023/14/b6/b66e3010-388f-4ed3-912f-90e84ec6d528/1_org_zoom.jpg&w=400",
    // Hepsiburada
    "https://wsrv.nl/?url=productimages.hepsiburada.net/s/442/550/110000477174690.jpg&w=400",
    // N11
    "https://wsrv.nl/?url=n11scdn.akamaized.net/a1/1024/elektronik/cep-telefonu/apple-iphone-15-128-gb_1130617.jpg&w=400",
    // Pazarama
    "https://wsrv.nl/?url=cdn.pazarama.com/product-images-optimized/9990000000002/d0e2e0e0-5e0e-4e0e-9e0e-6e0e7e0e8e0e/500/500.jpg&w=400"
];

async function checkProxy() {
    for (const url of images) {
        try {
            const res = await axios.get(url);
            console.log(`\nURL: ${url}`);
            console.log(`Status: ${res.status}`);
            console.log(`Type: ${res.headers['content-type']}`);
            if (res.status === 200 && res.headers['content-type']?.includes('image')) {
                console.log("SUCCESS: Image fetched via proxy.");
            } else {
                console.log("FAIL: Invalid response.");
            }
        } catch (e: any) {
            console.log(`\nURL: ${url}`);
            console.log(`ERROR: ${e.message}`);
        }
    }
}

checkProxy();
