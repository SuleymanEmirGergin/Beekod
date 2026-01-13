/**
 * Wiro Provider
 *
 * Try-on, image-to-video, and chat operations backed by Wiro AI.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { logger } from "../../../logger.js";
import { redactSecrets } from "../../audit/redact.js";
import { InternalError, ValidationError } from "../../../errors/AppError.js";
const WIRO_API_URL = "https://api.wiro.ai/v1/Run/wiro/virtual-try-on";
const WIRO_TASK_URL = "https://api.wiro.ai/v1/Task/Detail";
const WIRO_TASK_KILL_URL = "https://api.wiro.ai/v1/Task/Kill";
const WIRO_TASK_CANCEL_URL = "https://api.wiro.ai/v1/Task/Cancel";
const WIRO_IMAGE_TO_VIDEO_URL = "https://api.wiro.ai/v1/Run/minimax/image-to-video-hailuo-01-subject";
const WIRO_CHAT_URL = "https://api.wiro.ai/v1/Run/google/gemini-2.0-flash";
const WIRO_FLUX_URL = "https://api.wiro.ai/v1/Run/wiro/flux-2-dev";
async function processImageInput(formData, fieldName, input, allowUrlString = false) {
    if (!input)
        return;
    if (input.startsWith("http")) {
        if (allowUrlString) {
            formData.append(fieldName, input);
            return;
        }
        const resp = await fetch(input);
        if (!resp.ok) {
            throw new InternalError(`Failed to fetch image: ${resp.statusText}`);
        }
        const blob = await resp.blob();
        const filename = path.basename(input.split("?")[0]) || "image.jpg";
        formData.append(fieldName, blob, filename);
        return;
    }
    if (input.startsWith("data:")) {
        const matches = input.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new ValidationError("Invalid base64 string");
        }
        const type = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const blob = new Blob([buffer], { type });
        formData.append(fieldName, blob, `upload.${type.split("/")[1]}`);
        return;
    }
    if (fs.existsSync(input)) {
        const buffer = fs.readFileSync(input);
        const ext = path.extname(input).toLowerCase();
        const type = ext === ".png" ? "image/png" : "image/jpeg";
        const blob = new Blob([buffer], { type });
        formData.append(fieldName, blob, path.basename(input));
        return;
    }
}
async function prepareImageForWiro(input) {
    if (!input)
        throw new ValidationError("Image input is required");
    if (input.startsWith("http") || input.startsWith("data:")) {
        return input;
    }
    if (fs.existsSync(input)) {
        const buffer = fs.readFileSync(input);
        const ext = path.extname(input).toLowerCase();
        const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
        const base64 = buffer.toString("base64");
        return `data:${mimeType};base64,${base64}`;
    }
    throw new ValidationError(`File not found: ${input}`);
}
export class WiroTryOnProvider {
    name = "wiro";
    apiKey;
    apiSecret;
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey || process.env.WIRO_API_KEY || "";
        this.apiSecret = apiSecret || process.env.WIRO_API_SECRET || "";
        if (!this.apiKey) {
            logger.warn("wiro.provider.no_api_key");
        }
    }
    getSignedHeaders(contentType) {
        const nonce = Math.floor(Date.now() / 1000).toString();
        const signature = crypto
            .createHmac("sha256", this.apiKey)
            .update(this.apiSecret + nonce)
            .digest("hex");
        const headers = {
            "x-api-key": this.apiKey,
            "x-nonce": nonce,
            "x-signature": signature,
        };
        if (contentType) {
            headers["Content-Type"] = contentType;
        }
        return headers;
    }
    getSimpleHeaders() {
        return {
            "x-api-key": this.apiKey,
        };
    }
    async createTryOnTask(humanImage, clothesImage, category) {
        if (!this.apiKey) {
            throw new InternalError("WIRO_API_KEY is not configured");
        }
        const humanImageReady = await prepareImageForWiro(humanImage);
        const clothesImageReady = await prepareImageForWiro(clothesImage);
        const response = await fetch(WIRO_API_URL, {
            method: "POST",
            headers: this.getSignedHeaders("application/json"),
            body: JSON.stringify({
                inputImageHuman: humanImageReady,
                inputImageClothes: clothesImageReady,
                category: category || "upper_body",
                style: "virtual-try-on",
                pose: "auto",
                plan: "auto",
                outputType: "both",
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.tryon.api_error", { status: response.status, error: redactSecrets(error) });
            throw new InternalError(`Wiro API failed (${response.status})`);
        }
        const result = await response.json();
        if (result.errors && result.errors.length > 0) {
            throw new InternalError(`Wiro errors: ${result.errors.join(", ")}`);
        }
        return result;
    }
    async tryOn(request, ctx) {
        const startTime = Date.now();
        try {
            logger.info("wiro.tryon.start", {
                hasProductImage: !!request.productImageUrl,
                hasModelImage: !!request.modelImageUrl,
                category: request.options?.category,
                requestId: ctx?.requestId,
            });
            const task = await this.createTryOnTask(request.modelImageUrl, request.productImageUrl, request.options?.category);
            const outputImageUrl = await this.pollForResult(task.socketaccesstoken);
            const latencyMs = Date.now() - startTime;
            return {
                outputImageUrl,
                taskId: task.taskid,
                meta: {
                    provider: this.name,
                    latencyMs,
                },
            };
        }
        catch (error) {
            logger.error("wiro.tryon.error", { error: redactSecrets(String(error)), requestId: ctx?.requestId });
            throw error;
        }
    }
    async pollForResult(taskToken, maxAttempts = 30, intervalMs = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
            try {
                const response = await fetch(WIRO_TASK_URL, {
                    method: "POST",
                    headers: this.getSignedHeaders("application/json"),
                    body: JSON.stringify({ tasktoken: taskToken }),
                });
                if (!response.ok)
                    continue;
                const result = await response.json();
                const task = result.tasklist?.[0];
                if (!task)
                    continue;
                if (task.status === "task_postprocess_end" || task.status === "task_end") {
                    if (task.outputs?.[0]?.url) {
                        return task.outputs[0].url;
                    }
                }
                if (["task_error", "task_failed", "task_cancel"].includes(task.status)) {
                    throw new InternalError(`Wiro task failed: ${task.debugerror || task.status}`);
                }
            }
            catch (error) {
                if (error instanceof InternalError)
                    throw error;
                logger.warn("wiro.tryon.poll_error", { attempt: i + 1, error: String(error) });
            }
        }
        throw new InternalError("Wiro try-on task timed out");
    }
    async createImageToVideoTask(inputImage, prompt) {
        if (!this.apiKey) {
            throw new InternalError("WIRO_API_KEY is not configured");
        }
        const formData = new FormData();
        await processImageInput(formData, "inputImageFirst", inputImage, false);
        formData.append("inputImageFirstUrl", "");
        formData.append("prompt", prompt);
        const response = await fetch(WIRO_IMAGE_TO_VIDEO_URL, {
            method: "POST",
            headers: this.getSignedHeaders(),
            body: formData,
        });
        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.video.api_error", { status: response.status, error: redactSecrets(error) });
            throw new InternalError(`Wiro video failed (${response.status})`);
        }
        const result = await response.json();
        if (result.errors && result.errors.length > 0) {
            throw new InternalError(`Wiro video errors: ${result.errors.join(", ")}`);
        }
        return result;
    }
    async getTaskDetail(taskToken) {
        const response = await fetch(WIRO_TASK_URL, {
            method: "POST",
            headers: this.getSignedHeaders("application/json"),
            body: JSON.stringify({ tasktoken: taskToken }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new InternalError(`Wiro task detail failed: ${error}`);
        }
        return response.json();
    }
    async killTask(taskId) {
        const response = await fetch(WIRO_TASK_KILL_URL, {
            method: "POST",
            headers: this.getSignedHeaders("application/json"),
            body: JSON.stringify({ taskid: taskId }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new InternalError(`Wiro kill failed: ${error}`);
        }
        return response.json();
    }
    async cancelTask(taskId) {
        const response = await fetch(WIRO_TASK_CANCEL_URL, {
            method: "POST",
            headers: this.getSignedHeaders("application/json"),
            body: JSON.stringify({ taskid: taskId }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new InternalError(`Wiro cancel failed: ${error}`);
        }
        return response.json();
    }
    async generateBaseModelWithFlux(prompt) {
        if (!this.apiKey) {
            throw new InternalError("WIRO_API_KEY is not configured");
        }
        const enhancedPrompt = "professional full body photo of a " +
            prompt +
            ", standing pose, white studio background, studio lighting, high quality, realistic";
        const formData = new FormData();
        formData.append("prompt", enhancedPrompt);
        formData.append("aspect_ratio", "9:16");
        formData.append("num_outputs", "1");
        formData.append("output_format", "png");
        const response = await fetch(WIRO_FLUX_URL, {
            method: "POST",
            headers: this.getSimpleHeaders(),
            body: formData,
        });
        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.flux.api_error", { status: response.status, error: redactSecrets(error) });
            throw new InternalError(`Wiro flux failed (${response.status})`);
        }
        const result = await response.json();
        if (result.errors && result.errors.length > 0) {
            throw new InternalError(`Wiro flux errors: ${result.errors.join(", ")}`);
        }
        return result;
    }
    async pollFluxTaskForImage(taskToken, maxAttempts = 30, intervalMs = 1000) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
            const response = await fetch(WIRO_TASK_URL, {
                method: "POST",
                headers: this.getSimpleHeaders(),
                body: JSON.stringify({ tasktoken: taskToken }),
            });
            if (!response.ok) {
                continue;
            }
            const result = await response.json();
            const task = result.tasklist?.[0];
            if (!task)
                continue;
            if (task.status === "task_postprocess_end" || task.status === "task_end") {
                const output = task.outputs?.[0];
                if (output?.url) {
                    return output.url;
                }
                throw new InternalError("Flux task completed but no output URL found");
            }
            if (["task_cancel", "task_error", "task_failed"].includes(task.status)) {
                throw new InternalError(`Flux task failed: ${task.debugerror || task.status}`);
            }
        }
        throw new InternalError("Flux task timed out");
    }
    async pollChatTask(taskToken, maxAttempts = 30, intervalMs = 1000) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
            const response = await fetch(WIRO_TASK_URL, {
                method: "POST",
                headers: this.getSimpleHeaders(),
                body: JSON.stringify({ tasktoken: taskToken }),
            });
            if (!response.ok) {
                continue;
            }
            const result = await response.json();
            const task = result.tasklist?.[0];
            if (!task)
                continue;
            if (task.status === "task_postprocess_end" || task.status === "task_end") {
                if (task.outputs && task.outputs.length > 0) {
                    const output = task.outputs[0];
                    if (output.contenttype?.includes("text") || output.name?.endsWith(".txt") || output.name?.endsWith(".md")) {
                        if (output.url) {
                            const textResp = await fetch(output.url);
                            if (textResp.ok) {
                                return await textResp.text();
                            }
                        }
                    }
                    if (task.debugoutput) {
                        return task.debugoutput;
                    }
                    return output.url || JSON.stringify(output);
                }
                if (task.debugoutput) {
                    return task.debugoutput;
                }
                return "Task completed but no output available.";
            }
            if (["task_cancel", "task_error", "task_failed"].includes(task.status)) {
                throw new InternalError(`Wiro chat task failed: ${task.debugerror || task.status}`);
            }
        }
        throw new InternalError("Wiro chat task timed out");
    }
    async runChatCompletion(prompt, options = {}) {
        if (!this.apiKey) {
            throw new InternalError("WIRO_API_KEY is not configured");
        }
        if (!prompt || !prompt.trim()) {
            throw new ValidationError("Prompt is required");
        }
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("thinkingLevel", options.thinkingLevel || "low");
        formData.append("temperature", String(options.temperature ?? 0.7));
        formData.append("topP", String(options.topP ?? 0.95));
        formData.append("maxOutputTokens", String(options.maxOutputTokens ?? 8192));
        const response = await fetch(WIRO_CHAT_URL, {
            method: "POST",
            headers: this.getSimpleHeaders(),
            body: formData,
        });
        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.chat.api_error", { status: response.status, error: redactSecrets(error) });
            throw new InternalError(`Wiro chat failed (${response.status})`);
        }
        const result = await response.json();
        if (result.errors && result.errors.length > 0) {
            throw new InternalError(`Wiro chat errors: ${result.errors.join(", ")}`);
        }
        if (!result.socketaccesstoken) {
            throw new InternalError("No task token received from Wiro chat");
        }
        return this.pollChatTask(result.socketaccesstoken);
    }
    async chat(prompt) {
        return this.runChatCompletion(prompt, {
            thinkingLevel: "low",
            temperature: 0.7,
            maxOutputTokens: 4096,
        });
    }
    async getTaskStatus(taskId) {
        try {
            const response = await fetch(WIRO_TASK_URL, {
                method: "POST",
                headers: this.getSignedHeaders("application/json"),
                body: JSON.stringify({ tasktoken: taskId }),
            });
            if (!response.ok) {
                return { status: "failed", error: "API request failed" };
            }
            const result = await response.json();
            const task = result.tasklist?.[0];
            if (!task) {
                return { status: "pending" };
            }
            const statusMap = {
                task_queue: "pending",
                task_start: "processing",
                task_postprocess_end: "completed",
                task_end: "completed",
                task_error: "failed",
                task_failed: "failed",
                task_cancel: "failed",
            };
            return {
                status: statusMap[task.status] || "processing",
                outputImageUrl: task.outputs?.[0]?.url,
                error: task.debugerror,
            };
        }
        catch (error) {
            return { status: "failed", error: String(error) };
        }
    }
}
let defaultProvider = null;
export function getWiroTryOnProvider() {
    if (!defaultProvider) {
        defaultProvider = new WiroTryOnProvider();
    }
    return defaultProvider;
}
