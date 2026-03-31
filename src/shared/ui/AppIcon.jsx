import React from "react";

export default function AppIcon({ icon, size = 20, className = "", strokeWidth = 2 }) {
    const IconComponent = icon;
    return <IconComponent size={size} strokeWidth={strokeWidth} className={`shrink-0 ${className}`} />;
}
