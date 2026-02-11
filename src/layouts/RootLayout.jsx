import React from 'react';

// Main application layout: Topbar + container
export default function RootLayout({ children }) {
    return (
        <div className="min-h-screen bg-white">
            <div className="sticky top-0 z-10 border-b bg-white">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <div className="font-semibold">Flood Rescue</div>
                    <div className="text-sm text-slate-600">Topbar (đồng nhất)</div>
                </div>
            </div>
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}
