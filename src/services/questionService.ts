import { pool } from "../db.js";
import { generateGeminiReply } from "./geminiService.js";
import { searchProductsByName } from "./productService.js";
import { IQuestion, mapQuestionRow } from "../models/Question.js";

export const getQuestions = async (status?: "replied" | "unreplied"): Promise<IQuestion[]> => {
  let sql = "SELECT * FROM questions";
  const params: any[] = [];
  if (status) {
    sql += " WHERE status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC";

  const [rows] = await pool.query(sql, params);
  return (rows as any[]).map(mapQuestionRow);
};

export const getQuestionById = async (id: string): Promise<IQuestion | null> => {
  const [rows] = await pool.query("SELECT * FROM questions WHERE id = ?", [id]);
  const row = (rows as any[])[0];
  return row ? mapQuestionRow(row) : null;
};

export const answerQuestion = async (id: string, text: string): Promise<IQuestion | null> => {
  await pool.query("UPDATE questions SET status = 'replied', answer = ? WHERE id = ?", [text, id]);
  return getQuestionById(id);
};

export const getQuestionsStats = async () => {
  const [totalResult] = (await pool.query("SELECT COUNT(*) as total FROM questions")) as any;
  const total = totalResult[0].total;

  const [unrepliedResult] = (await pool.query(
    "SELECT COUNT(*) as unreplied FROM questions WHERE status = 'unreplied'",
  )) as any;
  const unreplied = unrepliedResult[0].unreplied;

  const [repliedResult] = (await pool.query(
    "SELECT COUNT(*) as replied FROM questions WHERE status = 'replied'",
  )) as any;
  const replied = repliedResult[0].replied;

  const [marketplaceStats] = (await pool.query(
    "SELECT marketplace as _id, COUNT(*) as count FROM questions GROUP BY marketplace",
  )) as any;

  const byMarketplace = marketplaceStats.reduce((acc: Record<string, number>, curr: any) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  return { total, unreplied, replied, byMarketplace };
};

export const suggestAnswer = async (id: string): Promise<string> => {
  const question = await getQuestionById(id);
  if (!question) throw new Error("Question not found");

  const products = await searchProductsByName(question.productName, 1);
  const product = products[0];

  let productContext = "";
  if (product) {
    productContext = `
        Ürün Bilgileri:
        - Ad: ${product.name}
        - Fiyat: ${product.price} ${product.currency}
        - Stok Durumu: ${product.stock > 0 ? `Stokta var (${product.stock} adet)` : "Stokta yok"}
        - Kategori: ${product.category}
        - Açıklama: ${product.description || "Belirtilmemiş"}
        `;
  }

  const systemInstruction = `Sen Beekod e-ticaret panelinin akıllı asistanısın. 
    Müşteri sorularına profesyonel, nazik ve elindeki ürün bilgilerini kullanarak %100 doğru yanıtlar hazırlamalısın. 
    Eğer ürün bilgilerinde cevap yoksa nazikçe 'bu konuda net bilgim yok' diyerek satıcıya yönlendir. 
    Asla yalan yanlış bilgi verme. Dil: Türkçe.`;

  const prompt = `
    ${productContext}
    
    Müşteri Sorusu: ${question.text}
    
    Lütfen yukarıdaki ürün bilgilerini dikkate alarak müşteriye nazik ve yardımcı bir yanıt taslağı hazırla.`;

  const response = await generateGeminiReply({
    message: systemInstruction + "\n\n" + prompt,
    locale: "tr",
  });

  return response || "Yanıt önerisi oluşturulamadı.";
};
