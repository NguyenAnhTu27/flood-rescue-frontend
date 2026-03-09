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

const guideSteps = [
    {
        icon: BellRing,
        title: 'Tiếp nhận thông tin',
        description:
            'Theo dõi cảnh báo từ cơ quan chức năng, sạc đầy pin điện thoại và chuẩn bị pin dự phòng để giữ liên lạc.',
    },
    {
        icon: MapPin,
        title: 'Xác định vị trí',
        description:
            'Bật GPS, ghi rõ số nhà/đường/phường/xã và gửi vị trí chính xác để đội cứu hộ tiếp cận nhanh hơn.',
    },
    {
        icon: FileText,
        title: 'Gửi yêu cầu cứu hộ',
        description:
            'Điền thông tin số người cần cứu, mức độ nguy hiểm, có trẻ em/người già hay thương tích để được ưu tiên phù hợp.',
    },
    {
        icon: Shield,
        title: 'Chờ xác nhận',
        description:
            'Trung tâm xác minh và điều phối lực lượng. Giữ chuông điện thoại bật để không bỏ lỡ cuộc gọi từ đội cứu hộ.',
    },
    {
        icon: HeartPulse,
        title: 'Sơ cứu khi cần',
        description:
            'Thực hiện sơ cứu cơ bản và cập nhật ngay tình trạng sức khỏe trong yêu cầu để điều phối hỗ trợ y tế kịp thời.',
    },
    {
        icon: AlertTriangle,
        title: 'Tuân thủ chỉ dẫn',
        description:
            'Mang giấy tờ, thuốc men thiết yếu và làm theo hướng dẫn của đội cứu hộ trong suốt quá trình di chuyển.',
    },
];

const safetyTips = [
    'Không di chuyển qua vùng nước sâu, dòng chảy mạnh hoặc khu vực không rõ địa hình.',
    'Tuyệt đối tránh dây điện đứt, cột điện ngã và thiết bị điện đang ngập nước.',
    'Ưu tiên hỗ trợ trẻ em, người già, người khuyết tật và người bị thương khi sơ tán.',
    'Chuẩn bị túi khẩn cấp gồm nước, thực phẩm khô, đèn pin, thuốc và giấy tờ quan trọng.',
];

function Container({ children, className = '' }) {
    return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-5 ${className}`}>{children}</div>;
}

function IconBadge({ children, className = '' }) {
    return (
        <div
            className={[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50',
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}

function StepCard({ index, icon, title, description }) {
    const iconNode = React.createElement(icon, { className: 'text-blue-600', size: 20 });

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <IconBadge>{iconNode}</IconBadge>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Bước {index}</span>
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        </article>
    );
}

export default function EmergencyGuidelinePage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
                <Container>
                    <div className="flex h-14 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                <HomeIcon className="text-white" size={18} strokeWidth={2.2} />
                            </div>
                            <span className="text-sm font-bold tracking-wide">QUẢN LÝ CỨU HỘ</span>
                        </div>

                        <nav className="hidden items-center gap-8 md:flex">
                            <Link to={PUBLIC_ROUTES.HOME} className="text-sm font-medium text-slate-700 hover:text-blue-600">
                                Giới thiệu
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                                className="text-sm font-medium text-slate-700 hover:text-blue-600"
                            >
                                Hướng dẫn
                            </Link>
                            <Link to="#" className="text-sm font-medium text-slate-700 hover:text-blue-600">
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
                <section className="border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-100 py-8 sm:py-10">
                    <Container>
                        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                            <div>
                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700">
                                    HƯỚNG DẪN KHẨN CẤP
                                </span>
                                <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                                    Quy trình cứu hộ gọn, rõ và dễ làm theo
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                                    Giữ bình tĩnh, gửi thông tin chính xác và làm theo chỉ dẫn để đội cứu hộ tiếp cận nhanh nhất trong
                                    tình huống lũ lụt, thiên tai.
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <a
                                        href="tel:114"
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                    >
                                        <Phone size={16} />
                                        Gọi 114
                                    </a>
                                    <Link
                                        to={AUTH_ROUTES.LOGIN}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                    >
                                        <LogIn size={16} />
                                        Gửi yêu cầu cứu hộ
                                    </Link>
                                </div>
                            </div>

                            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h2 className="text-lg font-bold">Khi gọi tổng đài, chuẩn bị ngay:</h2>
                                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                                    <li className="flex gap-3">
                                        <MapPin className="mt-0.5 shrink-0 text-blue-600" size={16} />
                                        <span>Địa chỉ hoặc tọa độ hiện tại.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <HeartPulse className="mt-0.5 shrink-0 text-blue-600" size={16} />
                                        <span>Số người cần hỗ trợ, tình trạng thương tích.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <Phone className="mt-0.5 shrink-0 text-blue-600" size={16} />
                                        <span>Số điện thoại có thể liên hệ liên tục.</span>
                                    </li>
                                </ul>
                                <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                                    Ưu tiên cứu người trước, tài sản sau.
                                </div>
                            </aside>
                        </div>
                    </Container>
                </section>

                <section className="py-8 sm:py-10">
                    <Container>
                        <div className="flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <h2 className="text-xl font-extrabold tracking-wide sm:text-2xl">CÁC BƯỚC KHI CẦN CỨU HỘ</h2>
                                <p className="mt-1 text-sm text-slate-600 sm:text-base">
                                    Thực hiện theo thứ tự để được hỗ trợ nhanh và chính xác hơn.
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                                6 bước xử lý nhanh
                            </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {guideSteps.map((step, index) => (
                                <StepCard key={step.title} index={index + 1} {...step} />
                            ))}
                        </div>
                    </Container>
                </section>

                <section className="pb-10">
                    <Container>
                        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <h2 className="text-xl font-extrabold tracking-wide sm:text-2xl">LƯU Ý AN TOÀN</h2>
                                <ul className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 sm:text-base">
                                    {safetyTips.map((tip) => (
                                        <li key={tip} className="flex gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
                                <h3 className="text-lg font-extrabold text-red-700">Cần hỗ trợ ngay?</h3>
                                <p className="mt-2 text-sm text-slate-700">
                                    Gọi tổng đài 114 hoặc đăng nhập để gửi yêu cầu cứu hộ trực tuyến.
                                </p>
                                <div className="mt-4 space-y-3">
                                    <a
                                        href="tel:114"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                                    >
                                        <Phone size={16} />
                                        Gọi 114
                                    </a>
                                    <Link
                                        to={AUTH_ROUTES.LOGIN}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                    >
                                        <LogIn size={16} />
                                        Gửi yêu cầu cứu hộ
                                    </Link>
                                </div>
                                <div className="mt-4 rounded-xl bg-white px-3 py-3 text-sm text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Phone size={15} className="text-slate-500" />
                                        <span>Hotline hỗ trợ: 1900-xxxx</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Mail size={15} className="text-slate-500" />
                                        <span className="break-all">support@cuuho.gov.vn</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Container>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <Container className="py-8">
                    <div className="grid gap-7 md:grid-cols-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                    <HomeIcon className="text-white" size={18} strokeWidth={2.2} />
                                </div>
                                <span className="text-sm font-bold">QUẢN LÝ CỨU HỘ</span>
                            </div>
                            <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                                Hệ thống hỗ trợ cộng đồng trong tình huống thiên tai khẩn cấp. Thông tin được bảo mật và điều phối theo
                                quy định của cơ quan chức năng.
                            </p>
                        </div>

                        <div className="flex gap-10">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Liên kết</h4>
                                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                    <li>
                                        <Link to="#" className="hover:text-blue-600">
                                            Điều khoản sử dụng
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="#" className="hover:text-blue-600">
                                            Chính sách bảo mật
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="#" className="hover:text-blue-600">
                                            Liên hệ hỗ trợ
                                        </Link>
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
                                        <span>1900-xxxx</span>
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

                    <div className="mt-6 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 sm:text-sm">
                        © 2024 Hệ thống Quản lý Cứu hộ - Cứu trợ. Bản quyền thuộc về Cơ quan chủ quản.
                    </div>
                </Container>
            </footer>
        </div>
    );
}
