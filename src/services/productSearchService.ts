
import { Buffer } from "buffer";
import { ProductCard } from "../chatbot/types.js";

export class ProductSearchService {
    /**
     * Search for products across multiple marketplaces (Dynamic Mock Implementation)
     */
    async searchProducts(query: string): Promise<ProductCard[]> {
        try {
            const normalizedQuery = (query || "").toLowerCase();

            // Detect iPhone model
            let model = "15"; // Default
            let basePrice = 54000;

            if (normalizedQuery.includes("15")) {
                model = "15";
                basePrice = 54000;
            } else if (normalizedQuery.includes("14")) {
                model = "14";
                basePrice = 42500;
            } else if (normalizedQuery.includes("13")) {
                model = "13";
                basePrice = 36000;
            } else if (normalizedQuery.includes("12")) {
                model = "12";
                basePrice = 28000;
            } else if (normalizedQuery.includes("11")) {
                model = "11";
                basePrice = 21000;
            } else if (normalizedQuery.includes("samsung") || normalizedQuery.includes("s24")) {
                return this.generateGenericResults(query, 45000); // Generic handler for other brands
            } else if (normalizedQuery.includes("17")) {
                // Treat 17 as 15 for "Real Data" request
                model = "15";
            } else if (normalizedQuery.includes("iphone") || normalizedQuery.includes("telefon")) {
                // Generic iphone query -> 15
                model = "15";
            }

            return this.generateiPhoneResults(model, basePrice);
        } catch (error) {
            console.error("ProductSearchService Error:", error);
            return [];
        }
    }

    private generateiPhoneResults(model: string, basePrice: number): ProductCard[] {
        const specs = "128GB";
        const queryUrl = `iphone+${model}`;

        // Helper to vary price slightly
        const p = (v: number) => v + (Math.random() * 500 - 250);

        return [
            {
                barcode: `TY-IP${model}-128-BLK`,
                name: `Apple iPhone ${model} ${specs} Siyah`,
                price: Math.floor(basePrice * (0.95 + Math.random() * 0.1)),
                currency: "TRY",
                stock: Math.floor(Math.random() * 50) + 5,
                image: getDetailedPhoneSVG(model, "black"),
                marketplace: "Trendyol",
                url: `https://www.trendyol.com/sr?q=${queryUrl}`,
                canImport: true
            },
            {
                barcode: `HB-IP${model}-128-WHT`,
                name: `iPhone ${model} ${specs} Beyaz`,
                price: Math.floor(p(basePrice - 200)),
                currency: "TRY",
                stock: Math.floor(Math.random() * 20) + 2,
                image: getDetailedPhoneSVG(model, "white"),
                marketplace: "Hepsiburada",
                url: `https://www.hepsiburada.com/ara?q=${queryUrl}`,
                canImport: true
            },
            {
                barcode: `N11-IP${model}-128-BLU`,
                name: `Apple iPhone ${model} ${specs} Mavi`,
                price: Math.floor(p(basePrice - 400)),
                currency: "TRY",
                stock: 3,
                image: getDetailedPhoneSVG(model, "blue"),
                marketplace: "N11",
                url: `https://www.n11.com/arama?q=${queryUrl}`,
                canImport: true
            },
            {
                barcode: `PTT-IP${model}-128-GRN`,
                name: `iPhone ${model} ${specs} Yeşil`,
                price: Math.floor(p(basePrice + 500)),
                currency: "TRY",
                stock: 1,
                image: getDetailedPhoneSVG(model, "green"),
                marketplace: "PttAVM",
                url: `https://www.pttavm.com/arama?q=${queryUrl}`,
                canImport: true
            },
            {
                barcode: `PZ-IP${model}-128-PNK`,
                name: `Apple iPhone ${model} ${specs} Pembe`,
                price: Math.floor(p(basePrice + 100)),
                currency: "TRY",
                stock: 15,
                image: getDetailedPhoneSVG(model, "pink"),
                marketplace: "Pazarama",
                url: `https://www.pazarama.com/arama?q=${queryUrl}`,
                canImport: true
            },
            {
                barcode: `CS-IP${model}-128-YLW`,
                name: `iPhone ${model} ${specs} Sarı`,
                price: Math.floor(p(basePrice - 100)),
                currency: "TRY",
                stock: 8,
                image: getDetailedPhoneSVG(model, "yellow"),
                marketplace: "Ciceksepeti",
                url: `https://www.ciceksepeti.com/arama?query=${queryUrl}`,
                canImport: true
            }
        ];
    }

    private generateGenericResults(query: string, avgPrice: number): ProductCard[] {
        // Fallback generator for non-iPhone products
        // Detect if it is Samsung to give a Samsung-like image
        const q = query.toLowerCase();
        const isSamsung = q.includes("samsung") || q.includes("galaxy");

        let model = "generic";
        let displayModel = query;
        let basePrice = avgPrice;

        if (isSamsung) {
            model = "samsung";

            // Dynamic Model Detection
            if (q.includes("s24")) { model = "s24"; displayModel = "Samsung Galaxy S24"; basePrice = 45000; }
            else if (q.includes("s23")) { model = "s23"; displayModel = "Samsung Galaxy S23"; basePrice = 35000; }
            else if (q.includes("s22")) { model = "s22"; displayModel = "Samsung Galaxy S22"; basePrice = 25000; }
            else if (q.includes("a55")) { model = "a55"; displayModel = "Samsung Galaxy A55"; basePrice = 18000; }
            else if (q.includes("a54")) { model = "a54"; displayModel = "Samsung Galaxy A54"; basePrice = 15000; }
            else if (q.includes("a35")) { model = "a35"; displayModel = "Samsung Galaxy A35"; basePrice = 13000; }
            else {
                // If query is just "Samsung", maybe pick a random recent model or use query
                displayModel = query.charAt(0).toUpperCase() + query.slice(1);
            }
        }

        return ["Trendyol", "Hepsiburada", "N11", "PttAVM", "Ciceksepeti", "Pazarama"].map(m => {
            const colors = ["black", "titanium-gray", "violet", "yellow", "white", "blue"];
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Use detected model
            const img = getDetailedPhoneSVG(model, color);

            const colorMap: any = {
                "black": "Siyah", "titanium-gray": "Titanyum Gri", "violet": "Menekşe",
                "yellow": "Sarı", "white": "Beyaz", "blue": "Mavi"
            };
            const trColor = colorMap[color] || color;

            // Generate Direct Marketplace Links
            const searchQ = encodeURIComponent(`${displayModel} ${trColor}`);
            let directUrl = "";

            switch (m) {
                case "Trendyol": directUrl = `https://www.trendyol.com/sr?q=${searchQ}`; break;
                case "Hepsiburada": directUrl = `https://www.hepsiburada.com/ara?q=${searchQ}`; break;
                case "N11": directUrl = `https://www.n11.com/arama?q=${searchQ}`; break;
                case "PttAVM": directUrl = `https://www.pttavm.com/arama?q=${searchQ}`; break;
                case "Ciceksepeti": directUrl = `https://www.ciceksepeti.com/arama?query=${searchQ}`; break;
                case "Pazarama": directUrl = `https://www.pazarama.com/arama?q=${searchQ}`; break;
                default: directUrl = `https://www.google.com/search?q=${m}+${searchQ}`;
            }

            return {
                barcode: `${m.substring(0, 2).toUpperCase()}-${isSamsung ? 'SAM' : 'GEN'}-${Math.floor(Math.random() * 1000)}`,
                name: `${displayModel} 128GB ${trColor} (${m} Garantili)`,
                price: Math.floor(basePrice + (Math.random() * 2000 - 1000)),
                currency: "TRY",
                stock: Math.floor(Math.random() * 20) + 1,
                image: img,
                marketplace: m as any,
                url: directUrl,
                canImport: true
            };
        });
    }
}

function getDetailedPhoneSVG(model: string, color: string): string {
    let frameHex = "#777";
    let backHex = "#333";

    // Samsung S24/Android Colors
    if (color === "titanium-gray" || color === "grey") { frameHex = "#6F6F6F"; backHex = "#4A4A4A"; }
    else if (color === "violet" || color === "purple") { frameHex = "#5D4B8E"; backHex = "#E6E6FA"; }
    else if (color === "yellow" || color === "amber") { frameHex = "#D4AF37"; backHex = "#FFFACD"; }

    // Existing iPhone Colors
    else if (color === "white") { frameHex = "#D1CDDA"; backHex = "#F9F9F9"; }
    else if (color === "blue") { frameHex = "#4A90E2"; backHex = "#A1C9F5"; }
    else if (color === "black") { frameHex = "#1c1c1e"; backHex = "#2B2B2B"; }
    else if (color === "green") { frameHex = "#415A4C"; backHex = "#DCE8D8"; }
    else if (color === "pink") { frameHex = "#B86E86"; backHex = "#FADADD"; }

    const isSamsung = model.includes("s24") || model.includes("samsung");

    // Camera Module Logic
    let camSVG = "";

    if (isSamsung) {
        // Samsung Style: Vertical traffic light, no island/notch, sharp corners (Ultra style) or rounded (Base)
        // Let's go with "Ultra" style sharp corners + isolated camera lenses (no big square bump)
        camSVG = `
        <circle cx="130" cy="80" r="14" fill="#111" stroke="${frameHex}" stroke-width="2"/>
        <circle cx="130" cy="120" r="14" fill="#111" stroke="${frameHex}" stroke-width="2"/>
        <circle cx="130" cy="160" r="14" fill="#111" stroke="${frameHex}" stroke-width="2"/>
        <circle cx="170" cy="90" r="10" fill="#111" stroke="${frameHex}" stroke-width="2"/> 
        <circle cx="170" cy="130" r="8" fill="#555" stroke="${frameHex}" stroke-width="1"/> <!-- Laser AF / Flash -->
        `;
    } else {
        // iPhone Logic
        const is15 = model.includes("15");
        const isOld = model.includes("11") || model.includes("12");
        const hasDiagonalCam = !isOld;

        if (hasDiagonalCam) {
            // Diagonal 2 Cameras
            camSVG = `
            <rect x="115" y="65" width="80" height="80" rx="18" fill="${frameHex}" fill-opacity="0.3"/>
            <circle cx="135" cy="85" r="16" fill="#111" stroke="#222" stroke-width="2"/>
            <circle cx="175" cy="125" r="16" fill="#111" stroke="#222" stroke-width="2"/>
            <circle cx="175" cy="80" r="4" fill="#FFFFEE" opacity="0.6"/> 
            `;
        } else {
            // Vertical 2 Cameras (11/12)
            camSVG = `
            <rect x="115" y="65" width="50" height="90" rx="18" fill="${frameHex}" fill-opacity="0.3"/>
            <circle cx="140" cy="85" r="16" fill="#111" stroke="#222" stroke-width="2"/>
            <circle cx="140" cy="125" r="16" fill="#111" stroke="#222" stroke-width="2"/>
            `;
        }
    }

    const cornerRadius = isSamsung ? "8" : "30"; // S24 Ultra is sharper

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
        <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="10" stdDeviation="15" flood-opacity="0.2"/>
            </filter>
        </defs>
        
        <!-- Phone Body -->
        <rect x="100" y="50" width="200" height="400" rx="${cornerRadius}" fill="${backHex}" filter="url(#shadow)" stroke="${frameHex}" stroke-width="4"/>
        
        <!-- Logo -->
        ${isSamsung
            ? `<text x="200" y="300" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.3)" text-anchor="middle" transform="rotate(-90 200 300)">SAMSUNG</text>`
            : `<circle cx="200" cy="220" r="18" fill="white" fill-opacity="0.9" />`
        }
        
        <!-- Camera Module -->
        ${camSVG}
    </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export const productSearchService = new ProductSearchService();
