
import { upsertProduct } from "../../src/services/productService.js";

async function testInsert() {
    console.log("Starting manual insert test...");
    try {
        const product = await upsertProduct({
            barcode: "TY-IP17-TEST-1",
            name: "Apple iPhone 17 (Test)",
            description: "Test description",
            category: "Cep Telefonu",
            price: 99999,
            stock: 10,
            currency: "TRY",
            imageUrl: "https://example.com/image.jpg",
            brand: "Apple",
            sourceUrl: "https://test.com",
            sourceSite: "test.com"
        });
        console.log("Insert result:", product);
    } catch (error: any) {
        const fs = await import("fs");
        fs.writeFileSync("db_error.txt", JSON.stringify(error, null, 2));
        console.log("Error written to db_error.txt");
    }
    process.exit(0);
}

testInsert();
