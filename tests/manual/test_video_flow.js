const key = "Threem123";
const baseUrl = "http://localhost:3000/api";

async function run() {
    try {
        console.log("1. Fetching products...");
        const prodsRes = await fetch(`${baseUrl}/products?limit=1`, {
            headers: { "x-admin-key": key }
        });

        if (!prodsRes.ok) {
            console.error("Failed to fetch products:", prodsRes.status);
            return;
        }

        const prodsData = await prodsRes.json();
        const product = prodsData.items && prodsData.items[0];

        if (!product) {
            console.error("No products found.");
            return;
        }

        console.log(`Found product: ${product.name} (${product.barcode})`);

        console.log("2. Generating video script...");
        const scriptRes = await fetch(`${baseUrl}/video/generate-script`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-key": key
            },
            body: JSON.stringify({
                productId: product.barcode,
                vibe: "energetic",
                platform: "instagram"
            })
        });

        if (!scriptRes.ok) {
            console.error("Failed to generate script:", scriptRes.status, await scriptRes.text());
            return;
        }

        const scriptData = await scriptRes.json();
        console.log("Script generated successfully.");
        console.log("Title:", scriptData.data.title);

        console.log("3. Generating media (stock footage)...");
        const mediaRes = await fetch(`${baseUrl}/video/generate-media`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-key": key
            },
            body: JSON.stringify({
                productId: product.barcode,
                script: scriptData.data
            })
        });

        if (!mediaRes.ok) {
            console.error("Failed to generate media:", mediaRes.status, await mediaRes.text());
            return;
        }

        const mediaData = await mediaRes.json();
        console.log("Media result:", mediaData);

        console.log("Test Completed Successfully!");
    } catch (err) {
        console.error("Test execution failed:", err);
    }
}

run();
