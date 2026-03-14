import React from 'react';
import { Link } from 'react-router-dom';
import {
    Home as HomeIcon,
    LogIn,
    BellRing,
    MapPin,
    HeartPulse,
    Phone,
    AlertTriangle,
    Shield,
    FileText,
    Mail,
    Facebook,
    Twitter,
    Youtube,
} from 'lucide-react';
import { AUTH_ROUTES, PUBLIC_ROUTES } from '../../app/routes/route.constants.js';

function Container({ children, className = '' }) {
    return <div className={`mx-auto w-full max-w-[90%] px-2 lg:px-3 ${className}`}>{children}</div>;
}

function IconBadge({ children, className = '' }) {
    return (
        <div
            className={[
                'flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50',
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}

export default function EmergencyGuidePage() {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* ================= Header ================= */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
                <Container>
                    <div className="flex h-14 items-center justify-between">
                        <Link to={PUBLIC_ROUTES.HOME} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                <HomeIcon className="text-white" size={18} strokeWidth={2.2} />
                            </div>
                            <span className="text-sm font-bold tracking-wide">QUẢN LÝ CỨU HỘ</span>
                        </Link>
                        <nav className="hidden items-center gap-8 md:flex">
                            <Link
                                to={PUBLIC_ROUTES.HOME}
                                className="text-sm font-medium text-slate-700 hover:text-blue-600"
                            >
                                Giới thiệu
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                                className="text-sm font-medium text-blue-600"
                            >
                                Hướng dẫn
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.CONTACT}
                                className="text-sm font-medium text-slate-700 hover:text-blue-600"
                            >
                                Liên hệ
                            </Link>
                        </nav>
                        <Link
                            to={AUTH_ROUTES.LOGIN}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            <LogIn size={16} className="shrink-0" />
                            Đăng nhập
                        </Link>
                    </div>
                </Container>
            </header>

            <main>
                {/* ================= Hero ================= */}
                <section className="border-b border-slate-100 bg-slate-50/50 py-10 sm:py-14">
                    <Container>
                        <div className="text-center">
                            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                                Hướng dẫn cứu hộ
                            </h1>
                            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                                Các bước cần thực hiện khi cần hỗ trợ cứu hộ trong tình huống lũ lụt, thiên tai.
                                Giữ bình tĩnh và làm theo hướng dẫn để đảm bảo an toàn cho bản thân và gia đình.
                            </p>
                        </div>
                    </Container>
                </section>

                {/* ================= Các bước khi cần cứu hộ ================= */}
                <section className="py-12 sm:py-16">
                    <Container>
                        <h2 className="text-center text-xl font-extrabold tracking-wide sm:text-2xl">
                            CÁC BƯỚC KHI CẦN CỨU HỘ
                        </h2>
                        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600 sm:text-base">
                            Thực hiện theo thứ tự để được hỗ trợ nhanh nhất.
                        </p>

                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <BellRing className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Bước 1: Tiếp nhận thông tin</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Theo dõi cảnh báo từ cơ quan chức năng, đài báo, app. Sạc đầy pin điện thoại,
                                    chuẩn bị pin dự phòng và giữ liên lạc với người thân.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <MapPin className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Bước 2: Xác định vị trí</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Bật GPS, xác định địa chỉ chính xác (số nhà, đường, phường/xã).
                                    Sử dụng bản đồ hệ thống để tìm điểm an toàn hoặc gửi tọa độ cho đội cứu hộ.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <FileText className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Bước 3: Gửi yêu cầu cứu hộ</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Đăng nhập hệ thống, điền form yêu cầu cứu hộ: địa chỉ, số người cần cứu,
                                    tình trạng (có thương tích, người già/trẻ em), số điện thoại liên hệ.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <Shield className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Bước 4: Chờ xác nhận</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Trung tâm sẽ xác minh và điều phối đội cứu hộ. Bạn có thể theo dõi trạng thái
                                    yêu cầu trên ứng dụng. Giữ điện thoại bật tiếng để nhận cuộc gọi từ đội cứu hộ.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <HeartPulse className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Bước 5: Hỗ trợ y tế (nếu cần)</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Sơ cứu cơ bản khi có người bị thương. Ghi rõ trong yêu cầu nếu có người
                                    cần cấp cứu để được ưu tiên và phối hợp xe cấp cứu.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <IconBadge>
                                    <AlertTriangle className="text-blue-600" size={20} />
                                </IconBadge>
                                <h3 className="mt-4 text-sm font-bold sm:text-base">Bước 6: Tuân thủ chỉ dẫn</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    Làm theo hướng dẫn của đội cứu hộ khi tiếp cận. Mang theo giấy tờ tùy thân,
                                    thuốc men cần thiết. Sau khi được cứu, xác nhận và gửi phản hồi trên hệ thống.
                                </p>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* ================= Lưu ý an toàn ================= */}
                <section className="border-t border-slate-100 bg-slate-50/50 py-12 sm:py-16">
                    <Container>
                        <h2 className="text-center text-xl font-extrabold tracking-wide sm:text-2xl">
                            LƯU Ý AN TOÀN
                        </h2>
                        <ul className="mx-auto mt-8 max-w-2xl space-y-3 text-sm text-slate-700 sm:text-base">
                            <li className="flex gap-3">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                Tránh di chuyển qua vùng nước sâu, dòng chảy mạnh hoặc không rõ địa hình.
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                Không chạm vào dây điện, cột điện ngã hoặc thiết bị điện trong nước.
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                Ưu tiên trẻ em, người già, người khuyết tật và người bị thương khi sơ tán.
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                Chuẩn bị túi khẩn cấp: nước, thực phẩm khô, đèn pin, thuốc, giấy tờ.
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                Gọi tổng đài 114 khi cần báo tin khẩn cấp hoặc không thể dùng app.
                            </li>
                        </ul>
                    </Container>
                </section>

                {/* ================= Hotline & CTA ================= */}
                <section className="py-12 sm:py-16">
                    <Container>
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm sm:px-10">
                            <h3 className="text-xl font-extrabold sm:text-2xl">Cần hỗ trợ ngay?</h3>
                            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
                                Gọi tổng đài cứu hộ 114 hoặc đăng nhập để gửi yêu cầu cứu hộ trực tuyến.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-4">
                                <a
                                    href="tel:114"
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                >
                                    <Phone size={18} />
                                    Gọi 114
                                </a>
                                <Link
                                    to={AUTH_ROUTES.LOGIN}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Gửi yêu cầu cứu hộ
                                </Link>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* ================= Footer ================= */}
                <footer className="mt-16 border-t border-slate-200 bg-white">
                    <Container className="py-10">
                        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                        <HomeIcon className="text-white" size={18} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-sm font-bold">QUẢN LÝ CỨU HỘ</span>
                                </div>
                                <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                                    Hệ thống hỗ trợ cộng đồng trong tình huống thiên tai khẩn cấp.
                                </p>
                            </div>
                            <div className="flex gap-10">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Liên kết</h4>
                                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                        <li>
                                            <Link to={PUBLIC_ROUTES.HOME} className="hover:text-blue-600">Trang chủ</Link>
                                        </li>
                                        <li>
                                            <Link to={PUBLIC_ROUTES.EMERGENCY_GUIDE} className="hover:text-blue-600">Hướng dẫn</Link>
                                        </li>
                                        <li>
                                            <Link to={PUBLIC_ROUTES.CONTACT} className="hover:text-blue-600">Liên hệ</Link>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông tin</h4>
                                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Mail size={16} className="shrink-0 text-slate-500" />
                                            <span className="break-all">support@cuuho.gov.vn</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="shrink-0 text-slate-500" />
                                            <span>114 · 1900-xxxx</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="md:text-right">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kết nối</h4>
                                <div className="mt-3 flex gap-3 md:justify-end">
                                    <Link to="#" className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50">
                                        <Facebook size={16} className="text-slate-600" />
                                    </Link>
                                    <Link to="#" className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50">
                                        <Twitter size={16} className="text-slate-600" />
                                    </Link>
                                    <Link to="#" className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50">
                                        <Youtube size={16} className="text-slate-600" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 sm:text-sm">
                            © 2024 Hệ thống Quản lý Cứu hộ - Cứu trợ. Bản quyền thuộc về Cơ quan chủ quản.
                        </div>
                    </Container>
                </footer>
            </main>
        </div>
    );
}
