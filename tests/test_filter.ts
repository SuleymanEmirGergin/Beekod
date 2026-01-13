import { ChatEntity } from "./chatbot/types.js";

const ACCESSORY_KEYWORDS = [
    "kılıf", "kilif", "case", "kapak", "cover",
    "ekran koruyucu", "screen protector", "cam", "glass",
    "şarj", "sarj", "charger", "kablo", "cable",
    "kulaklık", "kulaklik", "headphone",
    "aksesuar", "accessory",
    "şeffaf", "silikon", "uyumlu", "for", "için", "film",
    "lens", "koruyucu", "adaptör", "askı"
];

function filterAccessories(products: any[], query: string, entities?: ChatEntity): any[] {
    const lowerQuery = query.toLowerCase();
    const isMainProductQuery = entities?.queryProductType === "MAIN_PRODUCT";
    const isAccessoryQuery = entities?.queryProductType === "ACCESSORY" ||
        ACCESSORY_KEYWORDS.some(k => lowerQuery.includes(k));

    if (isAccessoryQuery && !isMainProductQuery) {
        return products;
    }

    let avgPrice = 0;
    const productsWithPrice = products.filter(p => p.price > 0);
    if (productsWithPrice.length > 0) {
        avgPrice = productsWithPrice.reduce((sum, p) => sum + p.price, 0) / productsWithPrice.length;
    }

    return products.filter(p => {
        const titleLower = p.title.toLowerCase();
        const hasKeyword = ACCESSORY_KEYWORDS.some(k => titleLower.includes(k));

        if (hasKeyword) {
            if (avgPrice > 1000 && p.price < avgPrice / 10) {
                console.log(`Filtering out (Cheap Accessory): "${p.title}" | Price: ${p.price} (Avg: ${avgPrice.toFixed(0)})`);
                return false;
            }
            if (isMainProductQuery) {
                if (titleLower.includes("hediyeli") || titleLower.includes("paketi") || titleLower.includes("seti")) {
                    console.log(`Keeping (Bundle): "${p.title}"`);
                    return true;
                }
                console.log(`Filtering out (Strict Main Product): "${p.title}"`);
                return false;
            }
        }
        return true;
    });
}

const testProducts = [
    { title: "Apple iPhone 15 128 GB Siyah", price: 50000 },
    { title: "iPhone 15 Pro Max Silikon Kılıf", price: 450 },
    { title: "Buff iPhone 15 Ekran Koruyucu Cam", price: 300 },
    { title: "Apple iPhone 15 Plus 256 GB (Kılıf Hediyeli)", price: 55000 },
    { title: "iPhone 15 Uyumlu Şeffaf Kapak", price: 200 },
    { title: "Magsafe Şarj Aleti iPhone 15", price: 1500 },
    { title: "iPhone 15", price: 49000 },
    { title: "Apple iPhone 15 Plus Tam Koruma Seti", price: 52000 }
];

console.log("--- TEST 1: iphone 15 (Main Product) ---");
const r1 = filterAccessories(testProducts, "iphone 15", { queryProductType: "MAIN_PRODUCT" });
console.log("Result Count:", r1.length);
r1.forEach(p => console.log(`- ${p.title}`));

console.log("\n--- TEST 2: iphone 15 kılıf (Accessory) ---");
const r2 = filterAccessories(testProducts, "iphone 15 kılıf", { queryProductType: "ACCESSORY" });
console.log("Result Count:", r2.length);
r2.forEach(p => console.log(`- ${p.title}`));
