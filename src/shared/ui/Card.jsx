import React from 'react';
import { cn } from '../lib/cn.js';

/**
 * Card component cho container
 * @param {Object} props
 * @param {string} props.variant - 'default' | 'outlined' | 'elevated' | 'flat'
 * @param {React.ReactNode} props.children - Nội dung card
 * @param {string} props.className - Custom className
 */
export default function Card({
    variant = 'default',
    className = '',
    children,
    ...props
}) {
    const baseStyles = 'bg-white';

    const variants = {
        default: 'rounded-xl border border-slate-200 shadow-sm',
        outlined: 'rounded-xl border border-slate-200',
        elevated: 'rounded-xl border border-slate-200 shadow-md',
        flat: 'rounded-xl',
    };

    const variantStyles = variants[variant] || variants.default;

    return (
        <div className={cn(baseStyles, variantStyles, className)} {...props}>
            {children}
        </div>
    );
}
