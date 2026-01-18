export interface SocialPostPayload {
    content: string;
    mediaUrls?: string[]; // Changed to array
    hashtags?: string[];
}

export interface SocialPostResult {
    success: boolean;
    postId?: string;
    platformId?: string; // ID returned by the platform
    error?: string;
    url?: string; // URL to the public post
}

export interface ISocialProvider {
    /**
     * Post content to the social platform
     */
    postContent(payload: SocialPostPayload): Promise<SocialPostResult>;

    /**
     * Get provider name
     */
    getName(): string;
}
