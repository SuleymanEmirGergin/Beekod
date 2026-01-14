import { z } from "zod";
import { AITool, ToolContext, ToolResult } from "./interfaces.js";
import { cargoService, CargoProviderType } from "../../services/cargo/cargoService.js";
import { getOrderById, updateOrderShipping } from "../../services/order/orderService.js";

const CreateShipmentSchema = z.object({
  orderId: z.string().describe("The order ID (Request ID) to ship, e.g. #BK-1234"),
  carrier: z.enum(["yurtici", "aras", "mng"]).describe("Cargo provider to use"),
});

export const createShipmentTool: AITool<z.infer<typeof CreateShipmentSchema>> = {
  name: "createShipment",
  description: "Create a shipping label/tracking number for an order using a cargo provider.",
  schema: CreateShipmentSchema,
  execute: async (args, _context: ToolContext): Promise<ToolResult> => {
    try {
      // 1. Get Order Details
      const result = await getOrderById(args.orderId);
      if (!result.ok) {
        return { success: false, error: "Order not found" };
      }
      const order = result.value;

      // 2. Prepare Shipment Request
      // Mapping order details to cargo shipping request
      const shipmentRequest = {
        provider: args.carrier as CargoProviderType,
        barcode: order.requestId, // Using Request ID as barcode/ref
        recipientName: order.customer.name,
        recipientPhone: order.customer.phone || "",
        recipientAddress: order.customer.address || "",
        recipientCity: "Istanbul", // Placeholder: Order model doesn't strictly enforce city split, using default or parsing if possible.
        // In a real scenario, we would parse address or ask user. For now, defaulting to avoid breaking.
        recipientDistrict: "Merkez", 
        items: order.items.map(i => ({ name: i.product_name, quantity: i.quantity }))
      };

      // 3. Call Cargo Service
      const cargoResult = await cargoService.createShipment(shipmentRequest);
      if (!cargoResult.success) {
        return { success: false, error: cargoResult.error || "Shipment creation failed" };
      }

      // 4. Update Order with tracking info
      if (cargoResult.trackingNumber) {
        await updateOrderShipping(order.requestId, {
            provider: args.carrier,
            trackingNumber: cargoResult.trackingNumber,
            labelUrl: "" 
        });
      }

      return { 
        success: true, 
        data: { 
            trackingNumber: cargoResult.trackingNumber, 
            provider: cargoResult.provider,
            status: "Created"
        } 
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
};
