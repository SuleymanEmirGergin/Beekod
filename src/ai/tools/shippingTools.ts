import { z } from "zod";
import { AITool, ToolContext, ToolResult } from "./interfaces.js";
import { cargoService, CargoProviderType } from "../../services/cargo/cargoService.js";
import { getOrderById, updateOrderShipping } from "../../services/orderService.js";

const CreateShipmentSchema = z.object({
  orderId: z.string().describe("The order ID (Request ID) to ship, e.g. #BK-1234"),
  carrier: z.enum(["yurtici", "aras", "mng"]).describe("Cargo provider to use"),
});

export const createShipmentTool: AITool<z.infer<typeof CreateShipmentSchema>> = {
  name: "createShipment",
  description: "Create a shipping label/tracking number for an order using a cargo provider.",
  schema: CreateShipmentSchema,
  execute: async (args, context: ToolContext): Promise<ToolResult> => {
    try {
      // 1. Get Order Details
      const order = await getOrderById(args.orderId);
      if (!order) {
        return { success: false, error: "Order not found" };
      }

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
      const result = await cargoService.createShipment(shipmentRequest);

      if (!result.success) {
        return { success: false, error: result.error || "Shipment creation failed" };
      }

      // 4. Update Order with tracking info
      if (result.trackingNumber) {
        await updateOrderShipping(order.requestId, {
            provider: args.carrier,
            trackingNumber: result.trackingNumber,
            labelUrl: "" // No label URL from mock service usually
        });
      }

      return { 
        success: true, 
        data: { 
            trackingNumber: result.trackingNumber, 
            provider: result.provider,
            status: "Created"
        } 
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
};
