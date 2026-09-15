import { LogOut } from 'lucide-react';
import { useSignOut } from '../../hooks/useSignOut';

type SignOutButtonProps = {
    className?: string;
    label?: string;
    showLabel?: boolean;
};

export default function SignOutButton({
    className = 'rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
    label = 'Sign out',
    showLabel = false,
}: SignOutButtonProps) {
    const signOut = useSignOut();

    return (
        <button
            type="button"
            onClick={() => void signOut()}
            className={className}
            aria-label={label}
            title={label}
        >
            <LogOut className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden />
            {showLabel ? <span className="ml-2 text-sm font-medium">{label}</span> : null}
        </button>
    );
}
