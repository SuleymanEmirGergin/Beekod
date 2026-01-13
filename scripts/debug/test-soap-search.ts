import "../../env.js";
import { n11Service } from "../../src/services/n11Service.js";

async function testSOAPSearch() {
    console.log("=".repeat(60));
    console.log("N11 SOAP SearchCatalog Test");
    console.log("=".repeat(60));

    // Önce kategori ağacını alalım
    console.log("\n1. Kategori Ağacını Al:");
    const categories = await n11Service.getCategoryTree();
    
    // "Telefon" kategorisini bulalım
    const telefonKategori = categories.find(c => c.name.toLowerCase().includes("telefon"));
    console.log(`   Telefon Kategorisi: ${telefonKategori?.name} (ID: ${telefonKategori?.id})`);

    // "Bilgisayar" kategorisini bulalım
    const bilgisayarKategori = categories.find(c => c.name.toLowerCase().includes("bilgisayar"));
    console.log(`   Bilgisayar Kategorisi: ${bilgisayarKategori?.name} (ID: ${bilgisayarKategori?.id})`);

    // Test 1: Kategori ID ile arama
    if (telefonKategori) {
        console.log(`\n2. SOAP Arama (title="iphone", categoryId=${telefonKategori.id}):`);
        try {
            const result = await n11Service.searchCatalog({
                title: "iphone",
                categoryId: telefonKategori.id
            });
            console.log(`   ✅ ${result.products.length} ürün bulundu`);
            if (result.products.length > 0) {
                console.log(`   İlk ürün: ${result.products[0].title || result.products[0].name}`);
            }
        } catch (error: any) {
            console.log(`   ❌ Hata: ${error.message}`);
        }
    }

    // Test 2: Sadece kategori ID ile arama
    if (telefonKategori) {
        console.log(`\n3. SOAP Arama (sadece categoryId=${telefonKategori.id}):`);
        try {
            const result = await n11Service.searchCatalog({
                categoryId: telefonKategori.id
            });
            console.log(`   ✅ ${result.products.length} ürün bulundu`);
            if (result.products.length > 0) {
                console.log(`   İlk 3 ürün:`);
                result.products.slice(0, 3).forEach((p: any, i: number) => {
                    console.log(`      ${i+1}. ${p.title || p.name}`);
                });
            }
        } catch (error: any) {
            console.log(`   ❌ Hata: ${error.message}`);
        }
    }

    // Test 3: Sadece title (kategori olmadan)
    console.log(`\n4. SOAP Arama (sadece title="iphone"):`);
    try {
        const result = await n11Service.searchCatalog({
            title: "iphone"
        });
        console.log(`   ✅ ${result.products.length} ürün bulundu`);
    } catch (error: any) {
        console.log(`   ❌ Hata: ${error.message}`);
    }

    console.log("\n" + "=".repeat(60));
}

testSOAPSearch().catch(console.error);
