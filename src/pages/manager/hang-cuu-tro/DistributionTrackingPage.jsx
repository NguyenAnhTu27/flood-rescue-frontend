import React from 'react';
import { CheckCircle2, Clock3, Truck } from 'lucide-react';

const TRACKING_STEPS = [
    {
        icon: Clock3,
        title: 'Dang cho phan phoi',
        description: 'Theo doi cac yeu cau da duoc duyet va dang cho sap xep lo trinh giao hang.',
    },
    {
        icon: Truck,
        title: 'Dang van chuyen',
        description: 'Cap nhat trang thai xuat kho, giao nhan va tien do di chuyen cua tung dot phan phoi.',
    },
    {
        icon: CheckCircle2,
        title: 'Hoan tat ban giao',
        description: 'Tong hop ket qua giao hang va doi soat xac nhan tu diem tiep nhan cuu tro.',
    },
];

export default function DistributionTrackingPage() {
    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Theo doi phan phoi hang cuu tro</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Man hinh tong hop de theo doi tien do giao hang va trang thai ban giao cua cac dot cuu tro.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                {TRACKING_STEPS.map((step) => {
                    const Icon = step.icon;
                    return (
                        <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h2 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                        </article>
                    );
                })}
            </section>
        </div>
    );
}
