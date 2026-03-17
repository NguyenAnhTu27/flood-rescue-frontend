import React from "react";

// eslint-disable-next-line no-unused-vars
export default function AppIcon({ Icon, size = 20, className = "", strokeWidth = 2 }) {
    return <Icon size={size} strokeWidth={strokeWidth} className={`shrink-0 ${className}`} />;
}