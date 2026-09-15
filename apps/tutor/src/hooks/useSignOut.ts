import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { redirectAfterSignOut } from '../lib/authSession';

/** Clear Firebase session and navigate to the marketing landing page. */
export function useSignOut() {
    const logout = useAuthStore((s) => s.logout);

    return useCallback(async () => {
        await logout();
        redirectAfterSignOut();
    }, [logout]);
}
