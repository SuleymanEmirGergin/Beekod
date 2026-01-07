import { logger } from "../logger.js";
import fs from "fs";
import path from "path";

const WIRO_API_URL = "https://api.wiro.ai/v1/Run/wiro/virtual-try-on";
const WIRO_TASK_URL = "https://api.wiro.ai/v1/Task/Detail";
const WIRO_API_KEY = process.env.WIRO_API_KEY;
const WIRO_IMAGE_TO_VIDEO_URL = "https://api.wiro.ai/v1/Run/minimax/image-to-video-hailuo-01-subject";

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
                if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
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
            throw new Error("Invalid base64 string");
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
                const blob = new Blob([buffer]);
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
 * Trigger a Virtual Try-On task on Wiro AI.
 */
export async function runVirtualTryOn(humanImage: string, clothesImages: string | string[]): Promise<any> {
    if (!WIRO_API_KEY) {
        throw new Error("WIRO_API_KEY is not configured");
    }

    try {
        const formData = new FormData();

        // Handle human image - FORCE DOWNLOAD (false)
        await processImageInput(formData, "inputImageHuman", humanImage, false);

        // Handle clothes images - FORCE DOWNLOAD (false)
        const clothesArray = Array.isArray(clothesImages) ? clothesImages : [clothesImages];
        for (const clothesImage of clothesArray) {
            await processImageInput(formData, "inputImageClothes", clothesImage, false);
        }

        // Add mandatory fields according to documentation
        formData.append("style", "virtual-try-on");
        formData.append("pose", "auto");
        formData.append("plan", "auto");
        formData.append("outputType", "both");

        logger.info("wiro.generate_start", { humanImageLength: humanImage.length, clothesCount: clothesArray.length });

        const response = await fetch(WIRO_API_URL, {
            method: "POST",
            headers: {
                "x-api-key": WIRO_API_KEY
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.api_response_error", { status: response.status, body: error });
            throw new Error(`Wiro AI API failed (${response.status}): ${error}`);
        }

        const result = await response.json();

        // Log full response for debugging
        logger.info("wiro.api_response", {
            hasErrors: !!(result.errors && result.errors.length > 0),
            hasToken: !!result.socketaccesstoken,
            hasTaskId: !!result.taskid,
            result: JSON.stringify(result).substring(0, 500)
        });

        // Check for errors in response even if HTTP status is OK
        if (result.errors && result.errors.length > 0) {
            const errorMessages = result.errors.map((e: any) => typeof e === 'string' ? e : e.message || JSON.stringify(e)).join(', ');
            logger.error("wiro.api_errors_in_response", { errors: result.errors, fullResult: result });
            throw new Error(`Wiro AI API returned errors: ${errorMessages}`);
        }

        if (!result.socketaccesstoken) {
            logger.error("wiro.missing_token", { result: JSON.stringify(result) });
            throw new Error("Wiro AI API did not return a valid token. Check API key and image inputs.");
        }

        logger.info("wiro.generate_success", { taskId: result.taskid, token: result.socketaccesstoken });

        return result;
    } catch (error) {
        logger.error("wiro.generate_error", { error });
        throw error;
    }
}

/**
 * Trigger an Image-to-Video task on Wiro AI using the hailuo-01-subject model.
 */
export async function runImageToVideo(inputImage: string, prompt: string): Promise<any> {
    if (!WIRO_API_KEY) {
        throw new Error("WIRO_API_KEY is not configured");
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
                "x-api-key": WIRO_API_KEY
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error("wiro.video_response_error", { status: response.status, body: error });
            throw new Error(`Wiro AI Image-to-Video failed: ${error}`);
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
        throw new Error("WIRO_API_KEY is not configured");
    }

    try {
        const response = await fetch(WIRO_TASK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": WIRO_API_KEY
            },
            body: JSON.stringify({
                tasktoken: taskToken
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Wiro AI Status API failed: ${error}`);
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
        throw new Error("WIRO_API_KEY is not configured");
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
            throw new Error(`Wiro AI Kill API failed: ${error}`);
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
        throw new Error("WIRO_API_KEY is not configured");
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
            throw new Error(`Wiro AI Cancel API failed: ${error}`);
        }

        return await response.json();
    } catch (error) {
        logger.error("wiro.cancel_error", { taskId, error });
        throw error;
    }
}
