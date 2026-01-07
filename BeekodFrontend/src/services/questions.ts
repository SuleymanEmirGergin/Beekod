import api from './api';

export interface ProductQuestion {
  _id: string;
  marketplace: 'Trendyol' | 'Hepsiburada' | 'N11' | 'Pazarama';
  productName: string;
  imageUrl?: string;
  customerName: string;
  text: string;
  status: 'replied' | 'unreplied';
  createdAt: string;
  answer?: string;
}

export interface QuestionStats {
  total: number;
  unreplied: number;
  replied: number;
  byMarketplace: Record<string, number>;
}

export const getQuestions = async (
  status?: 'all' | 'replied' | 'unreplied',
): Promise<ProductQuestion[]> => {
  const statusQuery = status && status !== 'all' ? `?status=${status}` : '';
  const res = await api.get(`/questions${statusQuery}`);
  return res.data.data;
};

export const getQuestionStats = async (): Promise<QuestionStats> => {
  const res = await api.get('/questions/stats');
  return res.data.data;
};

export const answerQuestion = async (id: string, text: string): Promise<ProductQuestion> => {
  const res = await api.post(`/questions/${id}/answer`, { text });
  return res.data.data;
};

export const suggestQuestionAnswer = async (id: string): Promise<string> => {
  const res = await api.post(`/questions/${id}/suggest-answer`);
  return res.data.data.suggestion;
};

