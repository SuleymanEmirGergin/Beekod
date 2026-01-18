import { ISocialProvider, SocialPostPayload, SocialPostResult } from "./ISocialProvider.js";
import { logger } from "../../../logger.js";
import axios from "axios";

export class InstagramProvider implements ISocialProvider {
    private simulate = process.env.NODE_ENV !== 'production' && !process.env.INSTAGRAM_ACCESS_TOKEN;
    private accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    private accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    private apiBase = "https://graph.facebook.com/v19.0";

    getName(): string {
        return "Instagram";
    }

    async postContent(payload: SocialPostPayload): Promise<SocialPostResult> {
        logger.info("Instagram.postContent", { payload });

        if (this.simulate) {
            await new Promise(r => setTimeout(r, 2000));
            const fakeId = `IG_${Math.floor(Math.random() * 10000000)}`;
            return {
                success: true,
                postId: fakeId,
                platformId: fakeId,
                url: `https://instagram.com/p/${fakeId}`
            };
        }

        if (!this.accessToken || !this.accountId) {
            return { success: false, error: "Instagram credentials not configured" };
        }

        try {
            // 1. Create Media Container
            const containerRes = await axios.post(`${this.apiBase}/${this.accountId}/media`, null, {
                params: {
                    image_url: payload.mediaUrls?.[0], // Only single image for now
                    caption: payload.content,
                    access_token: this.accessToken
                }
            });

            if (!containerRes.data.id) {
                throw new Error("Failed to create media container");
            }

            const creationId = containerRes.data.id;

            // 2. Publish Media
            const publishRes = await axios.post(`${this.apiBase}/${this.accountId}/media_publish`, null, {
                params: {
                    creation_id: creationId,
                    access_token: this.accessToken
                }
            });

            if (!publishRes.data.id) {
                throw new Error("Failed to publish media");
            }

            return {
                success: true,
                postId: publishRes.data.id,
                platformId: publishRes.data.id,
                url: `https://instagram.com/p/${publishRes.data.id}` // URL is guessable or retrievable via permalink field
            };

        } catch (error: any) {
            logger.error("Instagram.postContent.error", { error: error.response?.data || error.message });
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }
}
