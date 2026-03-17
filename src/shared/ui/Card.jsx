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
    const baseStyles = 'text-ink-900 transition-[transform,box-shadow,border-color,background-color] duration-200';

    const variants = {
        default: 'ui-surface',
        outlined: 'rounded-[22px] border border-slate-200/80 bg-white/85',
        elevated: 'glass-card',
        flat: 'rounded-[20px] bg-transparent',
    };

    const variantStyles = variants[variant] || variants.default;

    return (
        <div className={cn(baseStyles, variantStyles, className)} {...props}>
            {children}
        </div>
    );
}
