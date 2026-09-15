import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        const resetScroll = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.getElementById('main-content')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        };

        // Immediately for the new route, plus one delayed pass to catch
        // lazy-loaded (Suspense) content that mounts right after navigation.
        resetScroll();
        const timeoutId = setTimeout(() => {
            resetScroll();
            document
                .querySelectorAll('.overflow-y-auto, .custom-scrollbar')
                .forEach(container => container.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
        }, 150);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    return null;
}
