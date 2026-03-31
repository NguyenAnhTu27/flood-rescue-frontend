import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Home as HomeIcon,
    MapPin,
    LogIn,
    BellRing,
    HeartPulse,
    Mail,
    Phone,
    Facebook,
    Twitter,
    Youtube,
    ShieldCheck,
    ArrowRight,
    Waves,
} from "lucide-react";

import { AUTH_ROUTES, PUBLIC_ROUTES, CITIZEN_ROUTES } from "../../app/routes/route.constants.js";
import httpClient from "../../shared/lib/http.js";

const normalizeExternalUrl = (url) => {
    const value = String(url || "").trim();
    if (!value || value === "#") return "#";
    if (value.startsWith("/")) return value;
    const lower = value.toLowerCase();
    if (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("mailto:") ||
        lower.startsWith("tel:")
    ) {
        return value;
    }
    return `https://${value}`;
};

const resolveFooterLink = (rawUrl, fallbackPath) => {
    const value = String(rawUrl || "").trim();
    if (!value || value === "#") return fallbackPath;
    return normalizeExternalUrl(value);
};

/** ============ Small UI helpers ============ */
function Container({ children, className = "" }) {
    return <div className={`mx-auto w-full max-w-[90%] sm:max-w-6xl lg:max-w-7xl px-2 sm:px-4 lg:px-6 ${className}`}>{children}</div>;
}

function IconBadge({ children, className = "" }) {
    return (
        <div
            className={[
                "flex items-center justify-center rounded-2xl",
                "h-12 w-12 sm:h-14 sm:w-14",
                "bg-gradient-to-br from-blue-50 to-cyan-50",
                "border border-blue-100 shadow-sm",
                "shrink-0 transition duration-300",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}

function PrimaryButton({ to, children, className = "" }) {
    return (
        <Link
            to={to}
            className={[
                "inline-flex items-center justify-center gap-2 rounded-xl",
                "bg-blue-600 px-5 py-3 text-sm font-semibold text-white",
                "shadow-lg shadow-blue-600/20 transition duration-300",
                "hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25",
                "active:translate-y-0",
                className,
            ].join(" ")}
        >
            {children}
        </Link>
    );
}

function SecondaryButton({ to, children, className = "" }) {
    return (
        <Link
            to={to}
            className={[
                "inline-flex items-center justify-center gap-2 rounded-xl",
                "border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700",
                "shadow-sm transition duration-300 backdrop-blur",
                "hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-md",
                className,
            ].join(" ")}
        >
            {children}
        </Link>
    );
}

function StatCard({ number, label }) {
    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-md">
            <div className="text-2xl font-extrabold text-white sm:text-3xl">{number}</div>
            <div className="mt-1 text-xs text-white/80 sm:text-sm">{label}</div>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-blue-200">
            <IconBadge className="group-hover:rotate-3 group-hover:scale-105">
                {icon}
            </IconBadge>

            <h3 className="mt-5 text-base font-bold text-slate-900 sm:text-lg">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
    );
}

export default function HomePage() {
    const [footerSettings, setFooterSettings] = useState({
        footerBrandName: "QUẢN LÝ CỨU HỘ",
        footerDescription:
            "Hệ thống hỗ trợ cộng đồng trong tình huống thiên tai khẩn cấp. Thông tin được bảo mật và điều phối theo quy định của cơ quan chức năng.",
        footerTermsLabel: "Điều khoản sử dụng",
        footerTermsUrl: PUBLIC_ROUTES.TERMS_OF_USE,
        footerPrivacyLabel: "Chính sách bảo mật",
        footerPrivacyUrl: PUBLIC_ROUTES.PRIVACY_POLICY,
        footerSupportLabel: "Liên hệ hỗ trợ",
        footerSupportUrl: PUBLIC_ROUTES.SUPPORT_CONTACT,
        footerSupportEmail: "support@cuuho.gov.vn",
        hotline: "1900-xxxx",
        footerFacebookUrl: "#",
        footerTwitterUrl: "#",
        footerYoutubeUrl: "#",
        footerCopyright: "© 2024 Hệ thống Quản lý Cứu hộ - Cứu trợ. Bản quyền thuộc về Cơ quan chủ quản.",
    });

    useEffect(() => {
        const loadRuntimeSettings = async () => {
            try {
                const runtime = await httpClient.get("/public/runtime-settings");
                setFooterSettings((prev) => ({
                    ...prev,
                    ...runtime,
                }));
            } catch (err) {
                console.error("[HomePage] load runtime settings error:", err);
            }
        };
        loadRuntimeSettings();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* ================= Header ================= */}
            <header className="sticky top-0 z-50 border-b border-white/20 bg-white/75 backdrop-blur-xl">
                <Container>
                    <div className="flex items-center justify-between py-3 md:py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
                                <HomeIcon className="text-white" size={20} strokeWidth={2.2} />
                            </div>
                            <div className="leading-tight">
                                <div className="text-sm font-extrabold tracking-wide text-slate-900">
                                    QUẢN LÝ CỨU HỘ
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    Cứu hộ - Cứu trợ lũ lụt
                                </div>
                            </div>
                        </div>

                        <nav className="hidden items-center gap-8 md:flex">
                            <Link to={PUBLIC_ROUTES.HOME} className="text-sm font-medium text-slate-700 transition hover:text-blue-600">
                                Giới thiệu
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                                className="text-sm font-medium text-slate-700 transition hover:text-blue-600"
                            >
                                Hướng dẫn
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.SUPPORT_CONTACT}
                                className="text-sm font-medium text-slate-700 transition hover:text-blue-600"
                            >
                                Liên hệ
                            </Link>
                        </nav>

                        <Link
                            to={AUTH_ROUTES.LOGIN}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
                        >
                            <LogIn size={16} className="shrink-0" />
                            Đăng nhập
                        </Link>
                    </div>
                </Container>
            </header>

            <main>
                {/* ================= Hero ================= */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-600" />
                    <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
                    <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

                    <Container className="relative z-10 py-12 sm:py-16 lg:py-20">
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            {/* Left */}
                            <div className="text-white">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-white/90 backdrop-blur-md">
                                    <ShieldCheck size={14} />
                                    HỆ THỐNG HỖ TRỢ KHẨN CẤP
                                </div>

                                <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                                    Cứu hộ - Cứu trợ
                                    <br className="hidden sm:block" />
                                    <span className="text-cyan-200">Lũ lụt thông minh</span>
                                </h1>

                                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                                    Kết nối người dân, đội cứu hộ và đơn vị điều phối trong thời gian thực,
                                    giúp tiếp nhận yêu cầu khẩn cấp nhanh hơn, chính xác hơn và minh bạch hơn.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <PrimaryButton to={AUTH_ROUTES.LOGIN} className="text-black  hover:bg-slate-100">
                                        Gửi yêu cầu cứu hộ
                                        <ArrowRight size={16} />
                                    </PrimaryButton>

                                    <SecondaryButton
                                        to={CITIZEN_ROUTES.DASHBOARD}
                                        className="border-white/20 bg-white/10 text-black hover:border-blue-500 hover:bg-blue-500 hover:text-white"
                                    >
                                        <MapPin size={16} />
                                        Theo dõi bản đồ
                                    </SecondaryButton>
                                </div>

                                <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                                    <StatCard number="24/7" label="Hỗ trợ tiếp nhận yêu cầu khẩn cấp" />
                                    <StatCard number="GPS" label="Định vị và theo dõi vị trí cứu hộ" />
                                    <StatCard number="Real-time" label="Cập nhật trạng thái xử lý liên tục" />
                                </div>
                            </div>

                            {/* Right */}
                            <div className="relative lg:justify-self-end">
                                <div className="absolute -inset-3 rounded-[2rem] bg-white/10 blur-xl" />
                                <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl">
                                    <div className="overflow-hidden rounded-[1.5rem]">
                                        <img
                                            alt="Rescue operation"
                                            className="h-full w-full object-cover transition duration-700 hover:scale-105"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkuIim6eKBWF64y__usfnLxVkpgeqTBtaRDJ58PsAFqeWIeY--ZyzVaFwOTtGR9kCkNF3auwgrxPnDtWByXOAda9QqAFu92amV90kQucKcEXTNm6FPaz3IEdcpLArl6VVbw1vEF3JnrOSwlFeSiu-Shi8BW6br2tTtYNob6GwJ1gAA9A8VO1neeC058QgYXFXzwioKfywrOr95vktNzelwKwCd24wcxw4BroGUUXJ9ZDAF8bsKSLtK3Sg18GyTMQ22xnwlpr7HBmw"
                                        />
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-white/10 p-4 text-white backdrop-blur">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <BellRing size={16} className="text-cyan-200" />
                                                Cảnh báo sớm
                                            </div>
                                            <p className="mt-1 text-xs leading-5 text-white/75">
                                                Nhận thông tin khẩn cấp và phản hồi nhanh theo khu vực.
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-white/10 p-4 text-white backdrop-blur">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <Waves size={16} className="text-cyan-200" />
                                                Theo dõi thiên tai
                                            </div>
                                            <p className="mt-1 text-xs leading-5 text-white/75">
                                                Hỗ trợ quản lý tình huống lũ lụt theo thời gian thực.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* ================= Emergency Guide ================= */}
                <section className="py-12 sm:py-14">
                    <Container>
                        <div className="text-center">
                            <div className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-xs font-bold tracking-[0.2em] text-blue-700">
                                HƯỚNG DẪN KHẨN CẤP
                            </div>
                            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                Những bước cần thực hiện ngay khi có lũ lụt
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                                Hướng dẫn nhanh giúp người dân chủ động bảo vệ bản thân, xác định vị trí an toàn
                                và liên hệ hỗ trợ kịp thời khi thiên tai xảy ra.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-5 md:grid-cols-3">
                            <FeatureCard
                                icon={<BellRing className="text-blue-600" size={22} />}
                                title="Tiếp nhận thông tin"
                                description="Luôn theo dõi thông báo từ cơ quan chức năng, chuẩn bị điện thoại, pin dự phòng và các vật dụng cần thiết trước khi di chuyển."
                            />
                            <FeatureCard
                                icon={<MapPin className="text-blue-600" size={22} />}
                                title="Xác định vị trí an toàn"
                                description="Sử dụng bản đồ hệ thống để tìm vị trí tập kết an toàn hoặc gửi tọa độ hiện tại cho đội cứu hộ khi cần hỗ trợ khẩn cấp."
                            />
                            <FeatureCard
                                icon={<HeartPulse className="text-blue-600" size={22} />}
                                title="Hỗ trợ y tế khẩn cấp"
                                description="Thực hiện sơ cứu cơ bản, cập nhật tình trạng người bị nạn và thông báo ngay để lực lượng hỗ trợ có phương án xử lý phù hợp."
                            />
                        </div>
                    </Container>
                </section>

                {/* ================= Highlight Section ================= */}
                <section className="py-12 sm:py-16">
                    <Container>
                        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-600/10">
                                <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                                    Nền tảng điều phối hiện đại
                                </div>
                                <h3 className="mt-4 text-2xl font-extrabold sm:text-3xl">
                                    Kết nối nhanh hơn,
                                    <br />
                                    hỗ trợ chính xác hơn
                                </h3>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                                    Giao diện mới giúp người dùng tiếp cận các tính năng quan trọng nhanh hơn,
                                    rõ ràng hơn và trực quan hơn trong các tình huống khẩn cấp.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <PrimaryButton to={AUTH_ROUTES.REGISTER} className="bg-white text-black hover:bg-slate-100">
                                        Đăng ký nhận hỗ trợ
                                    </PrimaryButton>
                                    <SecondaryButton
                                        to={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                                        className="border-white/20 bg-white/10 text-black hover:border-blue-500 hover:bg-blue-500 hover:text-white"
                                    >
                                        Xem hướng dẫn
                                    </SecondaryButton>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-extrabold text-slate-900">Lợi ích nổi bật</h3>
                                <div className="mt-5 space-y-4">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="font-semibold text-slate-900">Tiếp nhận nhanh</div>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Người dân có thể gửi yêu cầu cứu hộ nhanh chóng với vị trí cụ thể và mô tả rõ ràng.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="font-semibold text-slate-900">Theo dõi minh bạch</div>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Trạng thái xử lý được cập nhật liên tục, giúp người dân và đơn vị điều phối dễ dàng theo dõi.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="font-semibold text-slate-900">Tăng hiệu quả cứu hộ</div>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Đội cứu hộ được hỗ trợ xác định vị trí, ưu tiên nhiệm vụ và phản ứng nhanh theo khu vực.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* ================= CTA ================= */}
                <section className="py-12 sm:py-16">
                    <Container>
                        <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/60 px-6 py-12 text-center shadow-xl backdrop-blur-xl sm:px-10">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-cyan-50 opacity-90" />
                            <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
                            <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />

                            <div className="relative z-10">
                                <h3 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                    Bạn đang cần hỗ trợ khẩn cấp?
                                </h3>
                                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                                    Hãy đăng nhập để gửi yêu cầu cứu hộ hoặc theo dõi thông tin trên bản đồ cứu hộ ngay bây giờ.
                                </p>

                                <div className="mt-7 flex flex-wrap justify-center gap-3">
                                    <PrimaryButton to={AUTH_ROUTES.REGISTER}>
                                        Đăng ký nhận hỗ trợ
                                    </PrimaryButton>
                                    <SecondaryButton to={CITIZEN_ROUTES.DASHBOARD}>
                                        Xem bản đồ cứu hộ
                                    </SecondaryButton>
                                </div>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* ================= Footer ================= */}
                <footer className="border-t border-slate-200 bg-white">
                    <Container className="py-8">
                        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                            {/* Left */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md">
                                        <HomeIcon className="text-white" size={20} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{footerSettings.footerBrandName}</div>
                                        <div className="text-xs text-slate-500">Hệ thống hỗ trợ cộng đồng</div>
                                    </div>
                                </div>
                                <p className="max-w-md text-sm leading-6 text-slate-500">
                                    {footerSettings.footerDescription}
                                </p>
                            </div>

                            {/* Mid */}
                            <div className="grid gap-8 sm:grid-cols-2">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">Liên kết</h4>
                                    <ul className="mt-4 space-y-3 text-sm text-slate-600">
                                        <li>
                                            <a
                                                href={resolveFooterLink(footerSettings.footerTermsUrl, PUBLIC_ROUTES.TERMS_OF_USE)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="transition hover:text-blue-600"
                                            >
                                                {footerSettings.footerTermsLabel}
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href={resolveFooterLink(footerSettings.footerPrivacyUrl, PUBLIC_ROUTES.PRIVACY_POLICY)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="transition hover:text-blue-600"
                                            >
                                                {footerSettings.footerPrivacyLabel}
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href={resolveFooterLink(footerSettings.footerSupportUrl, PUBLIC_ROUTES.SUPPORT_CONTACT)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="transition hover:text-blue-600"
                                            >
                                                {footerSettings.footerSupportLabel}
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">Thông tin</h4>
                                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Mail size={16} className="shrink-0 text-slate-500" />
                                            <a
                                                href={normalizeExternalUrl(`mailto:${footerSettings.footerSupportEmail || ""}`)}
                                                className="break-all transition hover:text-blue-600"
                                            >
                                                {footerSettings.footerSupportEmail}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="shrink-0 text-slate-500" />
                                            <a
                                                href={normalizeExternalUrl(`tel:${footerSettings.hotline || ""}`)}
                                                className="transition hover:text-blue-600"
                                            >
                                                {footerSettings.hotline || "1900-xxxx"}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="md:text-right">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">Kết nối</h4>
                                <div className="mt-4 flex gap-3 md:justify-end">
                                    <a
                                        href={normalizeExternalUrl(footerSettings.footerFacebookUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl border border-slate-200 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm"
                                    >
                                        <Facebook size={16} className="text-slate-600" />
                                    </a>
                                    <a
                                        href={normalizeExternalUrl(footerSettings.footerTwitterUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl border border-slate-200 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm"
                                    >
                                        <Twitter size={16} className="text-slate-600" />
                                    </a>
                                    <a
                                        href={normalizeExternalUrl(footerSettings.footerYoutubeUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl border border-slate-200 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm"
                                    >
                                        <Youtube size={16} className="text-slate-600" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 sm:text-sm">
                            {footerSettings.footerCopyright}
                        </div>
                    </Container>
                </footer>
            </main>
        </div>
    );
}