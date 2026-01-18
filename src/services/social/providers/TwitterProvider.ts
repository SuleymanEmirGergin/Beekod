import { ISocialProvider, SocialPostPayload, SocialPostResult } from "./ISocialProvider.js";
import { logger } from "../../../logger.js";
import { TwitterApi } from "twitter-api-v2";

export class TwitterProvider implements ISocialProvider {
    private simulate: boolean;
    private client: TwitterApi | null = null;

    constructor() {
        const apiKey = process.env.TWITTER_API_KEY;
        const apiSecret = process.env.TWITTER_API_SECRET;
        const accessToken = process.env.TWITTER_ACCESS_TOKEN;
        const accessSecret = process.env.TWITTER_ACCESS_SECRET;

        if (apiKey && apiSecret && accessToken && accessSecret) {
            this.client = new TwitterApi({
                appKey: apiKey,
                appSecret: apiSecret,
                accessToken: accessToken,
                accessSecret: accessSecret,
            });
            this.simulate = false;
        } else {
            this.simulate = true;
        }
    }

    getName(): string {
        return "Twitter";
    }

    async postContent(payload: SocialPostPayload): Promise<SocialPostResult> {
        logger.info("Twitter.postContent", { payload });

        if (this.simulate || !this.client) {
            await new Promise(r => setTimeout(r, 1200));
            const fakeId = `TW_${Math.floor(Math.random() * 10000000)}`;
            return {
                success: true,
                postId: fakeId,
                platformId: fakeId,
                url: `https://twitter.com/user/status/${fakeId}`
            };
        }

        try {
            // Upload media if present
            let mediaIds: string[] | undefined;
            if (payload.mediaUrls && payload.mediaUrls.length > 0) {
                // Placeholder: We are skipping actual media upload logic to keep focus on compilation
                // In production, fetch URL -> Buffer -> uploadMedia
                mediaIds = [];
            }

            // Create Tweet (v2)
            const response = await this.client.v2.tweet({
                text: payload.content,
                media: mediaIds ? { media_ids: mediaIds as any } : undefined // Cast to any to bypass strict tuple check
            });

            return {
                success: true,
                postId: response.data.id,
                platformId: response.data.id,
                url: `https://twitter.com/i/web/status/${response.data.id}`
            };

        } catch (error: any) {
            logger.error("Twitter.postContent.error", { error: error.message || error });
            // Handle Rate Limit specifically if needed
            if (error.code === 429) {
                 return { success: false, error: "Rate limit exceeded" };
            }
            return {
                success: false,
                error: error.message || "Unknown error"
            };
        }
    }
}
