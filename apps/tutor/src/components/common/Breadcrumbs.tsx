import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import type { AppRole } from '@/types';
import { studentRoutes } from '@/utils/routes';

export interface BreadcrumbItem {
    label: string;
    path?: string;
    /** Optional state to pass when navigating (e.g. for deep-linking to a section) */
    state?: Record<string, unknown>;
    onClick?: () => void;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
    /** Role for unified theme breadcrumb: first segment becomes "Student" | "Teacher" | "Admin" */
    role?: AppRole | null;
    /** Role-specific home path (e.g. /student/dashboard, /teacher/dashboard) */
    homePath?: string;
}

const roleLabel: Record<AppRole, string> = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Admin',
};

/**
 * Accessible breadcrumb navigation; role-aware for Student > Curriculum > Grade > ...
 */
export default function Breadcrumbs({ items, className = '', role, homePath }: BreadcrumbsProps) {
    const homeTo = homePath ?? (role === 'student'
        ? studentRoutes.dashboard
        : role
            ? `/${role}/dashboard`
            : studentRoutes.dashboard);
    const firstLabel = role ? roleLabel[role] : 'Home';

    return (
        <nav
            aria-label="Breadcrumb"
            className={`flex items-center gap-2 text-sm ${className}`}
        >
            <ol className="flex items-center gap-2" itemScope itemType="https://schema.org/BreadcrumbList">
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                    <Link
                        to={homeTo}
                        className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
                        itemProp="item"
                        aria-label={firstLabel}
                    >
                        <Home className="w-4 h-4 shrink-0" />
                        <span itemProp="name">{firstLabel}</span>
                    </Link>
                    <meta itemProp="position" content="1" />
                </li>

                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const position = index + 2;

                    return (
                        <li
                            key={index}
                            itemProp="itemListElement"
                            itemScope
                            itemType="https://schema.org/ListItem"
                            className="flex items-center gap-2"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
                            {item.onClick ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        item.onClick!();
                                    }}
                                    className={`cursor-pointer ${isLast ? 'text-gray-800 dark:text-slate-100 font-medium' : 'text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors'}`}
                                    itemProp="name"
                                >
                                    {item.label}
                                </button>
                            ) : isLast || !item.path ? (
                                <span
                                    className={isLast ? 'text-gray-800 dark:text-slate-100 font-medium' : 'text-gray-500 dark:text-slate-400'}
                                    itemProp="name"
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.path ?? ''}
                                    state={item.state}
                                    className="text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
                                    itemProp="item"
                                >
                                    <span itemProp="name">{item.label}</span>
                                </Link>
                            )}
                            <meta itemProp="position" content={position.toString()} />
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
