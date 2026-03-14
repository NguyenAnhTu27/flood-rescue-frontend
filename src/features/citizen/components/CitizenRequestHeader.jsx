import React from 'react';
import { AlertTriangle, Crosshair, Flag, ListChecks } from 'lucide-react';

const REQUEST_TYPE_LABELS = {
    RESCUE: 'Cứu hộ',
    RELIEF: 'Cứu trợ',
};

const PRIORITY_META = {
    HIGH: {
        label: 'Khẩn cấp',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    MEDIUM: {
        label: 'Trung bình',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    LOW: {
        label: 'Thấp',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
};

export default function CitizenRequestHeader({
    requestType = 'RESCUE',
    isEditMode = false,
    currentStep = 1,
    steps = [],
    hasGps = false,
    priority = 'MEDIUM',
    title = '',
    subtitle = '',
    helperNote = '',
}) {
    const normalizedType = String(requestType || 'RESCUE').toUpperCase();
    const typeLabel = REQUEST_TYPE_LABELS[normalizedType] || REQUEST_TYPE_LABELS.RESCUE;
    const modeLabel = isEditMode ? 'Cập nhật' : 'Tạo mới';

    const normalizedPriority = String(priority || 'MEDIUM').toUpperCase();
    const priorityMeta = PRIORITY_META[normalizedPriority] || PRIORITY_META.MEDIUM;

    const totalSteps = Array.isArray(steps) && steps.length > 0 ? steps.length : 3;
    const stepItem = Array.isArray(steps) ? steps.find((step) => step.id === currentStep) : null;
    const stepLabel = stepItem?.label || `Bước ${currentStep}`;

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                    {!!subtitle && (
                        <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        <Flag className="h-3.5 w-3.5" />
                        <span>{typeLabel} • {modeLabel}</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        <ListChecks className="h-3.5 w-3.5" />
                        <span>Bước {currentStep}/{totalSteps}: {stepLabel}</span>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${hasGps
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}>
                        <Crosshair className="h-3.5 w-3.5" />
                        <span>{hasGps ? 'GPS đã sẵn sàng' : 'Chưa có GPS'}</span>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${priorityMeta.className}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Ưu tiên: {priorityMeta.label}</span>
                    </div>
                </div>
            </div>

            {!!helperNote && (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    {helperNote}
                </div>
            )}
        </section>
    );
}
