import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Home as HomeIcon,
    LogIn,
    Mail,
    Phone,
    MapPin,
    Send,
    Facebook,
    Twitter,
    Youtube,
} from 'lucide-react';
import { AUTH_ROUTES, PUBLIC_ROUTES } from '../../app/routes/route.constants.js';
import Input from '../../shared/ui/Input.jsx';
import Textarea from '../../shared/ui/Textarea.jsx';
import GoogleMap from '../../features/map/components/MapBox.jsx';

function Container({ children, className = '' }) {
    return <div className={`mx-auto w-full max-w-[90%] px-2 lg:px-3 ${className}`}>{children}</div>;
}

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: 21.021069, lng: 105.829981 });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await new Promise((r) => setTimeout(r, 800));
            setSent(true);
            setForm({ name: '', email: '', phone: '', subject: '', message: '' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* ================= Header ================= */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
                <Container>
                    <div className="flex h-14 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link to={PUBLIC_ROUTES.HOME} className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                    <HomeIcon className="text-white" size={18} strokeWidth={2.2} />
                                </div>
                                <span className="text-sm font-bold tracking-wide">QUẢN LÝ CỨU HỘ</span>
                            </Link>
                        </div>
                        <nav className="hidden items-center gap-8 md:flex">
                            <Link
                                to={PUBLIC_ROUTES.HOME}
                                className="text-sm font-medium text-slate-700 hover:text-blue-600"
                            >
                                Giới thiệu
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.EMERGENCY_GUIDE}
                                className="text-sm font-medium text-slate-700 hover:text-blue-600"
                            >
                                Hướng dẫn
                            </Link>
                            <Link
                                to={PUBLIC_ROUTES.CONTACT}
                                className="text-sm font-medium text-blue-600"
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
                <section className="bg-gradient-to-br from-[#f8f9ff] via-[#e0eaff] to-[#e6f1ff] py-20 px-6">
                    <Container>
                        <div className="text-center">
                            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-[#005da9] mb-4">Liên hệ với chúng tôi</h1>
                            <p className="mx-auto max-w-2xl text-base text-slate-700 md:text-xl">
                                Đội ngũ điều phối cứu hộ sẵn sàng lắng nghe và hỗ trợ cộng đồng 24/7 trong mọi tình huống khẩn cấp do thiên tai.
                            </p>
                        </div>
                    </Container>
                </section>

                {/* ================= Contact content ================= */}
                <section className="max-w-7xl mx-auto px-6 -mt-12 mb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                        <div className="lg:col-span-6 bg-white border border-slate-200/70 shadow-sm rounded-xl p-8 md:p-10 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                            <h2 className="text-2xl font-extrabold text-[#005da9] mb-5 flex items-center gap-2">
                                <span className="inline-block w-9 h-9 rounded-lg bg-[#cfe4ff] text-[#005da9] flex items-center justify-center">✉️</span>
                                Gửi tin nhắn phản hồi
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-1 block">Họ và tên</label>
                                        <Input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Nguyễn Văn A"
                                            required
                                            className="focus:ring-[#0063cc]/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-1 block">Email</label>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="example@gmail.com"
                                            required
                                            className="focus:ring-[#0063cc]/40"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-1 block">Số điện thoại</label>
                                        <Input
                                            name="phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="090x xxx xxx"
                                            className="focus:ring-[#0063cc]/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-1 block">Chủ đề</label>
                                        <select
                                            name="subject"
                                            value={form.subject}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#005da9] focus:ring-2 focus:ring-[#005da9]/20"
                                        >
                                            <option value="">Chọn chủ đề</option>
                                            <option value="cuu-tro">Yêu cầu cứu trợ khẩn cấp</option>
                                            <option value="ho-tro-ky-thuat">Hỗ trợ kỹ thuật ứng dụng</option>
                                            <option value="tinh-nguyen-vien">Đăng ký tình nguyện viên</option>
                                            <option value="gop-y">Đóng góp ý kiến</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Nội dung tin nhắn</label>
                                    <Textarea
                                        name="message"
                                        value={form.message}
                                        onChange={handleChange}
                                        placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                                        rows={5}
                                        required
                                        className="focus:ring-[#0063cc]/40"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#005da9] px-8 py-3 text-base font-bold text-white transition-all duration-200 hover:bg-[#004b8d] active:scale-95 disabled:opacity-50"
                                >
                                    <Send size={18} />
                                    {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                                </button>

                                {sent && (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                        Đã gửi thành công. Cảm ơn bạn đã liên hệ.
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-6 shadow-sm animate-slide-up">
                                <h3 className="text-xl font-extrabold text-red-700">Hotline Khẩn Cấp</h3>
                                <div className="mt-2 flex items-end gap-3">
                                    <span className="text-5xl font-black text-red-700">114</span>
                                    <p className="text-sm text-red-700">Hoạt động 24/7 cho các tình huống cứu nạn, cứu hộ trực tiếp.</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Địa chỉ văn phòng</h4>
                                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                                            Tòa nhà Điều phối Trung tâm,<br />
                                            Số 18, Đường Giải Phóng, Quận Hai Bà Trưng, Quảng Bình
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Hỗ trợ kỹ thuật</h4>
                                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                                            support@rescuesystem.vn<br />
                                            024.3322.1100
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-sm font-bold text-slate-900">Mạng xã hội</h4>
                                <div className="mt-3 flex gap-2">
                                    <Link to="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-blue-50 hover:text-blue-600">
                                        <Facebook size={16} />
                                    </Link>
                                    <Link to="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-blue-50 hover:text-blue-600">
                                        <Twitter size={16} />
                                    </Link>
                                    <Link to="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-blue-50 hover:text-blue-600">
                                        <Youtube size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-6 mb-20">
                    <div className="h-[420px] overflow-hidden rounded-xl border border-slate-200 shadow-sm relative">
                        <GoogleMap center={mapCenter} markerPosition={mapCenter} zoom={12} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="rounded-xl border border-white bg-white/90 p-5 text-center shadow-lg">
                                <p className="text-xs font-bold uppercase tracking-wider text-[#005da9]">Văn phòng Trung tâm</p>
                                <p className="mt-1 text-sm font-semibold text-slate-700">Quảng Bình, Việt Nam</p>
                                <button
                                    type="button"
                                    onClick={() => setMapCenter({ lat: 21.021069, lng: 105.829981 })}
                                    className="mt-3 text-xs font-bold text-[#005da9] hover:underline inline-flex items-center gap-1"
                                >
                                    CHỈ ĐƯỜNG <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                        <div className="absolute bottom-4 right-4 rounded-md bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Mapbox API v3
                        </div>
                    </div>
                </section>
            </main>
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
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Liên kết
                                </h4>
                                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                    <li>
                                        <Link to={PUBLIC_ROUTES.HOME} className="hover:text-blue-600">
                                            Trang chủ
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={PUBLIC_ROUTES.EMERGENCY_GUIDE} className="hover:text-blue-600">
                                            Hướng dẫn khẩn cấp
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={PUBLIC_ROUTES.CONTACT} className="hover:text-blue-600">
                                            Liên hệ hỗ trợ
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Thông tin
                                </h4>
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
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Kết nối
                            </h4>
                            <div className="mt-3 flex gap-3 md:justify-end">
                                <Link
                                    to="#"
                                    className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                >
                                    <Facebook size={16} className="text-slate-600" />
                                </Link>
                                <Link
                                    to="#"
                                    className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                >
                                    <Twitter size={16} className="text-slate-600" />
                                </Link>
                                <Link
                                    to="#"
                                    className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                >
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
        </div>
    );
}
