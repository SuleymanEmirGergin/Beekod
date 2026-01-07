import { ISocialProvider, SocialPostPayload, SocialPostResult } from "./ISocialProvider.js";
import { logger } from "../../../logger.js";

export class TwitterProvider implements ISocialProvider {
    private simulate = true;

    getName(): string {
        return "Twitter";
    }

    async postContent(payload: SocialPostPayload): Promise<SocialPostResult> {
        logger.info("Twitter.postContent", { payload });

        if (this.simulate) {
            await new Promise(r => setTimeout(r, 1200));
            const fakeId = `TW_${Math.floor(Math.random() * 10000000)}`;
            return {
                success: true,
                postId: fakeId,
                platformId: fakeId,
                url: `https://twitter.com/user/status/${fakeId}`
            };
        }

        // TODO: Implement Twitter API v2 here
        return { success: false, error: "Real API not implemented" };
    }
}
