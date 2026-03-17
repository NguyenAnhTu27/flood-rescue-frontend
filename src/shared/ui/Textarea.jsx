import React from 'react';
import { cn } from '../lib/cn.js';

/**
 * Textarea component với styling nhất quán
 * @param {Object} props
 * @param {string} props.className - Custom className
 * @param {boolean} props.error - Có lỗi hay không
 */
export default function Textarea({
    className = '',
    error = false,
    ...props
}) {
    const baseStyles = 'ui-field resize-y';
    const defaultStyles = '';
    const focusStyles = '';
    const errorStyles = error ? 'is-error' : '';

    return (
        <textarea
            className={cn(baseStyles, defaultStyles, focusStyles, errorStyles, className)}
            {...props}
        />
    );
}
