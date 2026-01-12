
import http from 'http';

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1', // explicit ipv4
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-admin-key': 'Threem123',
            },
            timeout: 300000 // 5 mins
        };

        if (body) {
            const data = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[${method} ${path}] Status: ${res.statusCode}`);
                try {
                    if (!data) return resolve({ statusCode: res.statusCode, body: null });
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => {
            console.error(`[${method} ${path}] Error:`, e);
            reject(e);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTest() {
    console.log('1. Fetching a product to test with...');
    try {
        const prodRes = await request('GET', '/api/products?limit=20');

        if (prodRes.statusCode !== 200 || !prodRes.body.products || prodRes.body.products.length === 0) {
            console.error('Failed to get products:', JSON.stringify(prodRes.body, null, 2));
            return;
        }


        const product = prodRes.body.products.find(p => (p.images && p.images.length > 0) || p.imageUrl);

        if (!product) {
            console.error('No suitable product found with images');
            return;
        }

        const barcode = product.barcode;
        console.log(`> Found product: ${product.name} (${barcode})`);

        console.log('\n2. Triggering Virtual Try-On Video Generation...');
        console.log('> This might take up to 60-90 seconds. Please wait...');

        const startTime = Date.now();
        const videoRes = await request('POST', '/api/video/generate-try-on-video', {
            productId: barcode,
            gender: 'female',
            vibe: 'elegant'
        });

        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n> Request completed in ${duration.toFixed(1)}s`);

        if (videoRes.statusCode === 200) {
            console.log('✅ SUCCESS!');
            console.log('Video URL:', videoRes.body.videoUrl);
            console.log('Task Token:', videoRes.body.taskToken);
        } else {
            console.error('❌ FAILED');
            console.error('Status:', videoRes.statusCode);
            console.error('Error:', JSON.stringify(videoRes.body, null, 2));
        }

    } catch (error) {
        console.error('❌ EXCEPTION:', error);
    }
}

runTest();
