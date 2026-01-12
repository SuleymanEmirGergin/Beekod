import { analyzeImage } from "./geminiClient.js";
import { logger } from "../logger.js";

export interface ScannedInvoiceData {
  invoiceNumber?: string;
  customer: {
    name: string;
    taxId?: string;
    taxOffice?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
  date?: string;
  currency?: string;
  totalAmount?: number;
  category?: string;
}

export async function scanInvoiceImage(buffer: Buffer, mimeType: string): Promise<ScannedInvoiceData | null> {
  const prompt = `Bu bir alış faturası görseli. Lütfen bu faturadaki bilgileri ayıkla ve SADECE aşağıdaki JSON formatında dön.
    Hiçbir açıklama ekleme, sadece JSON objesini döndür.
    
    JSON Yapısı:
    {
      "invoiceNumber": "Fatura no",
      "customer": { ... },
      "items": [ ... ],
      "date": "YYYY-MM-DD",
      "currency": "TRY",
      "totalAmount": 120.60,
      "category": "Lojistik | Ürün Tedariği | Hizmet | Ofis Giderleri | Pazarlama | Diğer"
    }
    
    Önemli Kurallar:
    1. Sayısal değerler (quantity, unitPrice, totalAmount) numara tipinde olmalı.
    2. currency alanına TRY, USD veya EUR yaz.
    3. category alanı için faturanın içeriğine göre en uygun olanı seç (Lojistik, Ürün Tedariği, Hizmet, Ofis Giderleri, Pazarlama veya Diğer).
    4. Bilgi bulunamazsa null veya boş string bırak.`;

  try {
    const result = await analyzeImage({
      buffer,
      mimeType,
      prompt: "Sen profesyonel bir veri ayıklama asistanısın. Görsellerden fatura verilerini titizlikle JSON formatında okursun.\n\n" + prompt,
      locale: "tr",
    });

    if (!result) return null;

    // Extract JSON block if Gemini adds any text
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ScannedInvoiceData;
    }

    return null;
  } catch (error) {
    logger.error("aiScanner.scanInvoiceFailed", { err: error });
    return null;
  }
}
