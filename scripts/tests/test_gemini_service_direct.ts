
import '../env.js';
import { generateGeminiReply } from '../src/services/geminiService.js';

async function testIndirect() {
    console.log('Testing Gemini Service Direct Import...');
    try {
        const start = Date.now();
        const reply = await generateGeminiReply({
            message: "Hello, are you working?",
            locale: "en"
        });
        const time = Date.now() - start;

        if (reply) {
            console.log(`✅ Success (${time}ms)! Reply:`, reply);
        } else {
            console.error('❌ Failed: Reply is null');
        }
    } catch (err: any) {
        console.error('❌ Failed with exception:', err.message);
    }
}

testIndirect();
