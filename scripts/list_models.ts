
import '../env.js';
// @ts-ignore
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API Key');
        return;
    }

    // Custom fetch to list models via REST if SDK doesn't expose it easily or to debug
    // Actually SDK has it via GoogleGenerativeAI.getGenerativeModel but listing is usually on the class or separate client.
    // Let's try to use the raw API endpoint with fetch to be sure.

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.error('Failed to list models:', data);
        }
    } catch (error: any) {
        console.error('Network Error listing models:', error.message);
    }
}

listModels();
