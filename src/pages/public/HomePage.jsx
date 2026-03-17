import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, HeartPulse, MapPin, ShieldCheck, Truck, Waves, Radar, LifeBuoy } from "lucide-react";

import { AUTH_ROUTES, PUBLIC_ROUTES } from "../../app/routes/route.constants.js";

function Container({ children, className = "" }) {
    return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

const CAPABILITIES = [
    { icon: Radar, title: "Theo dõi thời gian thực", body: "Nhận cảnh báo và cập nhật hiện trường liên tục từ đội điều phối." },
    { icon: BellRing, title: "Yêu cầu cứu hộ tức thì", body: "Gửi tín hiệu khẩn cấp với vị trí và tình trạng chỉ trong vài chạm." },
    { icon: Truck, title: "Điều phối cứu trợ", body: "Phân bổ nhu yếu phẩm và phương tiện theo mức độ ưu tiên." },
    { icon: ShieldCheck, title: "Quy trình rõ ràng", body: "Thông tin, liên hệ và hướng dẫn an toàn được chuẩn hóa trên cùng một hệ." },
];

const SCENARIOS = [
    { icon: MapPin, title: "Xác định vị trí an toàn", body: "Xem hướng dẫn thoát hiểm, khu vực sơ tán và điểm tập kết gần nhất." },
    { icon: LifeBuoy, title: "Liên hệ hỗ trợ nhanh", body: "Tập trung đầu mối liên lạc, hotline và nội dung công khai quan trọng." },
    { icon: HeartPulse, title: "Ưu tiên người yếu thế", body: "Cung cấp checklist riêng cho người già, trẻ nhỏ và người cần hỗ trợ y tế." },
];

const HERO_STEPS = [
    { title: "Mở hướng dẫn khẩn cấp", body: "Đọc theo đúng thứ tự hành động trước khi di chuyển hoặc liên lạc." },
    { title: "Kiểm tra đầu mối hỗ trợ", body: "Xác định ngay hotline, email và nơi tiếp nhận thông tin phù hợp." },
    { title: "Gửi yêu cầu cứu hộ", body: "Đăng nhập để gửi vị trí, tình trạng và cập nhật khẩn cấp." },
];

export default function HomePage() {
    return (
        <div className="space-y-14 sm:space-y-16">
            <Container>
                <section className="space-y-7">
                    <article className="glass-card reveal-rise relative overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                        <div className="pointer-events-none absolute -left-10 top-8 h-36 w-36 rounded-full bg-cyan-200/30 blur-3xl" />
                        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-200/35 blur-3xl" />
                        <div className="relative max-w-3xl">
                            <span className="glass-chip text-blue-700">
                                <Waves size={16} className="text-blue-600" />
                                Ứng phó khẩn cấp mùa mưa lũ
                            </span>
                            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-5xl lg:text-6xl">
                                3 bước rõ ràng để nhận hỗ trợ ngay khi cần
                            </h1>
                            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                                Hướng tiếp cận mới ưu tiên bình tĩnh và hành động nhanh: đọc hướng dẫn, xác định đầu mối hỗ trợ, sau đó gửi yêu cầu cứu hộ chính thức.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    to={AUTH_ROUTES.LOGIN}
                                    className="inline-flex items-center gap-2 rounded-[18px] bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700"
                                >
                                    Gửi yêu cầu cứu hộ
                                    <ArrowRight size={16} />
                                </Link>
                                <Link to={PUBLIC_ROUTES.EMERGENCY_GUIDE} className="inline-flex items-center rounded-[18px] border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                    Mở hướng dẫn khẩn cấp
                                </Link>
                            </div>
                        </div>
                    </article>

                    <aside className="glass-card reveal-rise overflow-hidden bg-[linear-gradient(145deg,rgba(37,99,235,0.94),rgba(8,145,178,0.82))] px-6 py-7 text-white sm:px-7" style={{ animationDelay: '120ms' }}>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">Checklist hành động</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">Việc cần làm ngay trong 60 giây đầu</h2>
                        <div className="mt-6 space-y-4">
                            {HERO_STEPS.map((item, index) => (
                                <article key={item.title} className="rounded-[22px] border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-xl">
                                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-100">0{index + 1}</p>
                                    <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
                                    <p className="mt-2 text-sm leading-7 text-blue-50/90">{item.body}</p>
                                </article>
                            ))}
                        </div>
                    </aside>
                </section>
            </Container>

            <Container>
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Năng lực hệ thống</p>
                    <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-slate-900 sm:text-4xl">Hệ thống hỗ trợ bạn như thế nào</h2>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                        <article key={title} className="glass-card glass-hover reveal-rise px-6 py-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/80 bg-white/[0.55] text-blue-600 backdrop-blur-xl">
                                <Icon size={22} />
                            </div>
                            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.02em] text-slate-900">{title}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
                        </article>
                    ))}
                    </div>
                </section>
            </Container>

            <Container>
                <section className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                        {[
                            { value: "24/7", label: "Hỗ trợ liên tục" },
                            { value: "100+", label: "Đội cứu hộ" },
                            { value: "63", label: "Tỉnh thành" },
                        ].map((item) => (
                            <div key={item.label} className="glass-panel rounded-[24px] px-5 py-5">
                                <p className="text-3xl font-extrabold tracking-[-0.04em] text-blue-700">{item.value}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <details className="glass-card reveal-rise rounded-[28px] px-7 py-6 sm:px-8">
                        <summary className="cursor-pointer text-2xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-3xl">
                            Xem thêm tài nguyên công khai trước khi đăng nhập
                        </summary>
                        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">
                            Tài nguyên mở rộng giúp người dân nhận diện tình huống, chuẩn bị liên hệ và ưu tiên nhóm dễ tổn thương trước khi gửi yêu cầu chính thức.
                        </p>
                        <div className="mt-6 grid gap-5 md:grid-cols-3">
                            {SCENARIOS.map(({ icon: Icon, title, body }) => (
                                <article key={title} className="glass-card glass-hover reveal-rise px-6 py-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/80 bg-white/[0.55] text-blue-600 backdrop-blur-xl">
                                        <Icon size={21} />
                                    </div>
                                    <h3 className="mt-5 text-lg font-extrabold tracking-[-0.02em] text-slate-900">{title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
                                </article>
                            ))}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link to={PUBLIC_ROUTES.EMERGENCY_GUIDE} className="glass-chip rounded-[18px] px-5 py-3 font-semibold">
                                Xem hướng dẫn chi tiết
                            </Link>
                            <Link to={PUBLIC_ROUTES.SUPPORT_CONTACT} className="glass-chip rounded-[18px] px-5 py-3 font-semibold">
                                Xem thông tin hỗ trợ
                            </Link>
                        </div>
                    </details>
                </section>
            </Container>
        </div>
    );
}
