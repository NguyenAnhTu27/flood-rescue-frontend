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
    const baseStyles = 'ui-field';
    const defaultStyles = '';
    const focusStyles = '';
    const errorStyles = error ? 'is-error' : '';

    return (
        <input
            className={cn(baseStyles, defaultStyles, focusStyles, errorStyles, className)}
            {...props}
        />
    );
}
