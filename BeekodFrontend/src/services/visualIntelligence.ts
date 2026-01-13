import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const visualIntelligenceApi = {
    /**
     * Generate AI Model (FLUX)
     */
    generateModel: async (prompt: string): Promise<string> => {
        const response = await axios.post(`${API_URL}/ai/visual/generate-model`, { prompt });
        return response.data.imageUrl;
    },

    /**
     * Virtual Try-On (IDM-VTON)
     */
    virtualTryOn: async (humanImageUrl: string, clothImageUrl: string, category: string): Promise<string> => {
        const response = await axios.post(`${API_URL}/ai/visual/virtual-try-on`, { 
            humanImageUrl, 
            clothImageUrl, 
            category 
        });
        return response.data.imageUrl;
    },

    /**
     * Generate Video (Kling)
     */
    generateVideo: async (imageUrl: string, prompt: string): Promise<{ videoUrl: string, coverUrl: string }> => {
        const response = await axios.post(`${API_URL}/ai/visual/generate-video`, { 
            imageUrl, 
            prompt 
        });
        return response.data;
    }
};
