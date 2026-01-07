/**
 * Safe localStorage Wrapper
 * Handles quota exceeded and serialization errors
 */

import { devLogger } from './devLogger';

class StorageWrapper {
    private readonly storage: Storage;
    private readonly prefix: string;

    constructor(storage: Storage = window.localStorage, prefix: string = 'beekod_') {
        this.storage = storage;
        this.prefix = prefix;
    }

    /**
     * Generates prefixed key
     */
    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    /**
     * Checks available storage quota
     */
    private async checkQuota(): Promise<{ available: number; used: number } | null> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    available: estimate.quota || 0,
                    used: estimate.usage || 0,
                };
            } catch (error) {
                devLogger.warning('Storage', 'Could not estimate quota', error);
            }
        }
        return null;
    }

    /**
     * Safely sets an item in storage
     */
    setItem<T>(key: string, value: T): boolean {
        const prefixedKey = this.getKey(key);

        try {
            const serialized = JSON.stringify(value);
            this.storage.setItem(prefixedKey, serialized);
            return true;
        } catch (error) {
            if (error instanceof Error) {
                // Handle quota exceeded error
                if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    devLogger.error(
                        'Storage Quota Exceeded',
                        `Failed to save ${key}. Storage is full.`,
                        error
                    );

                    // Try to free up space by removing old items
                    this.cleanup();

                    // Retry once
                    try {
                        const serialized = JSON.stringify(value);
                        this.storage.setItem(prefixedKey, serialized);
                        return true;
                    } catch (retryError) {
                        devLogger.error('Storage', 'Still failed after cleanup', retryError);
                        return false;
                    }
                }

                // Handle serialization errors
                devLogger.error(
                    'Storage Serialization Error',
                    `Failed to serialize ${key}`,
                    error
                );
            }
            return false;
        }
    }

    /**
     * Safely gets an item from storage
     */
    getItem<T>(key: string, defaultValue?: T): T | null {
        const prefixedKey = this.getKey(key);

        try {
            const item = this.storage.getItem(prefixedKey);

            if (item === null) {
                return defaultValue !== undefined ? defaultValue : null;
            }

            return JSON.parse(item) as T;
        } catch (error) {
            devLogger.error(
                'Storage Parse Error',
                `Failed to parse ${key}, returning default value`,
                error
            );

            // Remove corrupted item
            this.removeItem(key);

            return defaultValue !== undefined ? defaultValue : null;
        }
    }

    /**
     * Removes an item from storage
     */
    removeItem(key: string): boolean {
        const prefixedKey = this.getKey(key);

        try {
            this.storage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            devLogger.error('Storage', `Failed to remove ${key}`, error);
            return false;
        }
    }

    /**
     * Clears all items with this prefix
     */
    clear(): boolean {
        try {
            const keys = [];

            // Collect all keys with prefix
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }

            // Remove all prefixed keys
            keys.forEach((key) => this.storage.removeItem(key));

            devLogger.info('Storage', `Cleared ${keys.length} items`);
            return true;
        } catch (error) {
            devLogger.error('Storage', 'Failed to clear storage', error);
            return false;
        }
    }

    /**
     * Gets all keys with this prefix
     */
    keys(): string[] {
        const keys: string[] = [];

        try {
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    // Remove prefix before returning
                    keys.push(key.substring(this.prefix.length));
                }
            }
        } catch (error) {
            devLogger.error('Storage', 'Failed to get keys', error);
        }

        return keys;
    }

    /**
     * Checks if a key exists
     */
    hasItem(key: string): boolean {
        const prefixedKey = this.getKey(key);
        return this.storage.getItem(prefixedKey) !== null;
    }

    /**
     * Gets storage size estimate
     */
    async getSize(): Promise<number> {
        const quota = await this.checkQuota();
        return quota?.used || 0;
    }

    /**
     * Cleanup old or large items to free up space
     */
    private cleanup(): void {
        try {
            const keys = this.keys();

            // Remove items with "temp_" prefix first
            keys.filter(k => k.startsWith('temp_')).forEach(k => this.removeItem(k));

            // If still needed, remove oldest items (assuming timestamp in key or value)
            // This is a simple strategy, can be customized based on your needs

            devLogger.info('Storage', 'Cleanup performed');
        } catch (error) {
            devLogger.error('Storage', 'Cleanup failed', error);
        }
    }
}

// Export singleton instances
export const localStorage = new StorageWrapper(window.localStorage, 'beekod_');
export const sessionStorage = new StorageWrapper(window.sessionStorage, 'beekod_session_');

export default localStorage;
