import React from 'react';
import { cn } from '../lib/cn.js';

export default function Select({
    className = '',
    error = false,
    children,
    ...props
}) {
    return (
        <select
            className={cn('ui-field', error ? 'is-error' : '', className)}
            {...props}
        >
            {children}
        </select>
    );
}
