import api from './api';

export interface AIDescriptionResponse {
  description: string;
}

export interface AICategoryResponse {
  category: string;
}

export interface AIQRResponse {
  qrCode: string;
}

/**
 * Request AI-generated product description.
 */
export async function generateAIDescription(
  name: string,
  category: string,
  attributes?: any,
): Promise<string> {
  try {
    const response = await api.post('/products/ai/generate-description', {
      name,
      category,
      attributes,
    });
    return response.data.description;
  } catch (error) {
    console.error('Failed to generate AI description', error);
    throw error;
  }
}

/**
 * Request AI category suggestion.
 */
export async function suggestAICategory(name: string): Promise<string> {
  try {
    const response = await api.post('/products/ai/suggest-category', { name });
    return response.data.category;
  } catch (error) {
    console.error('Failed to suggest AI category', error);
    throw error;
  }
}

/**
 * Get product QR code as data URL.
 */
export async function getProductQRCode(barcode: string): Promise<string> {
  try {
    const response = await api.get(`/products/${barcode}/qr`);
    return response.data.qrCode;
  } catch (error) {
    console.error('Failed to get QR code', error);
    throw error;
  }
}
/**
 * Request AI background removal.
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    const response = await api.post('/products/ai/remove-background', { imageUrl });
    return response.data.imageUrl;
  } catch (error) {
    console.error('Failed to remove background', error);
    throw error;
  }
}

export async function getSceneTemplates(): Promise<any[]> {
  try {
    const response = await api.get('/products/ai/scene-templates');
    return response.data;
  } catch (error) {
    console.error('Failed to get scene templates', error);
    throw error;
  }
}

export async function generateProductScene(barcode: string, templateId: string): Promise<any> {
  try {
    const response = await api.post(`/products/${barcode}/generate-scene`, { templateId });
    return response.data;
  } catch (error) {
    console.error('Failed to generate product scene', error);
    throw error;
  }
}

export async function analyzeProductReviews(barcode: string): Promise<any> {
  try {
    const response = await api.post(`/products/${barcode}/analyze-reviews`);
    return response.data;
  } catch (error) {
    console.error('Failed to analyze reviews', error);
    throw error;
  }
}

export async function generateSocialPost(barcode: string, platform: string): Promise<string> {
  try {
    const response = await api.post(`/products/${barcode}/generate-social-post`, { platform });
    return response.data.content;
  } catch (error) {
    console.error('Failed to generate social post', error);
    throw error;
  }
}

export async function generateReviewReply(barcode: string, reviewText: string): Promise<string> {
  try {
    const response = await api.post(`/products/${barcode}/generate-review-reply`, { reviewText });
    return response.data.reply;
  } catch (error) {
    console.error('Failed to generate review reply', error);
    throw error;
  }
}
