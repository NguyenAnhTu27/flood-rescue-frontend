import React from 'react';
import { cn } from '../lib/cn.js';

/**
 * Badge component cho status indicators và labels
 * @param {Object} props
 * @param {string} props.variant - 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {boolean} props.outline - Có border hay không
 * @param {React.ReactNode} props.children - Nội dung badge
 * @param {string} props.className - Custom className
 */
export default function Badge({
    variant = 'default',
    size = 'md',
    outline = false,
    className = '',
    children,
    ...props
}) {
    const baseStyles = 'inline-flex items-center gap-1 font-medium';

    const variants = {
        default: outline
            ? 'bg-slate-50 text-slate-700 border border-slate-200'
            : 'bg-slate-100 text-slate-700',
        success: outline
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-green-100 text-green-700',
        warning: outline
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            : 'bg-yellow-100 text-yellow-700',
        error: outline
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-red-100 text-red-700',
        info: outline
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-blue-50 text-blue-700',
        primary: outline
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-blue-600 text-white',
    };

    const sizes = {
        sm: 'rounded-full px-2 py-0.5 text-[10px]',
        md: 'rounded-full px-2.5 py-1 text-xs',
        lg: 'rounded-full px-3 py-1 text-xs',
    };

    const variantStyles = variants[variant] || variants.default;
    const sizeStyles = sizes[size] || sizes.md;

    return (
        <span className={cn(baseStyles, variantStyles, sizeStyles, className)} {...props}>
            {children}
        </span>
    );
}
