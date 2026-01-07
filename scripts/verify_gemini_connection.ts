
import '../env.js';
import { GoogleGenerativeAI } from "@google-cloud/vertexai";
// Actually the project uses @google/generative-ai
import { GoogleGenerativeAI as GenAI } from "@google/generative-ai";

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API Key');
        return;
    }

    console.log('Testing Gemini Connection with key:', key.substring(0, 5) + '...');

    try {
        const genAI = new GenAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Explain how AI works in one sentence.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Success! Response:');
        console.log(text);
    } catch (error: any) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testGemini();
