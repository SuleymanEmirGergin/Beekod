import { query } from "../db.js";
import { generateGeminiReply } from "./geminiClient.js";
import { getInvoices } from "./invoiceStore.js";
import { logger } from "../logger.js";
import { Product } from "../types.js";

interface CountResult {
  count: number;
}

interface TotalResult {
  total: number;
}

interface MetricResult {
  count: number;
  revenue: number;
}

interface TopProductResult {
  product_name: string;
  qty: number;
  revenue: number;
}

export interface DashboardSummary {
  title: string;
  subtitle: string;
  metrics: {
    label: string;
    value: string;
    trend?: string;
    trendType?: "up" | "down" | "neutral";
  }[];
  narrative: string;
}

export interface ActionItem {
  id: string;
  type: "stock" | "price" | "review" | "order";
  title: string;
  description: string;
  priority: "critical" | "high" | "medium";
  actionLabel: string;
  actionTarget: string; // screen name or barcode
}

import { env } from "../config/env.js";

// Simple in-memory cache
let summaryCache: { data: DashboardSummary; timestamp: number } | null = null;
const CACHE_TTL_MS = env.CACHE_TTL * 1000;

export async function getExecutiveSummary(): Promise<DashboardSummary> {
  // Check cache
  if (summaryCache && Date.now() - summaryCache.timestamp < CACHE_TTL_MS) {
    logger.info("intelligence.cache_hit", { ttl: CACHE_TTL_MS });
    return summaryCache.data;
  }

  try {
    // 1. Gather Data
    const salesCount = await query<CountResult[]>(
      "SELECT COUNT(*) as count FROM orders WHERE created_at >= NOW() - INTERVAL 7 DAY",
    );
    const totalRevenue = await query<TotalResult[]>(
      "SELECT SUM(total_amount_numeric) as total FROM orders WHERE created_at >= NOW() - INTERVAL 7 DAY",
    );
    const lowStockCount = await query<CountResult[]>("SELECT COUNT(*) as count FROM products WHERE stock <= 10");

    const invoices = await getInvoices();
    const recentExpenses = invoices
      .filter((inv) => {
        const invDate = new Date(inv.date);
        return !isNaN(invDate.getTime()) && invDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const dataContext = {
      last7Days: {
        orders: salesCount[0]?.count || 0,
        revenue: totalRevenue[0]?.total || 0,
        expenses: recentExpenses,
      },
      inventory: {
        lowStockItems: lowStockCount[0]?.count || 0,
      },
    };

    // 2. Gemini Analysis
    const systemInstruction = `Sen Beekod e-ticaret yönetim panelinin yapay zeka beynisin. 
        Kullanıcıya son 7 günlük verilerini analiz ederek kısa, vurucu ve harekete geçirici bir yönetici özeti sun.
        JSON formatında döndür: { "title": string, "subtitle": string, "metrics": Array<{label, value, trend, trendType}>, "narrative": string }
        Dil: Türkçe.`;

    const prompt = `İşletme Verileri: ${JSON.stringify(dataContext)}
        Lütfen bu verilere dayanarak işletmenin durumunu özetle. Trendleri belirt.`;

    const response = await generateGeminiReply({
      message: systemInstruction + "\n\n" + prompt,
      locale: "tr",
    });

    let result: DashboardSummary;

    if (!response) {
      result = {
        title: "İşletme Özeti",
        subtitle: "Son 7 günlük performansınız",
        metrics: [
          { label: "Siparişler", value: String(dataContext.last7Days.orders), trend: "+5%", trendType: "up" },
          { label: "Harcamalar", value: `₺${dataContext.last7Days.expenses}`, trend: "-2%", trendType: "down" },
        ],
        narrative: "Verileriniz analiz ediliyor. Genel olarak satışlarınız stabil seyrediyor.",
      };
    } else {
      const jsonStr = response.replace(/```json|```/g, "").trim();
      result = JSON.parse(jsonStr);
    }

    // Update cache
    summaryCache = {
      data: result,
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    logger.error("intelligence.getExecutiveSummary_failed", { error });
    throw error;
  }
}

export async function getActionItems(): Promise<ActionItem[]> {
  const actions: ActionItem[] = [];

  // 1. Check Low Stock
  const lowStock = await query<Pick<Product, "barcode" | "name" | "stock">[]>(
    "SELECT barcode, name, stock FROM products WHERE stock <= 5 LIMIT 3",
  );
  lowStock.forEach((item) => {
    actions.push({
      id: `stock_${item.barcode}`,
      type: "stock",
      title: `Kritik Stok: ${item.name}`,
      description: `Sadece ${item.stock} adet kaldı. Yakında tükenebilir.`,
      priority: "critical",
      actionLabel: "Stok Ekle",
      actionTarget: "inventory",
    });
  });

  // 2. Check Orders needing sync (actually we sync manually, so maybe orders in 'New' status)
  const newOrders = await query<CountResult[]>("SELECT COUNT(*) as count FROM orders WHERE status_label = 'New'");
  if (newOrders[0]?.count > 0) {
    actions.push({
      id: "sync_orders",
      type: "order",
      title: `${newOrders[0].count} Yeni Sipariş`,
      description: "İşlenmeyi bekleyen yeni siparişleriniz var.",
      priority: "high",
      actionLabel: "Siparişleri Gör",
      actionTarget: "orders",
    });
  }

  // 3. Fake potential price optimization (placeholder for actual intelligence)
  if (actions.length < 3) {
    actions.push({
      id: "price_opt",
      type: "price",
      title: "Fiyat Optimizasyonu",
      description: "En çok satan 3 ürününüz için rakip fiyat analizini kontrol edin.",
      priority: "medium",
      actionLabel: "İncele",
      actionTarget: "inventory",
    });
  }

  return actions;
}


export async function getDailyBrief(): Promise<DashboardSummary> {
  const cacheKey = `daily_brief_${new Date().toISOString().split("T")[0]}`;

  // Custom simple cache for daily brief if needed, but for now we rely on the function logic
  // to be fast enough or we can use the same cache structure as summaryCache

  try {
    // 1. Fetch Today's Data
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    const todayStats = await query<MetricResult[]>(
      "SELECT COUNT(*) as count, SUM(total_amount_numeric) as revenue FROM orders WHERE created_at >= ?",
      [todayStart]
    );

    const yesterdayStats = await query<MetricResult[]>(
      "SELECT COUNT(*) as count, SUM(total_amount_numeric) as revenue FROM orders WHERE created_at >= ? AND created_at < ?",
      [yesterdayStart, yesterdayEnd]
    );

    const lowStock = await query<{ count: number }[]>("SELECT COUNT(*) as count FROM products WHERE stock <= 10");

    const todayData = {
      orders: todayStats[0].count || 0,
      revenue: todayStats[0].revenue || 0,
    };

    const yesterdayData = {
      orders: yesterdayStats[0].count || 0,
      revenue: yesterdayStats[0].revenue || 0,
    };

    // Calculate trends
    const revenueTrend = yesterdayData.revenue === 0
      ? (todayData.revenue > 0 ? 100 : 0)
      : ((todayData.revenue - yesterdayData.revenue) / yesterdayData.revenue) * 100;

    const orderTrend = yesterdayData.orders === 0
      ? (todayData.orders > 0 ? 100 : 0)
      : ((todayData.orders - yesterdayData.orders) / yesterdayData.orders) * 100;

    // 2. AI Prompt
    const systemInstruction = `Sen e-ticaret uzmanı bir iş analistisin.
    Kullanıcıya "Günlük Brifing" sunuyorsun.
    Samimi, profesyonel ve motive edici bir dille bugünün performansını dün ile kıyaslayarak anlat.
    JSON döndür: { "title": "...", "subtitle": "...", "narrative": "...", "metrics": [...] }`;

    const prompt = `Bugün (${new Date().toLocaleDateString('tr-TR')}):
    - Ciro: ${todayData.revenue} TL (Dün: ${yesterdayData.revenue} TL)
    - Sipariş: ${todayData.orders} (Dün: ${yesterdayData.orders})
    - Kritik Stok: ${lowStock[0].count} ürün.
    
    Yorumla. Eğer ciro artışı varsa kutla. Stok sorunu varsa uyar.`;

    const response = await generateGeminiReply({
      message: systemInstruction + "\n\n" + prompt,
      locale: "tr",
    });

    let result: DashboardSummary;

    if (response) {
      const jsonStr = response.replace(/```json|```/g, "").trim();
      try {
        result = JSON.parse(jsonStr);
      } catch (e) {
        // Fallback if AI JSON is bad
        result = {
          title: "Günlük Özet",
          subtitle: new Date().toLocaleDateString('tr-TR'),
          narrative: response.substring(0, 200) + "...",
          metrics: []
        };
      }
    } else {
      result = {
        title: "Veri Alınamadı",
        subtitle: "AI bağlantı hatası",
        narrative: "Şu anda yapay zeka servisine ulaşılamıyor.",
        metrics: []
      };
    }

    // Ensure metrics are populated if AI didn't
    if (!result.metrics || result.metrics.length === 0) {
      result.metrics = [
        {
          label: "Bugünkü Ciro",
          value: `${todayData.revenue.toLocaleString('tr-TR')} ₺`,
          trend: `%${revenueTrend.toFixed(1)}`,
          trendType: revenueTrend >= 0 ? 'up' : 'down'
        },
        {
          label: "Sipariş",
          value: String(todayData.orders),
          trend: `%${orderTrend.toFixed(1)}`,
          trendType: orderTrend >= 0 ? 'up' : 'down'
        }
      ];
    }

    return result;

  } catch (error) {
    logger.error("intelligence.daily_brief_failed", { error });
    throw error;
  }
}

export async function getTrends() {
  // Mock trends data as fallback/initial implementation
  return [
    { label: "Oca", orders: 45, revenue: 12500 },
    { label: "Şub", orders: 52, revenue: 14800 },
    { label: "Mar", orders: 61, revenue: 19200 },
    { label: "Nis", orders: 58, revenue: 17500 },
    { label: "May", orders: 74, revenue: 22100 },
    { label: "Haz", orders: 85, revenue: 26400 },
  ];
}

export async function askAssistant(question: string): Promise<string> {
  try {
    // 1. Gather Context Data
    const salesStats = await query<MetricResult[]>(
      "SELECT COUNT(*) as count, SUM(total_amount_numeric) as revenue FROM orders WHERE created_at >= NOW() - INTERVAL 30 DAY"
    );

    const topProducts = await query<TopProductResult[]>(
      `SELECT product_name, SUM(quantity) as qty, SUM(price_numeric) as revenue 
       FROM order_items 
       GROUP BY product_name 
       ORDER BY qty DESC 
       LIMIT 5`
    );

    const context = {
      last30Days: {
        orders: salesStats[0].count,
        revenue: salesStats[0].revenue
      },
      topSellingProducts: topProducts
    };

    // 2. Prepare Prompt
    const systemInstruction = `Sen Beekod Asistan'sın. Kullanıcının iş verileriyle ilgili sorularını yanıtlıyorsun.
    Veri Bağlamı: ${JSON.stringify(context)}
    
    Kurallar:
    - Sadece verilen veriye dayanarak cevap ver.
    - Samimi ve yardımsever ol.
    - Eğer sorunun cevabı veride yoksa "Bu bilgiye şu an erişemiyorum" de.
    - Cevabın kısa ve net olsun.`;

    // 3. Call Gemini
    const response = await generateGeminiReply({
      message: systemInstruction + "\n\n" + question,
      locale: "tr",
    });

    return response || "Üzgünüm, şu an yanıt veremiyorum.";

  } catch (error) {
    logger.error("intelligence.ask_failed", { error });
    throw error;
  }
}
