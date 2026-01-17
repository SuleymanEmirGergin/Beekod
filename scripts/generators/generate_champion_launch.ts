import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

async function generateChampionLaunch() {
    let apiKey = "";
    try {
        const envContent = fs.readFileSync(".env", "utf8");
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        if (match) apiKey = match[1].trim();
    } catch (e) { }

    if (!apiKey) {
        console.error("GEMINI_API_KEY missing");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const context = {
        userName: "Emir",
        achievement: "Hackathon 3.lük ödülü ($1,000)",
        productName: "Electric Blue Premium Hoodie",
        productVibe: "Comfortable, vibrant, high-quality fabric, oversized",
        story: "Emir bu fotoğrafı hackathon kazandığı gün, uykusuz ama gururlu şekilde çekti. Üzerindeki hoodie hem şans getirdi hem de o uzun kodlama saatlerinde konfor sağladı."
    };

    const prompt = `
        Sen bir dijital pazarlama gurusu ve viral içerik uzmanısın. 
        Kullanıcımız Emir, katıldığı Hackathon'da 3. oldu ve $1,000 kazandı. 
        Bu başarıyı, sattığı "Electric Blue Premium Hoodie" ürünüyle özdeşleştirerek bir "Micro-Launch" paketi hazırlamanı istiyorum.
        
        KONSEPT: "Winners wear blue" (Kazananlar mavi giyer). Bu hoodie sadece bir kıyafet değil, uykusuz geçen kodlama saatlerinin, başarıya giden konforun bir parçası.
        
        Lütfen şunları üret:
        1. Instagram/Tiktok Başlığı ve Hikaye Kurgusu (Enerjik, emojili)
        2. LinkedIn Paylaşımı (Başarı hikayesi odaklı, ilham verici, profesyonel ama samimi)
        3. Twitter/X "Thread" Başlangıcı ve Viral Tweet (Esprili, yazılımcı dilinde)
        
        Kullanıcıyı (Emir) odak noktasına al ama ürünü (Hoodie) bu başarının vazgeçilmez bir parçası gibi konumlandır.
    `;

    try {
        const result = await model.generateContent(prompt);
        console.log("LAUNCH_PACKAGE_START");
        console.log(result.response.text());
        console.log("LAUNCH_PACKAGE_END");
    } catch (err) {
        console.error(err);
    }
}

generateChampionLaunch();
