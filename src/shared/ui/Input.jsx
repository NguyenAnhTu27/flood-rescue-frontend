import React from 'react';
import { cn } from '../lib/cn.js';

/**
 * Input component với styling nhất quán
 * @param {Object} props
 * @param {string} props.className - Custom className
 * @param {boolean} props.error - Có lỗi hay không
 */
export default function Input({
    className = '',
    error = false,
    ...props
}) {
    const baseStyles = 'w-full rounded-lg border bg-white px-4 py-3 text-sm transition';
    const defaultStyles = 'border-slate-300 text-slate-900 placeholder:text-slate-400';
    const focusStyles = 'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
    const errorStyles = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : '';

    return (
        <input
            className={cn(baseStyles, defaultStyles, focusStyles, errorStyles, className)}
            {...props}
        />
    );
}
