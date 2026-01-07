import QRCode from "qrcode";
import { logger } from "../logger.js";

export async function generateQrCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    logger.error("qr.generate_failed", { text, err });
    throw new Error("QR kod olusturulamadi.");
  }
}
