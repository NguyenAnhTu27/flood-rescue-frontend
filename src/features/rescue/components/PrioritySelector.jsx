import React from 'react';

/**
 * Priority Selector Component
 * Allows user to select urgency/priority level for a rescue request
 * 
 * @param {Object} props
 * @param {string} props.value - Current selected level: 'HIGH' | 'MEDIUM' | 'LOW'
 * @param {Function} props.onChange - Callback when level changes: (level: string) => void
 */
export default function PrioritySelector({ value, onChange }) {
    const options = [
        {
            level: 'HIGH',
            label: 'Cao',
            description: 'Nguy hiểm trực tiếp đến tính mạng, cần cứu hộ ngay lập tức.',
            color: 'red',
            borderColor: 'border-red-500',
            bgColor: 'bg-red-50',
            hoverBorderColor: 'hover:border-red-400',
            hoverBgColor: 'hover:bg-red-50/40',
            textColor: 'text-red-700',
            dotColor: 'bg-red-500',
        },
        {
            level: 'MEDIUM',
            label: 'Trung bình',
            description: 'Khu vực nguy hiểm nhưng tạm thời ổn định, cần hỗ trợ sớm.',
            color: 'amber',
            borderColor: 'border-amber-500',
            bgColor: 'bg-amber-50',
            hoverBorderColor: 'hover:border-amber-400',
            hoverBgColor: 'hover:bg-amber-50/40',
            textColor: 'text-amber-700',
            dotColor: 'bg-amber-500',
        },
        {
            level: 'LOW',
            label: 'Thấp',
            description: 'Cần hỗ trợ nhưng chưa đe doạ trực tiếp đến tính mạng.',
            color: 'blue',
            borderColor: 'border-blue-500',
            bgColor: 'bg-blue-50',
            hoverBorderColor: 'hover:border-blue-400',
            hoverBgColor: 'hover:bg-blue-50/40',
            textColor: 'text-blue-700',
            dotColor: 'bg-blue-500',
        },
    ];

    return (
        <div className="space-y-3">
            {options.map((option) => {
                const isSelected = value === option.level;
                return (
                    <button
                        key={option.level}
                        type="button"
                        onClick={() => onChange(option.level)}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${isSelected
                                ? `${option.borderColor} ${option.bgColor}`
                                : `border-slate-200 ${option.hoverBorderColor} ${option.hoverBgColor}`
                            }`}
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${option.dotColor}`} />
                                <span className={`font-semibold ${option.textColor}`}>{option.label}</span>
                            </div>
                            <p className={`mt-1 text-xs ${option.textColor}`}>{option.description}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
