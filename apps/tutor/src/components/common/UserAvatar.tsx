import { useEffect, useState } from 'react';
import type { User } from '../../types';

/**
 * Profile picture shared across the tutor app.
 *
 * Mirrors the landing page avatar: the Firebase `photoURL` (stored on `user.avatar`)
 * when available, otherwise the same initials fallback so both apps show the
 * identical identity for a signed-in user.
 */

export function displayNameForUser(user?: Pick<User, 'displayName' | 'name' | 'email'> | null): string {
    const display = user?.displayName?.trim();
    if (display) return display;
    const name = user?.name?.trim();
    if (name) return name;
    const emailLocal = user?.email?.split('@')[0]?.trim();
    if (emailLocal) return emailLocal;
    return 'Learner';
}

export function initialsForUser(user?: Pick<User, 'displayName' | 'name' | 'email'> | null): string {
    const name = displayNameForUser(user);
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

interface UserAvatarProps {
    user?: Pick<User, 'displayName' | 'name' | 'email' | 'avatar'> | null;
    /** Rendered pixel size of the circle. */
    size?: number;
    className?: string;
    /** Fallback circle background when there is no photo. */
    fallbackClassName?: string;
    fallbackStyle?: React.CSSProperties;
}

export function UserAvatar({
    user,
    size = 40,
    className = '',
    fallbackClassName = '',
    fallbackStyle,
}: UserAvatarProps) {
    const photo = user?.avatar?.trim() || '';
    const [failed, setFailed] = useState(false);

    // A new photo URL deserves a fresh attempt even if the previous one 404'd.
    useEffect(() => {
        setFailed(false);
    }, [photo]);

    const initials = initialsForUser(user);
    const showPhoto = Boolean(photo) && !failed;

    return (
        <span
            className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
            style={{ width: size, height: size }}
        >
            {showPhoto ? (
                <img
                    src={photo}
                    alt=""
                    width={size}
                    height={size}
                    // Google/Firebase CDN rejects requests that leak a referrer.
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span
                    className={`flex h-full w-full items-center justify-center font-semibold leading-none text-white ${fallbackClassName}`}
                    style={{ fontSize: Math.max(10, Math.round(size * 0.38)), ...fallbackStyle }}
                >
                    {initials}
                </span>
            )}
        </span>
    );
}

export default UserAvatar;
