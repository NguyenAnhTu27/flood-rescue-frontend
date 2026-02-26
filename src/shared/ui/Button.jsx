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
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

    const variants = {
        primary: 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg',
        secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
        outline: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
        danger: 'bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-50',
        gradient: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg',
        info: 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    };

    const sizes = {
        sm: 'rounded-lg px-3 py-1.5 text-xs',
        md: 'rounded-lg px-4 py-2 text-sm',
        lg: 'rounded-full px-6 py-3 text-sm',
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
