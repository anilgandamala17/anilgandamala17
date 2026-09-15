/**
 * Performance utilities for monitoring and optimization
 */

/**
 * Debounce function to limit function calls
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function calls
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
    name: string,
    fn: () => Promise<T> | T
): Promise<T> {
    const start = performance.now();
    try {
        const result = await fn();
        const end = performance.now();
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
        }
        return result;
    } catch (error) {
        const end = performance.now();
        if (process.env.NODE_ENV === 'development') {
            console.error(`[Performance] ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
        }
        throw error;
    }
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImage(img: HTMLImageElement, src: string) {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    img.src = src;
                    observer.unobserve(img);
                }
            });
        });

        observer.observe(img);
    } else {
        // Fallback for browsers without IntersectionObserver
        img.src = src;
    }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
}
