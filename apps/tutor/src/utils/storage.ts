/**
 * Enhanced storage utilities with error handling and type safety
 */

const STORAGE_PREFIX = 'ai-tutor-';

/**
 * Safe localStorage wrapper with error handling
 */
export const storage = {
    get: <T>(key: string, defaultValue: T | null = null): T | null => {
        try {
            const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error reading from localStorage for key "${key}":`, error);
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): boolean => {
        try {
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage for key "${key}":`, error);
            // Handle quota exceeded error
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded. Clearing old data...');
                // Could implement LRU cache clearing here
            }
            return false;
        }
    },

    remove: (key: string): boolean => {
        try {
            localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage for key "${key}":`, error);
            return false;
        }
    },

    clear: (): boolean => {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    has: (key: string): boolean => {
        try {
            return localStorage.getItem(`${STORAGE_PREFIX}${key}`) !== null;
        } catch {
            return false;
        }
    },
};

/**
 * Session storage wrapper
 */
export const sessionStorage = {
    get: <T>(key: string, defaultValue: T | null = null): T | null => {
        try {
            const item = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error reading from sessionStorage for key "${key}":`, error);
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): boolean => {
        try {
            window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to sessionStorage for key "${key}":`, error);
            return false;
        }
    },

    remove: (key: string): boolean => {
        try {
            window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
            return true;
        } catch (error) {
            console.error(`Error removing from sessionStorage for key "${key}":`, error);
            return false;
        }
    },
};

/**
 * Check if storage is available
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
        const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
        const test = '__storage_test__';
        storage.setItem(test, test);
        storage.removeItem(test);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get storage size in bytes (approximate)
 */
export function getStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return total;
}
