import { query } from "../../src/db.js";

async function seed() {
    try {
        console.log("Seeding Revenue Data (Targeted Schema)...");

        const orders = [
            {
                request_id: "#BK-SEED-1",
                customer_email: "vip@example.com",
                customer_name: "Aykut Elmas",
                total_amount: "₺8.500,00",
                total_amount_numeric: 8500,
                status_label: "Delivered",
                status_color: "bg-emerald-50 text-emerald-700",
                status_dot: "bg-emerald-500",
                source_name: "Trendyol",
                currency: "TRY",
                order_date: "2025-12-20",
                products_list: "iPhone 15 Pro Max, AirPods Pro 2"
            },
            {
                request_id: "#BK-SEED-2",
                customer_email: "vip@example.com",
                customer_name: "Aykut Elmas",
                total_amount: "₺1.200,00",
                total_amount_numeric: 1200,
                status_label: "Delivered",
                status_color: "bg-emerald-50 text-emerald-700",
                status_dot: "bg-emerald-500",
                source_name: "Hepsiburada",
                currency: "TRY",
                order_date: "2025-12-21",
                products_list: "iPhone 15 Pro Max Case"
            },
            {
                request_id: "#BK-SEED-3",
                customer_email: "loyal@example.com",
                customer_name: "Sefa Doğanay",
                total_amount: "₺450,00",
                total_amount_numeric: 450,
                status_label: "Delivered",
                status_color: "bg-emerald-50 text-emerald-700",
                status_dot: "bg-emerald-500",
                source_name: "Trendyol",
                currency: "TRY",
                order_date: "2025-12-22",
                products_list: "iPhone 15 Pro Max, AirPods Pro 2"
            }
        ];

        for (const o of orders) {
            const sql = `
        INSERT INTO orders (
          request_id, customer_email, customer_name,
          total_amount, total_amount_numeric, currency,
          status_label, status_color, status_dot,
          source_name, order_date, products_list, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
            const res = await query<any>(sql, [
                o.request_id, o.customer_email, o.customer_name,
                o.total_amount, o.total_amount_numeric, o.currency,
                o.status_label, o.status_color, o.status_dot,
                o.source_name, o.order_date, o.products_list
            ]);
            const orderId = res.insertId;

            // Add common items to test Bundling
            await query("INSERT INTO order_items (order_id, product_name, sku, price, price_numeric, quantity) VALUES (?, 'iPhone 15 Pro Max', 'IPH15PM', '₺80.000,00', 80000, 1)", [orderId]);
            await query("INSERT INTO order_items (order_id, product_name, sku, price, price_numeric, quantity) VALUES (?, 'AirPods Pro 2', 'APP2', '₺8.000,00', 8000, 1)", [orderId]);
        }

        console.log("Seeding complete!");
    } catch (err) {
        console.error("Seed failed:", err);
    } finally {
        process.exit(0);
    }
}

seed();
