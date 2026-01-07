import api from './api';

export interface SocialPost {
  _id: string;
  platform: 'Instagram' | 'TikTok' | 'Facebook' | 'Twitter' | 'LinkedIn';
  content: string;
  mediaUrl?: string;
  scheduledDate: string;
  status: 'Draft' | 'Scheduled' | 'Posted' | 'Failed';
  productId?: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getSocialPosts = async (): Promise<SocialPost[]> => {
  const response = await api.get('/social/posts');
  return response.data;
};

export const createSocialPost = async (data: Partial<SocialPost>): Promise<SocialPost> => {
  const response = await api.post('/social/posts', data);
  return response.data;
};

export const updateSocialPostStatus = async (id: string, status: string): Promise<SocialPost> => {
  const response = await api.patch(`/social/posts/${id}/status`, { status });
  return response.data;
};

export const deleteSocialPost = async (id: string): Promise<boolean> => {
  const response = await api.delete(`/social/posts/${id}`);
  return response.data.success;
};

export const postNow = async (id: string): Promise<boolean> => {
  const response = await api.post(`/social/posts/${id}/post-now`);
  return response.data.success;
};

export const generateSocialContent = async (
  productId: string,
  platform: string,
): Promise<string> => {
  const response = await api.post('/social/generate-content', { productId, platform });
  return response.data.content;
};

export const generateBulkSocialContent = async (
  productIds: string[],
  platform: string,
): Promise<Array<{ barcode: string; content: string }>> => {
  const response = await api.post('/social/bulk-generate-content', { productIds, platform });
  return response.data.results;
};

