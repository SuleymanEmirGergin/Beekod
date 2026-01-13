import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";
import { isSuccess } from "../../src/utils/result.js";
import * as fs from "fs/promises";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    // 1. Trendyol Doğrulaması (En zengin veri kaynağı)
    const trendyol = getMarketplaceProvider("Trendyol");
    if (trendyol) {
        console.log("--- Trendyol Doğrulaması Başlıyor ---");
        const result = await trendyol.listListings();
        if (isSuccess(result)) {
            const items = result.value.items;
            const withVariants = items.filter(i => i.variants && i.variants.length > 1);
            console.log(`Trendyol: ${items.length} gruplanmış ürün çekildi.`);
            console.log(`Trendyol: ${withVariants.length} adet varyantlı ürün bulundu.`);
            
            if (withVariants.length > 0) {
                console.log("Örnek Varyantlı Ürün (Kısa):", {
                    title: withVariants[0].title,
                    variantCount: withVariants[0].variants?.length,
                    variants: withVariants[0].variants?.map(v => v.attributes)
                });
            }
        } else {
            console.error("Trendyol hatası:", result.error);
        }
    }

    // 2. Pazarama Doğrulaması
    const pazarama = getMarketplaceProvider("Pazarama");
    if (pazarama) {
        console.log("\n--- Pazarama Doğrulaması Başlıyor ---");
        const result = await pazarama.listListings();
        if (isSuccess(result)) {
            const items = result.value.items;
            const withRichData = items.filter(i => i.brand && i.imageUrl);
            console.log(`Pazarama: ${items.length} ürün çekildi.`);
            console.log(`Pazarama: ${withRichData.length} üründe zengin veri (marka/görsel) bulundu.`);
        }
    }

    // 3. PttAVM Doğrulaması
    const pttavm = getMarketplaceProvider("PttAVM");
    if (pttavm) {
        console.log("\n--- PttAVM Doğrulaması Başlıyor ---");
        const result = await pttavm.listListings();
        if (isSuccess(result)) {
            const items = result.value.items;
            const withRichData = items.filter(i => i.brand && i.imageUrl);
            console.log(`PttAVM: ${items.length} ürün çekildi.`);
            console.log(`PttAVM: ${withRichData.length} üründe zengin veri bulundu.`);
        }
    }

    // 4. N11 Doğrulaması
    const n11 = getMarketplaceProvider("N11");
    if (n11) {
        console.log("\n--- N11 Doğrulaması Başlıyor ---");
        const result = await n11.listListings();
        if (isSuccess(result)) {
            const items = result.value.items;
            const withAttributes = items.filter(i => i.attributes && Object.keys(i.attributes).length > 0);
            console.log(`N11: ${items.length} ürün çekildi.`);
            console.log(`N11: ${withAttributes.length} üründe öznitelik bulundu.`);
        }
    }

    // 5. Ciceksepeti Doğrulaması
    const cicek = getMarketplaceProvider("Ciceksepeti");
    if (cicek) {
        console.log("\n--- Ciceksepeti Doğrulaması Başlıyor ---");
        const result = await cicek.listListings();
        if (isSuccess(result)) {
            const items = result.value.items;
            console.log(`Ciceksepeti: ${items.length} ürün çekildi.`);
        }
    }

    // Dump sample to file
    const allProviders = [trendyol, pazarama, pttavm, n11, cicek].filter(Boolean);
    const dump: any = {};
    for (const p of allProviders) {
        const res = await p!.listListings();
        if (isSuccess(res)) {
            dump[p!.name] = res.value.items.slice(0, 5);
        }
    }
    await fs.writeFile("debug_rich_data_dump.json", JSON.stringify(dump, null, 2));
    console.log("\nSonuçlar debug_rich_data_dump.json dosyasına kaydedildi.");
}

main().catch(console.error);
