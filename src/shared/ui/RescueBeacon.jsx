import React from 'react';

export default function RescueBeacon({ count = 0, isCritical = false }) {
    const display = count > 99 ? '99+' : count;
    return (
        <div className="relative inline-flex items-center">
            <span className="relative z-10 inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-urgent-500 px-2 text-xs font-medium text-white">
                {display}
            </span>
            {isCritical && (
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-urgent-500/50" />
            )}
        </div>
    );
}

