/**
 * Utility function để merge className strings
 * Tương tự như clsx hoặc classnames
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
