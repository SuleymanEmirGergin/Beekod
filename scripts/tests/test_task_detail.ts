import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';

const WIRO_API_KEY = process.env.WIRO_API_KEY || '';
const WIRO_API_SECRET = process.env.WIRO_API_SECRET || '';
const WIRO_TASK_URL = 'https://api.wiro.ai/v1/Task/Detail';

// Use recent task token from console logs
const TASK_TOKEN = 'mH3fjQJJBRqPZsJ6QjjH6hbiNimWA3';

function getWiroHeaders() {
    const nonce = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
        .createHmac('sha256', WIRO_API_KEY)
        .update(WIRO_API_SECRET + nonce)
        .digest('hex');

    return {
        'Content-Type': 'application/json',
        'x-api-key': WIRO_API_KEY,
        'x-nonce': nonce,
        'x-signature': signature
    };
}

async function testTaskDetail() {
    console.log('Testing Wiro Task Detail API...');
    console.log('Task Token:', TASK_TOKEN);

    try {
        const response = await fetch(WIRO_TASK_URL, {
            method: 'POST',
            headers: getWiroHeaders(),
            body: JSON.stringify({
                tasktoken: TASK_TOKEN
            })
        });

        console.log('Response Status:', response.status);

        const result = await response.json();

        // Write full response to file
        fs.writeFileSync('wiro_response.json', JSON.stringify(result, null, 2));
        console.log('Full response written to wiro_response.json');

        // Try to find outputs in various places
        console.log('\n=== SEARCHING FOR OUTPUTS ===');

        if (result.tasklist && result.tasklist.length > 0) {
            console.log('Found tasklist with', result.tasklist.length, 'items');
            result.tasklist.forEach((task: any, i: number) => {
                console.log(`\nTask ${i}:`);
                console.log('  outputs:', task.outputs);
                console.log('  output:', task.output);
                console.log('  status:', task.status);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testTaskDetail();
