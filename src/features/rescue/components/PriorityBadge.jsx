import React from 'react';

/**
 * Priority Badge Component
 * Displays a badge showing the urgency/priority level of a rescue request
 * 
 * @param {Object} props
 * @param {string} props.level - Priority level: 'HIGH' | 'MEDIUM' | 'LOW'
 * @param {string} props.size - Badge size: 'sm' | 'md' | 'lg' (default: 'md')
 */
export default function PriorityBadge({ level, size = 'md' }) {
    const config = {
        HIGH: {
            label: 'Cao',
            color: 'red',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-500',
            dotColor: 'bg-red-500',

        },
        MEDIUM: {
            label: 'Trung bình',
            color: 'amber',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-700',
            borderColor: 'border-amber-500',
            dotColor: 'bg-amber-500',
        },
        LOW: {
            label: 'Thấp',
            color: 'blue',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-500',
            dotColor: 'bg-blue-500',
        },
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    const dotSizes = {
        sm: 'h-1.5 w-1.5',
        md: 'h-2 w-2',
        lg: 'h-2.5 w-2.5',
    };

    const currentConfig = config[level] || config.MEDIUM;

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-md border ${currentConfig.bgColor} ${currentConfig.borderColor} ${currentConfig.textColor} ${sizeClasses[size]}`}
        >
            <span className={`${currentConfig.dotColor} ${dotSizes[size]} rounded-sm`} />
            <span className="font-semibold">{currentConfig.label}</span>
        </div>
    );
}
