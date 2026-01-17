
import http from 'http';

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-admin-key': 'Threem123'
            },
            timeout: 300000
        };

        if (body) {
            const data = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (!data) return resolve({ statusCode: res.statusCode, body: null });
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runFullTest() {
    const TEST_BARCODE = 'TEST_VTON_001';

    console.log('1. Creating/Updating Test Product...');
    const productData = {
        barcode: TEST_BARCODE,
        name: 'Test Floral Summer Dress',
        category: 'Kadın Giyim > Elbise',
        description: 'Beautiful floral summer dress for testing virtual try-on.',
        price: 1299.99,
        currency: 'TRY',
        stock: 100,
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=60'], // Real dress image
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=60'
    };

    try {
        // Try to create or just use it if exists (we can POST /api/products usually, or PUT)
        // Assuming POST /api/products creates a product
        let res = await request('POST', '/api/products', productData);

        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Test product created/exists.');
        } else {
            console.log(`⚠️ Create failed (${res.statusCode}), Body:`, JSON.stringify(res.body));
            // If fail, maybe it exists, let's proceed to test
        }

        console.log('\n2. Triggering Virtual Try-On Video Generation...');
        console.log('> This requires Wiro AI to process (approx 60s)...');

        const startTime = Date.now();
        const videoRes = await request('POST', '/api/video/generate-try-on-video', {
            productId: TEST_BARCODE,
            gender: 'female',
            vibe: 'elegant'
        });

        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n> Request completed in ${duration.toFixed(1)}s`);

        if (videoRes.statusCode === 200) {
            console.log('✅ SUCCESS! Video Generation Verified.');
            console.log('Video URL:', videoRes.body.videoUrl);
            console.log('Task Token:', videoRes.body.taskToken);
        } else {
            console.error('❌ FAILED');
            console.error('Status:', videoRes.statusCode);
            console.error('Error:', videoRes.body);
        }

    } catch (error) {
        console.error('❌ EXCEPTION:', error);
    }
}

runFullTest();
