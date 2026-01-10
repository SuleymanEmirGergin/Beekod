
// Ensure clean URL without trailing colons or garbage (fixes potential .env typos)
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_URL = rawUrl.replace(/[:]+$/, '').replace(/\/$/, '');

export interface GenerateAIModelResponse {
    taskid: string;
    socketaccesstoken: string;
}

export interface AIModelStatusResponse {
    id: string;
    status: string; // 'task_queue', 'task_processing', 'task_postprocess_end', 'failed'
    result: string | null;
    outputs: string[];
}

export const aiModelService = {
    generate: async (
        humanImage: File | string,
        clothesImages: File | string | (File | string)[],
        attributes?: any
    ): Promise<GenerateAIModelResponse> => {
        const formData = new FormData();

        // Handle human image
        if (typeof humanImage === 'string') {
            formData.append('inputImageHuman', humanImage);
        } else {
            formData.append('inputImageHuman', humanImage);
        }

        // Handle clothes images
        const clothesArray = Array.isArray(clothesImages) ? clothesImages : [clothesImages];
        clothesArray.forEach(img => {
            if (typeof img === 'string') {
                formData.append('inputImageClothes', img);
            } else {
                formData.append('inputImageClothes', img);
            }
        });

        // Handle attributes
        if (attributes) {
            formData.append('attributes', JSON.stringify(attributes));
        }

        const response = await fetch(`${API_URL}/ai-model/generate`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || 'Generation failed');
        }

        return response.json();
    },

    getStatus: async (taskId: string): Promise<AIModelStatusResponse> => {
        const response = await fetch(`${API_URL}/ai-model/status/${taskId}`);
        if (!response.ok) {
            throw new Error('Failed to get status');
        }
        return response.json();
    },

    pollUntilComplete: async (taskId: string, intervalMs = 1000, timeoutMs = 60000): Promise<string> => {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const status = await aiModelService.getStatus(taskId);
            console.log("Polling status:", status.status, "outputs:", status.outputs?.length || 0);

            // Check if we have outputs (success condition)
            if (status.outputs && status.outputs.length > 0) {
                console.log("Found output:", status.outputs[0]);
                return status.outputs[0];
            }

            // Check result field - must be a string URL, not boolean
            if (status.result && typeof status.result === 'string' && status.result.startsWith('http')) {
                console.log("Found result URL:", status.result);
                return status.result;
            }

            // Check for completion status
            if (status.status === 'task_postprocess_end') {
                if (status.result) return status.result;
                if (status.outputs && status.outputs.length > 0) return status.outputs[0];
            }

            if (status.status === 'failed' || status.status === 'error') {
                throw new Error('AI Generation failed on server side');
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        throw new Error('Generation timed out');
    },

    connectSocket: (token: string, onUpdate: (message: any) => void): WebSocket => {
        const ws = new WebSocket("wss://socket.wiro.ai/v1");

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "task_info", tasktoken: token }));
        };

        ws.onmessage = (evt) => {
            try {
                const msgJSON = JSON.parse(evt.data);
                onUpdate(msgJSON);
            } catch (e) {
                console.error('Socket parse error:', e, evt.data);
            }
        };

        return ws;
    },

    kill: async (taskId: string): Promise<any> => {
        const response = await fetch(`${API_URL}/ai-model/kill/${taskId}`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to kill task');
        return response.json();
    },

    cancel: async (taskId: string): Promise<any> => {
        const response = await fetch(`${API_URL}/ai-model/cancel/${taskId}`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to cancel task');
        return response.json();
    },

    animate: async (imageUrl: string, prompt?: string): Promise<GenerateAIModelResponse> => {
        const url = `${API_URL}/ai-model/animate`;
        console.log("Animate Request URL:", url, { imageUrl, prompt });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageUrl,
                prompt
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Animate Error Response:", { status: response.status, data: errorData });
            throw new Error(errorData.details || errorData.error || 'Animation start failed');
        }

        return response.json();
    }
};
