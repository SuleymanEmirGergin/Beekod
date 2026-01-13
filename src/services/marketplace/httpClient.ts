import { logger } from "../../logger.js";

export async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("marketplace.http_request_failed", {
        url,
        status: response.status,
        error: errorText,
      });
      throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    logger.error("marketplace.http_request_exception", { url, error });
    throw error;
  }
}
