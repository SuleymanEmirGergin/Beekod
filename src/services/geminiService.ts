import { logger } from "../logger.js";
import { InternalError } from "../errors/AppError.js";

// Wiro AI Configuration
const WIRO_API_KEY = process.env.WIRO_API_KEY;
const WIRO_CHAT_URL = "https://api.wiro.ai/v1/Run/google/gemini-3-flash";
const WIRO_TASK_DETAIL_URL = "https://api.wiro.ai/v1/Task/Detail";

/**
 * Poll Wiro task for result
 */
async function pollTaskForResult(
    taskToken: string,
    maxAttempts = 60,
    intervalMs = 1000
): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));

        try {
            const response = await fetch(WIRO_TASK_DETAIL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": WIRO_API_KEY || "",
                },
                body: JSON.stringify({ tasktoken: taskToken }),
            });

            if (!response.ok) {
                logger.warn("wiro.poll_failed", { attempt: i + 1, status: response.status });
                continue;
            }

            const data = await response.json();
            const task = data.tasklist?.[0];

            if (!task) continue;

            logger.debug("wiro.poll_status", { attempt: i + 1, status: task.status });

            if (task.status === "task_postprocess_end" || task.status === "task_end") {
                // Extract text from outputs or debugoutput
                if (task.debugoutput && task.debugoutput.trim()) {
                    return task.debugoutput;
                }
                if (task.outputs && task.outputs.length > 0) {
                    const output = task.outputs[0];
                    if (typeof output === "string") return output;
                    if (output.text) return output.text;
                    if (output.content) return output.content;
                    if (output.url) return `[Output URL: ${output.url}]`;
                    return JSON.stringify(output);
                }
                // For text models, the response might be in parameters or elsewhere
                if (task.parameters?.response) {
                    return task.parameters.response;
                }
                // Return empty if no text output found
                return "";
            }

            if (task.status === "task_error" || task.status === "task_failed" || task.status === "task_cancel") {
                throw new InternalError(`Wiro task failed: ${task.debugerror || task.status}`);
            }
        } catch (error) {
            if (error instanceof InternalError) throw error;
            logger.warn("wiro.poll_error", { attempt: i + 1, error });
        }
    }

    throw new InternalError("Wiro chat completion timed out");
}

/**
 * Chat completion options
 */
export interface ChatCompletionOptions {
    thinkingLevel?: "none" | "low" | "medium" | "high";
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    model?: string;
}

/**
 * Run chat completion using Wiro AI (Gemini 3 Flash)
 * 
 * @param prompt - The user prompt/message
 * @param options - Optional parameters (temperature, etc.)
 * @returns The AI response text
 */
export async function runChatCompletion(
    prompt: string,
    options: ChatCompletionOptions = {}
): Promise<string> {
    const {
        thinkingLevel = "low",
        temperature = 1,
        topP = 0.95,
        maxOutputTokens = 8192,
    } = options;

    if (!WIRO_API_KEY) {
        throw new InternalError("WIRO_API_KEY is not configured");
    }

    try {
        logger.info("wiro.chat.start", { 
            promptLength: prompt.length,
            temperature 
        });

        // Wiro uses multipart form data
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("thinkingLevel", thinkingLevel);
        formData.append("temperature", temperature.toString());
        formData.append("topP", topP.toString());
        formData.append("maxOutputTokens", maxOutputTokens.toString());

        const response = await fetch(WIRO_CHAT_URL, {
            method: "POST",
            headers: {
                "x-api-key": WIRO_API_KEY,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new InternalError(`Wiro API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Check for errors
        if (data.result === false || (data.errors && data.errors.length > 0)) {
            const errorMsg = data.errors?.[0]?.message || "Unknown error";
            throw new InternalError(`Wiro API error: ${errorMsg}`);
        }

        // Wiro returns a task token, we need to poll for result
        if (data.socketaccesstoken) {
            logger.info("wiro.chat.polling", { 
                taskid: data.taskid,
                token: data.socketaccesstoken.substring(0, 10) + "..." 
            });
            const result = await pollTaskForResult(data.socketaccesstoken);
            
            logger.info("wiro.chat.success", { responseLength: result.length });
            return result;
        }

        throw new InternalError("Unexpected Wiro response: no task token");

    } catch (error) {
        logger.error("wiro.chat.failed", { 
            error: String(error),
            promptLength: prompt.length 
        });
        throw error instanceof InternalError ? error : new InternalError(`Wiro chat failed: ${String(error)}`);
    }
}

/**
 * Convenience wrapper for quick chat with default options.
 */
export async function chat(prompt: string): Promise<string> {
    return runChatCompletion(prompt, {
        temperature: 1,
        maxOutputTokens: 4096,
    });
}

/**
 * Check if Wiro is configured
 */
export function isConfigured(): boolean {
    return !!WIRO_API_KEY;
}
