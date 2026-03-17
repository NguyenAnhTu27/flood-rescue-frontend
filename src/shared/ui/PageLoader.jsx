import React from 'react';

export default function PageLoader({ label = 'Đang tải...' }) {
    return (
        <div className="min-h-[40vh] w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <div className="text-sm font-medium text-slate-700">{label}</div>
            <div className="mt-1 text-xs text-slate-500">Vui lòng chờ trong giây lát.</div>
        </div>
    );
}

