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
    const baseStyles = 'inline-flex items-center gap-1 font-semibold tracking-[0.02em] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-colors duration-150';

    const variants = {
        default: outline
            ? 'border border-slate-200 bg-white/85 text-slate-700'
            : 'bg-slate-100 text-slate-700',
        success: outline
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'bg-emerald-100 text-emerald-700',
        warning: outline
            ? 'border border-amber-200 bg-amber-50 text-amber-700'
            : 'bg-amber-100 text-amber-700',
        error: outline
            ? 'border border-red-200 bg-red-50 text-red-700'
            : 'bg-red-100 text-red-700',
        info: outline
            ? 'border border-blue-200 bg-blue-50 text-blue-700'
            : 'bg-blue-50 text-blue-700',
        primary: outline
            ? 'border border-rescue-200 bg-rescue-50 text-rescue-700'
            : 'bg-rescue-600 text-white',
    };

    const sizes = {
        sm: 'rounded-[10px] px-2 py-0.5 text-[10px]',
        md: 'rounded-xl px-2.5 py-1 text-xs',
        lg: 'rounded-xl px-3 py-1 text-xs',
    };

    const variantStyles = variants[variant] || variants.default;
    const sizeStyles = sizes[size] || sizes.md;

    return (
        <span className={cn(baseStyles, variantStyles, sizeStyles, className)} {...props}>
            {children}
        </span>
    );
}
