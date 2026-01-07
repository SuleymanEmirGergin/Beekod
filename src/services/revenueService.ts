import { pool } from "../db.js";
import { logger } from "../logger.js";
import { generateGeminiReply } from "./geminiService.js";
import { Locale } from "../types.js";

export interface BundleSuggestion {
  products: string[];
  occurrenceCount: number;
  recommendedPrice: number;
  savingsPercent: number;
}

export interface CustomerLTV {
  customerEmail: string;
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  predictedLTV: number;
  segment: "VIP" | "Loyal" | "Regular" | "At Risk";
}

export interface RevenueInsight {
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  actionLabel?: string;
}

/**
 * Finds products that are frequently bought together.
 * Analyzing the order_items table for co-occurrence.
 */
export async function getBundleSuggestions(limit: number = 5): Promise<BundleSuggestion[]> {
  try {
    const query = `
            SELECT 
                t1.product_name as p1, 
                t2.product_name as p2, 
                COUNT(*) as matches
            FROM order_items t1
            JOIN order_items t2 ON t1.order_id = t2.order_id AND t1.id < t2.id
            GROUP BY p1, p2
            ORDER BY matches DESC
            LIMIT ?
        `;

    const [rows] = await pool.query(query, [limit]);
    const results = (rows as any[]).map((row) => ({
      products: [row.p1, row.p2],
      occurrenceCount: row.matches,
      recommendedPrice: 0, // Would calculate based on product prices
      savingsPercent: 10, // Fixed suggestion for now
    }));

    return results;
  } catch (error) {
    logger.error("revenue.bundles_failed", { err: error });
    return [];
  }
}

/**
 * Calculates Customer Lifetime Value (LTV) using RFM metrics.
 */
export async function predictCustomerLTV(): Promise<CustomerLTV[]> {
  try {
    const query = `
            SELECT 
                customer_email,
                COUNT(*) as order_count,
                SUM(CAST(total_amount_numeric AS DECIMAL(10,2))) as total_spent,
                AVG(CAST(total_amount_numeric AS DECIMAL(10,2))) as avg_order_value,
                MAX(created_at) as last_order_date
            FROM orders
            WHERE customer_email IS NOT NULL AND customer_email != ''
            GROUP BY customer_email
            ORDER BY total_spent DESC
            LIMIT 50
        `;

    const [rows] = await pool.query(query);
    const now = new Date();

    return (rows as any[]).map((row) => {
      const lastOrderDate = new Date(row.last_order_date);
      const monthsSinceLastOrder = (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      // Simplified LTV: (Avg Order Value * Order Frequency) / Churn Rate
      // Here we use a very basic heuristic
      const predictedLTV = row.total_spent * (1.2 - monthsSinceLastOrder * 0.05);

      let segment: CustomerLTV["segment"] = "Regular";
      if (row.total_spent > 5000) segment = "VIP";
      else if (row.order_count > 5) segment = "Loyal";
      else if (monthsSinceLastOrder > 3) segment = "At Risk";

      return {
        customerEmail: row.customer_email,
        totalSpent: parseFloat(row.total_spent),
        orderCount: row.order_count,
        avgOrderValue: parseFloat(row.avg_order_value),
        predictedLTV: parseFloat(predictedLTV.toFixed(2)),
        segment,
      };
    });
  } catch (error) {
    logger.error("revenue.ltv_failed", { err: error });
    return [];
  }
}

/**
 * AI-driven revenue insights.
 */
export async function getRevenueInsights(locale: Locale = "tr"): Promise<RevenueInsight[]> {
  const ltvData = await predictCustomerLTV();
  const vipCount = ltvData.filter((c) => c.segment === "VIP").length;
  const atRiskCount = ltvData.filter((c) => c.segment === "At Risk").length;

  const prompt = `
        Müşteri Verileri:
        - Toplam Analiz Edilen Müşteri: ${ltvData.length}
        - VIP Müşteri Sayısı: ${vipCount}
        - Riskli (Terke Yakın) Müşteri: ${atRiskCount}
        
        Bu verilere dayanarak işletme sahibi için 3 tane kısa ve öz "Gelir Artırıcı İpucu" yaz.
        Her ipucu için Başlık, Açıklama ve Etki (positive/negative/neutral) belirt.
        Yanıt JSON formatında olsun: [{ "title": "", "description": "", "impact": "" }]
    `;

  try {
    const aiResponse = await generateGeminiReply({
      message: prompt,
      locale,
    });

    if (aiResponse) {
      const jsonStr = aiResponse.match(/\[.*\]/s)?.[0];
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
    }
  } catch (error) {
    logger.error("revenue.insights_failed", { err: error });
  }

  // Fallback insights
  return [
    {
      title: "VIP Sadakat Programı",
      description: `${vipCount} VIP müşteriniz için özel indirimler tanımlayarak sadakati artırabilirsiniz.`,
      impact: "positive",
      actionLabel: "Kampanya Oluştur",
    },
    {
      title: "Risk Altındaki Müşteriler",
      description: `${atRiskCount} müşteri uzun süredir alışveriş yapmadı. Geri kazanım e-postası gönderin.`,
      impact: "negative",
      actionLabel: "Hatırlatıcı Gönder",
    },
  ];
}
