import React from 'react';
import { ShieldCheck, TriangleAlert, Waves } from 'lucide-react';

const GUIDE_ITEMS = [
    {
        icon: ShieldCheck,
        title: 'Kiểm tra trang bị trước khi xuất phát',
        description: 'Đảm bảo áo phao, bộ đàm, đèn pin, thiết bị định vị và dụng cụ y tế sẵn sàng sử dụng.',
    },
    {
        icon: Waves,
        title: 'Ưu tiên an toàn trên vùng ngập',
        description: 'Không tiếp cận khu vực có dòng chảy mạnh khi chưa có đánh giá hiện trường và phương án hỗ trợ phù hợp.',
    },
    {
        icon: TriangleAlert,
        title: 'Báo cáo nguy cơ ngay khi phát hiện',
        description: 'Cập nhật ngay về trung tâm điều phối nếu có sự cố sạt lở, điện giật, vật cản lớn hoặc thay đổi thời tiết đột ngột.',
    },
];

export default function SafetyGuidePage() {
    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Huong dan an toan doi cuu ho</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Tong hop cac luu y co ban truoc, trong va sau qua trinh thuc hien nhiem vu tai hien truong.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                {GUIDE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h2 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                        </article>
                    );
                })}
            </section>
        </div>
    );
}
