import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
    console.log("Starting test...");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in env");
        return;
    }
    console.log("API Key found");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        console.log("Result:", result.response.text());
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
