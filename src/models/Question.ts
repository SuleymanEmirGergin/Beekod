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

export interface IQuestionDbRow {
  id: number;
  marketplace: "Trendyol" | "Hepsiburada" | "N11" | "Pazarama";
  product_name: string;
  image_url: string;
  customer_name: string;
  question_text: string;
  status: "replied" | "unreplied";
  answer?: string;
  is_public: number;
  created_at: Date | string;
}

export function mapQuestionRow(row: IQuestionDbRow): IQuestion {
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
