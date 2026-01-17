import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

async function generateStandaloneScript() {
    // Manually read .env to bypass missing process.env issues
    let apiKey = "";
    try {
        const envContent = fs.readFileSync(".env", "utf8");
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        if (match) apiKey = match[1].trim();
    } catch (e) { }

    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const product = {
        name: "Electric Blue Premium Hoodie",
        category: "Clothing",
        description: "Soft cotton blend, vibrant electric blue color, premium stitching, oversized fit.",
        price: 899,
        currency: "TRY"
    };
    const vibe = "energetic";
    const platform = "Instagram Reels";

    const prompt = `
        Sen ödüllü bir Sosyal Medya İçerik Yönetmeni ve Viral Pazarlama Dehasısın. 
        Görevin, aşağıdaki ürün için her saniyesi izleyiciyi ekrana kilitleyecek, ${vibe} modunda bir video senaryosu hazırlamak.
        Platform: ${platform} (Dikey format, 9:16, ultra dinamik kurgu)

        ÜRÜN BİLGİLERİ:
        Ad: ${product.name}
        Kategori: ${product.category}
        Detaylar: ${product.description}
        Fiyat: ${product.price} ${product.currency}

        STRATEJİK YÖNERGELER:
        1. "Hook" (Kanca) ilk 1.5 saniyede merak uyandırmalı.
        2. "Visuals": Sahne tarifleri Wiro AI Video motorunun anlayacağı şekilde sinematik olmalı (örn: "Dolly zoom on the professional finish", "Cinematic product reveal with soft lighting").
        3. "Audio": Samimi, ikna edici ve profesyonel bir TTS (Seslendirme) tonu tarif et.
        4. "Dinamik Katmanlar": Ekranda görünecek fiyat, indirim veya özellik metinlerini belirle.
        
        JSON Formatı:
        {
            "title": "Ürün Başlığı",
            "hook": "Güçlü Kanca",
            "description": "Caption ve Hashtagler",
            "estimatedDuration": "15-30sn",
            "scenes": [
                {
                    "sceneNumber": 1,
                    "visualParams": "Detaylı görsel tarif",
                    "cinematicCamera": "Kamera hareketi (Örn: Zoom, Pan, Tilt)",
                    "audioScript": "Seslendirme metni",
                    "voiceTone": "Ses tonu tarifi (Örn: Heyecanlı, Güven verici)",
                    "duration": 3
                }
            ],
            "hashtags": ["#marketing"],
            "bgMusicStyle": "Müzik tarzı (Örn: Lofi, Phonk, Corporate)",
            "overlayText": "Ekranda görünecek ana metin"
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            console.log("SCRIPT_RESULT_START");
            console.log(jsonMatch[0]);
            console.log("SCRIPT_RESULT_END");
        } else {
            console.log("Raw Response:");
            console.log(text);
        }
    } catch (err) {
        console.error(err);
    }
}

generateStandaloneScript();
