import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn.js';

/**
 * Button component với các variants phổ biến
 * @param {Object} props
 * @param {string} props.variant - 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {boolean} props.fullWidth - Chiếm full width
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.to - Nếu có, render như Link thay vì button
 * @param {React.ReactNode} props.children - Nội dung button
 * @param {string} props.className - Custom className
 */
export default function Button({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    to,
    className = '',
    children,
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.01em] transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

    const variants = {
        primary: 'bg-blue-600 text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-blue-700',
        secondary: 'border border-white/80 bg-white/85 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] hover:bg-white',
        outline: 'border border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700',
        danger: 'bg-red-600 text-white shadow-[0_14px_28px_rgba(220,38,38,0.24)] hover:bg-red-700',
        success: 'bg-emerald-600 text-white shadow-[0_14px_28px_rgba(5,150,105,0.2)] hover:bg-emerald-700',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100/80',
        gradient: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-soft hover:from-blue-700 hover:to-sky-600 hover:shadow-[0_12px_28px_rgba(37,99,235,0.20)]',
        info: 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    };

    const sizes = {
        sm: 'rounded-[12px] px-3 py-2 text-xs',
        md: 'rounded-[14px] px-4 py-2.5 text-sm',
        lg: 'rounded-[16px] px-6 py-3 text-sm',
    };

    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;
    const widthStyles = fullWidth ? 'w-full' : '';
    const combinedClassName = cn(baseStyles, variantStyles, sizeStyles, widthStyles, className);

    // Nếu có `to`, render như Link
    if (to) {
        return (
            <Link
                to={to}
                className={combinedClassName}
                {...props}
            >
                {children}
            </Link>
        );
    }

    return (
        <button
            className={combinedClassName}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
