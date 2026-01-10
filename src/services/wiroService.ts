import { logger } from "../logger.js";
import { InternalError, ValidationError } from "../errors/AppError.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const WIRO_API_URL = "https://api.wiro.ai/v1/Run/wiro/virtual-try-on";
const WIRO_TASK_URL = "https://api.wiro.ai/v1/Task/Detail";
const WIRO_API_KEY = process.env.WIRO_API_KEY;
const WIRO_API_SECRET = process.env.WIRO_API_SECRET || "";
const WIRO_IMAGE_TO_VIDEO_URL = "https://api.wiro.ai/v1/Run/minimax/image-to-video-hailuo-01-subject";
const WIRO_CHAT_URL = "https://api.wiro.ai/v1/Run/google/gemini-2.0-flash";
const WIRO_FLUX_URL = "https://api.wiro.ai/v1/Run/wiro/flux-2-dev";

/**
 * Simple headers for Wiro AI (API Key only - for chat endpoints)
 */
function getSimpleWiroHeaders() {
    if (!WIRO_API_KEY) {
        logger.warn("wiro.auth.missing_key");
    }
    return {
        "x-api-key": WIRO_API_KEY || ""
    };
}

/**
 * Helper to generate Wiro AI authentication headers (Signature & Nonce)
 */
function getWiroHeaders() {
    if (!WIRO_API_KEY || !WIRO_API_SECRET) {
        logger.warn("wiro.auth.missing_keys", { hasKey: !!WIRO_API_KEY, hasSecret: !!WIRO_API_SECRET });
    }

    const nonce = Math.floor(Date.now() / 1000).toString();
    // Formula: HMAC-SHA256(apiSecret + nonce, key=apiKey)
    const signature = crypto
        .createHmac("sha256", WIRO_API_KEY || "")
        .update(WIRO_API_SECRET + nonce)
        .digest("hex");

    return {
        "x-api-key": WIRO_API_KEY || "",
        "x-nonce": nonce,
        "x-signature": signature
    };
}

/**
 * Helper to process image inputs (URL, File Path, or Base64 Data URI)
 * If allowUrlString is true, it passes the URL string directly.
 * Otherwise, it downloads the URL and appends it as a file/blob (safer for endpoints expecting files).
 */
async function processImageInput(formData: FormData, fieldName: string, input: string, allowUrlString = false) {
    if (!input) return;

    if (input.startsWith("http")) {
        if (allowUrlString) {
            logger.info(`wiro.input.url_pass`, { fieldName, url: input });
            formData.append(fieldName, input);
        } else {
            // Download and append as blob
            logger.info(`wiro.input.url_download`, { fieldName, url: input });
            try {
                const resp = await fetch(input);
                if (!resp.ok) throw new InternalError(`Failed to fetch image: ${resp.statusText}`);
                const blob = await resp.blob();
                // Guess filename from URL or default
                const filename = path.basename(input.split('?')[0]) || "image.jpg";
                formData.append(fieldName, blob, filename);
            } catch (e) {
                logger.error(`wiro.input.download_error`, { input, error: e });
                throw e;
            }
        }
    } else if (input.startsWith("data:")) {
        // It's a Base64 Data URI
        // data:image/png;base64,....
        logger.info(`wiro.input.base64`, { fieldName });
        const matches = input.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new ValidationError("Invalid base64 string");
        }
        const type = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const blob = new Blob([buffer], { type });
        formData.append(fieldName, blob, `upload.${type.split("/")[1]}`);
    } else {
        // It's a local file path
        logger.info(`wiro.input.file`, { fieldName, path: input });
        try {
            if (fs.existsSync(input)) {
                const buffer = fs.readFileSync(input);
                const ext = path.extname(input).toLowerCase();
                const type = ext === ".png" ? "image/png" : "image/jpeg";
                const blob = new Blob([buffer], { type });
                formData.append(fieldName, blob, path.basename(input));
            } else {
                logger.warn(`wiro.input.file_not_found`, { path: input });
            }
        } catch (e) {
            logger.error(`wiro.input.file_error`, { input, error: e });
            throw e;
        }
    }
}

/**
 * Helper to convert a local file path or URL to a usable input for Wiro AI.
 * Returns URL as-is, or converts local file to base64 data URI.
 */
async function prepareImageForWiro(input: string): Promise<string> {
    if (!input) throw new ValidationError("Image input is required");

    // If it's already a URL, return as-is
    if (input.startsWith("http")) {
        return input;
    }

    // If it's already a data URI, return as-is
    if (input.startsWith("data:")) {
        return input;
    }

    // It's a local file path - convert to base64 data URI
    if (fs.existsSync(input)) {
        const buffer = fs.readFileSync(input);
        const ext = path.extname(input).toLowerCase();
        const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
        const base64 = buffer.toString("base64");
        logger.info("wiro.prepare.file_to_base64", { path: input, size: buffer.length });
        return `data:${mimeType};base64,${base64}`;
    } else {
        throw new ValidationError(`File not found: ${input}`);
    }
}

/**
 * Trigger a Virtual Try-On task on Wiro AI via JSON payload (Stable 200 OK version).
 * Supports: URLs, local file paths (auto-converted to base64), and data URIs.
 */
export async function runVirtualTryOn(humanImage: string, clothesImages: string | string[], category?: string): Promise<any> {
    if (!WIRO_API_KEY) {
        throw new InternalError("WIRO_API_KEY is not configured");
    }

    try {
        const clothesArray = Array.isArray(clothesImages) ? clothesImages : [clothesImages];

        // Prepare images (convert local files to base64 if needed)
        const humanImageReady = await prepareImageForWiro(humanImage);
        const clothesImageReady = await prepareImageForWiro(clothesArray[0]);

        logger.info("wiro.generate_start_json", {
            humanType: humanImageReady.startsWith("data:") ? "base64" : "url",
            clothesType: clothesImageReady.startsWith("data:") ? "base64" : "url",
            category: category || "upper_body"
        });

        const response = await fetch(WIRO_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getWiroHeaders()
            },
            body: JSON.stringify({
                inputImageHuman: humanImageReady,
                inputImageClothes: clothesImageReady,
                category: category || "upper_body", // Default to upper_body
                style: "virtual-try-on",
                pose: "auto",
                plan: "auto",
                outputType: "both"
            })
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.api_response_error", { status: response.status, body: error });
            throw new InternalError(`Wiro AI API failed (${response.status}): ${error}`);
        }

        const result = await response.json();

        // Log response
        logger.info("wiro.api_response", {
            taskId: result.taskid,
            hasToken: !!result.socketaccesstoken
        });

        if (result.errors && result.errors.length > 0) {
            throw new InternalError(`Wiro AI Errors: ${result.errors.join(", ")}`);
        }

        return result;
    } catch (error) {
        logger.error("wiro.generate_error", { error });
        throw error;
    }
}

/**
 * Generate a realistic human model using FLUX.2-dev text-to-image.
 * This replaces Replicate for model generation, keeping everything in Wiro AI.
 * @param prompt - Detailed description of the model to generate
 * @returns Task info with socketaccesstoken for polling
 */
export async function generateBaseModelWithFlux(prompt: string): Promise<any> {
    if (!WIRO_API_KEY) {
        throw new InternalError("WIRO_API_KEY is not configured");
    }

    try {
        logger.info("wiro.flux.generate_start", { promptLength: prompt.length });

        // Build the enhanced prompt for realistic human model generation
        const enhancedPrompt = `professional full body photo of a ${prompt}, standing pose, white studio background, professional studio lighting, high quality, 8k, realistic, fashion photography, clean background`;

        const formData = new FormData();
        formData.append("prompt", enhancedPrompt);
        formData.append("aspect_ratio", "9:16"); // Portrait orientation for full body
        formData.append("num_outputs", "1");
        formData.append("output_format", "png");

        const response = await fetch(WIRO_FLUX_URL, {
            method: "POST",
            headers: getSimpleWiroHeaders(),
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.flux.api_error", { status: response.status, body: error });
            throw new InternalError(`Wiro AI FLUX API failed (${response.status}): ${error}`);
        }

        const result = await response.json();

        logger.info("wiro.flux.task_created", {
            taskId: result.taskid,
            hasToken: !!result.socketaccesstoken
        });

        if (result.errors && result.errors.length > 0) {
            throw new InternalError(`Wiro AI FLUX Errors: ${result.errors.join(", ")}`);
        }

        return result;
    } catch (error) {
        logger.error("wiro.flux.generate_error", { error });
        throw error;
    }
}

/**
 * Poll FLUX task until complete and return the generated image URL.
 * @param taskToken - The socketaccesstoken from generateBaseModelWithFlux
 * @returns URL of the generated image
 */
export async function pollFluxTaskForImage(taskToken: string, maxAttempts = 30, intervalMs = 1000): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));

        try {
            const response = await fetch(WIRO_TASK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getSimpleWiroHeaders()
                },
                body: JSON.stringify({ tasktoken: taskToken })
            });

            if (!response.ok) {
                logger.warn("wiro.flux.poll_error", { attempt: i + 1, status: response.status });
                continue;
            }

            const result = await response.json();

            if (!result.tasklist || result.tasklist.length === 0) {
                continue;
            }

            const task = result.tasklist[0];
            const status = task.status;

            logger.debug("wiro.flux.poll_status", { attempt: i + 1, status });

            if (status === "task_postprocess_end" || status === "task_end") {
                if (task.outputs && task.outputs.length > 0) {
                    const output = task.outputs[0];
                    if (output.url) {
                        logger.info("wiro.flux.complete", { url: output.url });
                        return output.url;
                    }
                }
                throw new InternalError("FLUX task completed but no output URL found");
            }

            if (status === "task_cancel" || status === "task_error" || status === "task_failed") {
                throw new InternalError(`FLUX task failed: ${task.debugerror || status}`);
            }

        } catch (error) {
            if (error instanceof InternalError) throw error;
            logger.warn("wiro.flux.poll_exception", { attempt: i + 1, error });
        }
    }

    throw new InternalError("FLUX task timed out");
}

/**
 * Trigger an Image-to-Video task on Wiro AI using the hailuo-01-subject model.
 */
export async function runImageToVideo(inputImage: string, prompt: string): Promise<any> {
    if (!WIRO_API_KEY) {
        throw new InternalError("WIRO_API_KEY is not configured");
    }

    try {
        const formData = new FormData();

        // Handle input image
        // Always process/download the image and send as file for reliability
        // blocked by Wiro servers or other access issues.
        await processImageInput(formData, "inputImageFirst", inputImage, false);
        // Pass empty URL field as fallback/requirement if needed by API validation
        formData.append("inputImageFirstUrl", "");

        formData.append("prompt", prompt);

        logger.info("wiro.image_to_video_start", { inputImageLength: inputImage.length, promptLength: prompt.length });

        const response = await fetch(WIRO_IMAGE_TO_VIDEO_URL, {
            method: "POST",
            headers: {
                ...getWiroHeaders()
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.video_response_error", { status: response.status, body: error });
            throw new InternalError(`Wiro AI Image-to-Video failed: ${error}`);
        }

        const result = await response.json();
        logger.info("wiro.image_to_video_success", { taskId: result.taskid, token: result.socketaccesstoken });

        return result;
    } catch (error) {
        logger.error("wiro.image_to_video_error", { error });
        throw error;
    }
}

/**
 * Get details/result of a Wiro AI task using the socketaccesstoken as tasktoken.
 */
export async function getTaskDetail(taskToken: string): Promise<any> {
    if (!WIRO_API_KEY) {
        throw new InternalError("WIRO_API_KEY is not configured");
    }

    try {
        const response = await fetch(WIRO_TASK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getWiroHeaders()
            },
            body: JSON.stringify({
                tasktoken: taskToken
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new InternalError(`Wiro AI Status API failed: ${error}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        logger.error("wiro.status_error", { taskToken, error });
        throw error;
    }
}

/**
 * Kill a running task on Wiro AI.
 */
export async function killTask(taskId: string): Promise<any> {
    if (!WIRO_API_KEY) {
        throw new InternalError("WIRO_API_KEY is not configured");
    }

    try {
        const response = await fetch("https://api.wiro.ai/v1/Task/Kill", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": WIRO_API_KEY
            },
            body: JSON.stringify({
                taskid: taskId
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new InternalError(`Wiro AI Kill API failed: ${error}`);
        }

        return await response.json();
    } catch (error) {
        logger.error("wiro.kill_error", { taskId, error });
        throw error;
    }
}

/**
 * Cancel a queued task on Wiro AI.
 */
export async function cancelTask(taskId: string): Promise<any> {
    if (!WIRO_API_KEY) {
        throw new InternalError("WIRO_API_KEY is not configured");
    }

    try {
        const response = await fetch("https://api.wiro.ai/v1/Task/Cancel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": WIRO_API_KEY
            },
            body: JSON.stringify({
                taskid: taskId
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new InternalError(`Wiro AI Cancel API failed: ${error}`);
        }

        return await response.json();
    } catch (error) {
        logger.error("wiro.cancel_error", { taskId, error });
        throw error;
    }
}

// ============================================================
// CHAT COMPLETION (Gemini 3 Flash via Wiro AI)
// ============================================================

interface WiroChatOptions {
    thinkingLevel?: "none" | "low" | "medium" | "high";
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
}

/**
 * Poll a Wiro AI task until completion and extract text output.
 * @param taskToken - The socketaccesstoken from task creation
 * @param maxAttempts - Maximum polling attempts (default 30)
 * @param intervalMs - Interval between polls in ms (default 2000)
 */
async function pollTaskForResult(taskToken: string, maxAttempts = 30, intervalMs = 1000): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));

        try {
            const response = await fetch(WIRO_TASK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getSimpleWiroHeaders()
                },
                body: JSON.stringify({ tasktoken: taskToken })
            });

            if (!response.ok) {
                logger.warn("wiro.chat.poll_error", { attempt: i + 1, status: response.status });
                continue;
            }

            const result = await response.json();

            if (!result.tasklist || result.tasklist.length === 0) {
                continue;
            }

            const task = result.tasklist[0];
            const status = task.status;

            logger.debug("wiro.chat.poll_status", { attempt: i + 1, status });

            // Check for completion statuses
            if (status === "task_postprocess_end" || status === "task_end") {
                // Extract text output from outputs array
                if (task.outputs && task.outputs.length > 0) {
                    // For chat, output is typically in first output's content or we need to fetch
                    const output = task.outputs[0];

                    // If it's a text file, fetch its content
                    if (output.contenttype?.includes("text") || output.name?.endsWith(".txt") || output.name?.endsWith(".md")) {
                        if (output.url) {
                            const textResp = await fetch(output.url);
                            if (textResp.ok) {
                                return await textResp.text();
                            }
                        }
                    }

                    // Try to get from debugoutput field
                    if (task.debugoutput) {
                        return task.debugoutput;
                    }

                    // Return the output URL or content as fallback
                    return output.url || JSON.stringify(output);
                }

                // Check debugoutput for text response
                if (task.debugoutput) {
                    return task.debugoutput;
                }

                return "İşlem tamamlandı ancak çıktı alınamadı.";
            }

            // Check for error/cancel statuses
            if (status === "task_cancel" || status === "task_error" || status === "task_failed") {
                throw new InternalError(`Wiro AI task failed: ${task.debugerror || status}`);
            }

        } catch (error) {
            if (error instanceof InternalError) throw error;
            logger.warn("wiro.chat.poll_exception", { attempt: i + 1, error });
        }
    }

    throw new InternalError("Wiro AI chat task timed out");
}

/**
 * Run chat completion using Wiro AI's Gemini 3 Flash model.
 * This is an async task-based API, so it triggers a task and polls for result.
 * 
 * @param prompt - The user prompt/message
 * @param options - Optional parameters (thinkingLevel, temperature, etc.)
 * @returns The AI response text
 */
export async function runChatCompletion(prompt: string, options: WiroChatOptions = {}): Promise<string> {
    if (!WIRO_API_KEY) {
        throw new InternalError("WIRO_API_KEY is not configured");
    }

    if (!prompt || !prompt.trim()) {
        throw new ValidationError("Prompt is required");
    }

    try {
        logger.info("wiro.chat.start", { promptLength: prompt.length, options });

        // Build form data
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("thinkingLevel", options.thinkingLevel || "low");
        formData.append("temperature", String(options.temperature ?? 0.7));
        formData.append("topP", String(options.topP ?? 0.95));
        formData.append("maxOutputTokens", String(options.maxOutputTokens ?? 8192));

        // Make the API call
        const response = await fetch(WIRO_CHAT_URL, {
            method: "POST",
            headers: getSimpleWiroHeaders(),
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.chat.api_error", { status: response.status, body: error });
            throw new InternalError(`Wiro AI Chat API failed (${response.status}): ${error}`);
        }

        const result = await response.json();

        logger.info("wiro.chat.task_created", {
            taskId: result.taskid,
            hasToken: !!result.socketaccesstoken
        });

        if (result.errors && result.errors.length > 0) {
            throw new InternalError(`Wiro AI Chat Errors: ${result.errors.join(", ")}`);
        }

        if (!result.socketaccesstoken) {
            throw new InternalError("No task token received from Wiro AI");
        }

        // Poll for result
        const chatResponse = await pollTaskForResult(result.socketaccesstoken);

        logger.info("wiro.chat.complete", { responseLength: chatResponse.length });

        return chatResponse;

    } catch (error) {
        logger.error("wiro.chat.error", { error });
        throw error;
    }
}

/**
 * Convenience wrapper for quick chat with default options.
 */
export async function chat(prompt: string): Promise<string> {
    return runChatCompletion(prompt, {
        thinkingLevel: "low",
        temperature: 0.7,
        maxOutputTokens: 4096
    });
}

