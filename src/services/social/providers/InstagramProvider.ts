import { ISocialProvider, SocialPostPayload, SocialPostResult } from "./ISocialProvider.js";
import { logger } from "../../../logger.js";

export class InstagramProvider implements ISocialProvider {
    private simulate = true;

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

        // TODO: Implement Real Graph API here
        // 1. Upload media to container
        // 2. Publish container
        return { success: false, error: "Real API not implemented" };
    }
}
