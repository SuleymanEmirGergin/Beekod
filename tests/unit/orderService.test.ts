import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrder } from "../../src/services/orderService";
import { socketService } from "../../src/services/socketService";
import { query } from "../../src/db";

// Mocks
vi.mock("../../src/services/socketService", () => ({
    socketService: {
        emit: vi.fn(),
    }
}));
vi.mock("../../src/db");

describe("OrderService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createOrder", () => {
        it("should emit notification:new_order upon successful creation", async () => {
            // Define mock data
            const mockOrder = {
                id: 100,
                request_id: "#BK-2105",
                total_amount: "₺1500.00",
                customer_name: "Test User",
                order_date: new Date(),
                status_label: "New"
            };

            const queryMock = query as any;
            queryMock.mockReset(); // Clear previous
            queryMock.mockImplementation((sql: string, params: any[]) => {
                // 1. Generate Request ID
                if (sql.includes("SELECT COUNT(*)")) return Promise.resolve([{ count: 10 }]);

                // 2. Insert Order
                if (sql.includes("INSERT INTO orders")) return Promise.resolve({ insertId: 100 });

                // 3. Insert Items
                if (sql.includes("INSERT INTO order_items")) return Promise.resolve({});

                // 4. Get Order (fetch created order)
                if (sql.includes("SELECT * FROM orders WHERE request_id")) {
                    return Promise.resolve([mockOrder]);
                }

                // 5. Get Items (fetch items for created order)
                if (sql.includes("SELECT * FROM order_items")) return Promise.resolve([]);

                return Promise.resolve([]);
            });

            const input = {
                source: { name: "Trendyol", marketplaceId: "123" },
                customer: { name: "Test User" },
                items: [{ product_name: "Ayakkabı", quantity: 1, price: "₺1500.00" }],
                total: "₺1500.00"
            };

            const result = await createOrder(input);

            expect(result).toBeDefined();
            expect(result?.requestId).toBe("#BK-2105");
            expect(socketService.emit).toHaveBeenCalledWith('notification:new_order', expect.objectContaining({
                message: expect.stringContaining("Yeni Sipariş"),
                total: "₺1500.00"
            }));
        });
    });
});
