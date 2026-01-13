
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
    const data = fs.readFileSync('products_dump.json', 'utf8');
    const json = JSON.parse(data);
    const products = json.products || json.items || [];

    console.log(`Analyzing ${products.length} products...`);

    const valid = products.filter(p => (p.images && p.images.length > 0) || p.imageUrl);

    if (valid.length > 0) {
        console.log('✅ Found products with images:');
        valid.forEach(p => console.log(`- [${p.barcode}] ${p.name}`));
    } else {
        console.log('❌ No products with images found.');
        // List a few names to see what we have
        products.slice(0, 5).forEach(p => console.log(`- [${p.barcode}] ${p.name} (images: ${JSON.stringify(p.images)})`));
    }
} catch (e) {
    console.error(e);
}
