import React from 'react';

function Page({ title }) {
    return (
        <div className="rounded-xl border bg-white p-6">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="mt-2 text-slate-600">Placeholder page</p>
        </div>
    );
}

export default function TeamWorkloadPage() {
    return <Page title="Điều phối - Theo dõi đội xử lý nhiều yêu cầu" />;
}
