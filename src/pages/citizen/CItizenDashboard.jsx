import React from "react";
import { Plus, Shield, Package, AlertTriangle, PhoneCall } from "lucide-react";
import { CITIZEN_ROUTES } from "../../app/routes/route.constants.js";
import { Link } from "react-router-dom";

export default function CitizenDashboard() {
    return (
        <div className="space-y-10 pb-10">
            {/* Empty state card */}
            <section className="mx-auto max-w-3xl">
                <div className="rounded-3xl bg-white px-6 py-10 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col items-center text-center">
                        {/* Icon circle */}
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-100">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                            Bạn chưa có yêu cầu cứu hộ nào
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
                            Nếu bạn hoặc người thân đang gặp nguy hiểm trong vùng lũ, hãy gửi yêu cầu cứu hộ ngay để trung tâm điều
                            phối và các đội cứu nạn có thể tiếp cận kịp thời.
                        </p>

                        <Link
                            to={CITIZEN_ROUTES.CREATE_RESCUE_REQUEST}
                            className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
                        >
                            <Plus className="h-4 w-4" />
                            Tạo yêu cầu cứu hộ mới
                        </Link>
                    </div>
                </div>
            </section>

            {/* Safety tips */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    Hướng dẫn an toàn
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Card 1 */}
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                            <Package className="h-5 w-5 text-orange-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Chuẩn bị vật dụng thiết yếu
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            Nước uống, thực phẩm khô, đèn pin và bộ sơ cứu y tế.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                            <Shield className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Kỹ năng sinh tồn trong lũ
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            Cách di chuyển an toàn và nhận biết các khu vực nguy hiểm.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Danh sách hotline khẩn cấp
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            Các đầu số cứu hộ tại địa phương và đường dây nóng trung ương.
                        </p>
                    </div>
                </div>
            </section>

            {/* Call 115 section */}
            <section className="pt-4">
                <div className="rounded-2xl bg-slate-50 px-6 py-6 text-center">
                    <p className="text-xs text-slate-500 mb-3">
                        Cần hỗ trợ khẩn cấp qua điện thoại?
                    </p>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-600 hover:shadow-lg"
                    >
                        <PhoneCall className="h-4 w-4" />
                        Gọi ngay 115
                    </button>
                </div>
            </section>
        </div>
    );
}
