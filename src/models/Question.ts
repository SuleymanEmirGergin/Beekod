export interface IQuestion {
  id: number;
  marketplace: "Trendyol" | "Hepsiburada" | "N11" | "Pazarama";
  productName: string;
  imageUrl?: string;
  customerName: string;
  text: string;
  status: "replied" | "unreplied";
  createdAt: Date;
  answer?: string;
  isPublic: boolean;
}

export function mapQuestionRow(row: any): IQuestion {
  return {
    id: row.id,
    marketplace: row.marketplace,
    productName: row.product_name,
    imageUrl: row.image_url,
    customerName: row.customer_name,
    text: row.question_text,
    status: row.status,
    answer: row.answer,
    isPublic: Boolean(row.is_public),
    createdAt: new Date(row.created_at),
  };
}
