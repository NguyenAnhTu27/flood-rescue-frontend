import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Headset, LifeBuoy, Mail, MapPin, MessageSquareText, Phone, Radio, ShieldCheck } from "lucide-react";

import { AUTH_ROUTES, PUBLIC_ROUTES } from "../../app/routes/route.constants.js";
import httpClient from "../../shared/lib/http.js";

function Container({ children, className = "" }) {
    return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export default function SupportContactPage() {
    const [contactSettings, setContactSettings] = useState({
        hotline: "1900-xxxx",
        footerSupportEmail: "support@cuuho.gov.vn",
        supportAddress: "Trung tâm điều phối cứu hộ khu vực, cập nhật theo địa phương",
    });
    const [copied, setCopied] = useState(false);

    const supportMessageTemplate = `Xin chào đội hỗ trợ,\nTôi đang ở: [địa chỉ/mốc gần nhất]\nTình trạng hiện tại: [mô tả ngắn]\nSố người cần hỗ trợ: [x người]\nSố điện thoại liên hệ: [số điện thoại]\nNhu cầu ưu tiên: [cứu hộ/y tế/lương thực/di tản]`;

    useEffect(() => {
        const loadRuntimeSettings = async () => {
            try {
                const runtime = await httpClient.get("/public/runtime-settings");
                setContactSettings((prev) => ({ ...prev, ...runtime }));
            } catch {
                // Keep defaults.
            }
        };
        loadRuntimeSettings();
    }, []);

    return (
        <div className="space-y-10 sm:space-y-14">
            <Container>
                <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="glass-card reveal-rise relative overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:px-12">
                        <div className="pointer-events-none absolute -left-12 top-6 h-44 w-44 rounded-full bg-cyan-200/30 blur-3xl" />
                        <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-blue-200/35 blur-3xl" />
                        <div className="relative max-w-3xl">
                            <div className="glass-chip text-blue-700">
                                <Headset size={16} className="text-blue-600" />
                                Cổng liên hệ hỗ trợ công khai
                            </div>
                            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-5xl">
                                Cần hướng dẫn, cần đầu mối,
                                <span className="block bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-500 bg-clip-text text-transparent">
                                    cần phản hồi nhanh và rõ
                                </span>
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                                Trang này dành cho người dân cần xác định nơi liên hệ phù hợp trước khi gửi yêu cầu chính thức. Từ hotline, email đến cách mô tả tình huống, mọi thứ được gom lại thành một điểm chạm duy nhất.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <a href={`tel:${String(contactSettings.hotline || "").replace(/\s/g, "")}`} className="inline-flex items-center gap-2 rounded-[18px] bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700">
                                    <Phone size={16} />
                                    Gọi hotline ngay
                                </a>
                                <a href={`mailto:${contactSettings.footerSupportEmail || ""}`} className="glass-chip rounded-[18px] px-6 py-3.5 font-semibold text-slate-700">
                                    <Mail size={16} />
                                    Gửi email hỗ trợ
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
                        {[
                            { icon: Phone, title: contactSettings.hotline || "1900-xxxx", body: "Đường dây tiếp nhận hỗ trợ công khai" },
                            { icon: Mail, title: contactSettings.footerSupportEmail || "support@cuuho.gov.vn", body: "Kênh hỗ trợ bằng email" },
                            { icon: Clock3, title: "24/7", body: "Ưu tiên tiếp nhận tình huống khẩn cấp" },
                        ].map(({ icon: Icon, title, body }, index) => (
                            <article key={title} className="glass-card glass-hover reveal-rise px-6 py-6" style={{ animationDelay: `${120 + index * 80}ms` }}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/80 bg-white/[0.55] text-blue-600 backdrop-blur-xl">
                                    <Icon size={21} />
                                </div>
                                <h2 className="mt-5 text-lg font-extrabold break-all tracking-[-0.02em] text-slate-900">{title}</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </Container>

            <Container>
                <section className="glass-card px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Mẫu liên hệ nhanh</p>
                            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-900">Sao chép mẫu tin để báo tình trạng rõ ràng</h2>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(supportMessageTemplate);
                                    setCopied(true);
                                    window.setTimeout(() => setCopied(false), 1800);
                                } catch {
                                    setCopied(false);
                                }
                            }}
                            className="inline-flex items-center justify-center rounded-[14px] bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            {copied ? "Đã sao chép" : "Sao chép mẫu tin"}
                        </button>
                    </div>
                    <pre className="mt-4 whitespace-pre-wrap rounded-[18px] border border-white/70 bg-white/[0.45] px-4 py-4 text-sm leading-7 text-slate-700 backdrop-blur-xl">
                        {supportMessageTemplate}
                    </pre>
                </section>
            </Container>

            <Container>
                <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="glass-card reveal-rise px-7 py-8 sm:px-8">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Khi nào nên liên hệ</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-slate-900">Chọn đúng kênh để nhận phản hồi nhanh hơn</h2>
                        <div className="mt-6 space-y-4">
                            {[
                                { icon: LifeBuoy, title: 'Nguy hiểm tức thì', body: 'Ngập sâu, bị cô lập, có người bị thương hoặc cần sơ tán ngay: gọi hotline trước.' },
                                { icon: MessageSquareText, title: 'Cần hướng dẫn thủ tục', body: 'Muốn biết cách gửi yêu cầu, theo dõi tiến độ hoặc chuẩn bị hồ sơ: email là phù hợp hơn.' },
                                { icon: ShieldCheck, title: 'Phản ánh dữ liệu hoặc quyền riêng tư', body: 'Các vấn đề về tài khoản, dữ liệu cá nhân hoặc thông tin hiển thị sai nên gửi bằng kênh hỗ trợ chính thức.' },
                            ].map(({ icon: Icon, title, body }) => (
                                <div key={title} className="glass-chip w-full justify-start rounded-[22px] px-5 py-4 text-left">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/80 bg-white/[0.55] text-blue-600">
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{title}</p>
                                        <p className="mt-1 text-sm leading-7 text-slate-600">{body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card reveal-rise px-7 py-8 sm:px-8" style={{ animationDelay: '120ms' }}>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Thông tin nên chuẩn bị</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-slate-900">Một mô tả tốt giúp hệ thống xử lý nhanh hơn</h2>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {[
                                'Vị trí hiện tại hoặc mốc gần nhất',
                                'Số người cần hỗ trợ',
                                'Mức nước, khả năng di chuyển, tình trạng sức khỏe',
                                'Số điện thoại còn liên lạc được',
                                'Nhu cầu ưu tiên: cứu hộ, y tế, lương thực, di tản',
                                'Ảnh hoặc mô tả ngắn nếu gửi bằng email',
                            ].map((item, index) => (
                                <div key={item} className="glass-hover rounded-[22px] border border-white/70 bg-white/[0.42] px-5 py-5 backdrop-blur-xl reveal-rise" style={{ animationDelay: `${180 + index * 60}ms` }}>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">0{index + 1}</p>
                                    <p className="mt-2 text-sm leading-7 text-slate-700">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </Container>

            <Container>
                <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                    <div className="glass-card reveal-rise px-7 py-8 sm:px-8">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Đầu mối</p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <a href={`tel:${String(contactSettings.hotline || "").replace(/\s/g, "")}`} className="glass-hover rounded-[24px] border border-white/70 bg-white/[0.44] px-6 py-6 text-left backdrop-blur-xl">
                                <Phone size={20} className="text-blue-600" />
                                <h3 className="mt-4 text-xl font-extrabold tracking-[-0.03em] text-slate-900">Hotline</h3>
                                <p className="mt-2 text-lg font-semibold text-blue-700">{contactSettings.hotline || '1900-xxxx'}</p>
                                <p className="mt-2 text-sm leading-7 text-slate-600">Dành cho tình huống cần phản hồi ngay hoặc cần chỉ dẫn khẩn cấp.</p>
                            </a>
                            <a href={`mailto:${contactSettings.footerSupportEmail || ""}`} className="glass-hover rounded-[24px] border border-white/70 bg-white/[0.44] px-6 py-6 text-left backdrop-blur-xl">
                                <Mail size={20} className="text-blue-600" />
                                <h3 className="mt-4 text-xl font-extrabold tracking-[-0.03em] text-slate-900">Email hỗ trợ</h3>
                                <p className="mt-2 text-base font-semibold break-all text-blue-700">{contactSettings.footerSupportEmail || 'support@cuuho.gov.vn'}</p>
                                <p className="mt-2 text-sm leading-7 text-slate-600">Phù hợp cho câu hỏi, góp ý, phản ánh dữ liệu hoặc yêu cầu cần đính kèm thông tin.</p>
                            </a>
                        </div>
                    </div>

                    <div className="glass-card reveal-rise bg-[linear-gradient(145deg,rgba(25,78,202,0.92),rgba(8,145,178,0.78)_55%,rgba(16,185,129,0.72))] px-7 py-8 text-white sm:px-8" style={{ animationDelay: '120ms' }}>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">Điểm tiếp nhận</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">Thông tin điều phối công khai</h2>
                        <div className="mt-6 space-y-4 text-sm leading-8 text-cyan-50">
                            <div className="flex items-start gap-3 rounded-[22px] border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-xl">
                                <MapPin size={18} className="mt-1 shrink-0" />
                                <div>
                                    <p className="font-bold text-white">Địa chỉ tham chiếu</p>
                                    <p>{contactSettings.supportAddress || 'Trung tâm điều phối cứu hộ khu vực, cập nhật theo địa phương'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-[22px] border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-xl">
                                <Radio size={18} className="mt-1 shrink-0" />
                                <div>
                                    <p className="font-bold text-white">Kênh ưu tiên</p>
                                    <p>Hotline cho khẩn cấp, email cho nội dung cần lưu vết và đính kèm chi tiết.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link to={AUTH_ROUTES.LOGIN} className="inline-flex items-center rounded-[18px] bg-white px-6 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                                Đăng nhập để gửi yêu cầu
                            </Link>
                            <Link to={PUBLIC_ROUTES.EMERGENCY_GUIDE} className="inline-flex items-center gap-2 rounded-[18px] border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/18">
                                Mở hướng dẫn an toàn
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>
                </section>
            </Container>
        </div>
    );
}
