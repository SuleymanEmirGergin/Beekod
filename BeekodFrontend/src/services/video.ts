import api from './api';

export interface VideoScript {
  title: string;
  hook: string;
  description: string;
  estimatedDuration: string;
  scenes: {
    sceneNumber: number;
    visualParams: string;
    audioScript: string;
    duration: number;
  }[];
  hashtags: string[];
}

export const generateVideoScript = async (
  productId: string,
  vibe: string,
  platform: string,
): Promise<VideoScript> => {
  const res = await api.post('/video/generate-script', { productId, vibe, platform });
  return res.data.data;
};

export const generateVideoMedia = async (
  productId: string,
  script: VideoScript,
): Promise<{ url: string }> => {
  const res = await api.post('/video/generate-media', { productId, script });
  return res.data.data;
};

export const generateAIVideo = async (
  productId: string,
  vibe: string,
): Promise<{ taskId: string; token: string }> => {
  const res = await api.post('/video/generate-ai-media', { productId, vibe });
  return res.data.data;
};

export const checkVideoStatus = async (
  token: string,
): Promise<{ success: boolean; status: string; url?: string; progress: number }> => {
  const res = await api.get(`/video/task-status/${token}`);
  return res.data;
};
