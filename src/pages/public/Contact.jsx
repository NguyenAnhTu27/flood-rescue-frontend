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

function Container({ children, className = '' }) {
    return <div className={`mx-auto w-full max-w-[90%] px-2 lg:px-3 ${className}`}>{children}</div>;
}

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

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
                <section className="border-b border-slate-100 bg-slate-50/50 py-10 sm:py-14">
                    <Container>
                        <div className="text-center">
                            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                                Liên hệ
                            </h1>
                            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
                                Gửi ý kiến, góp ý hoặc yêu cầu hỗ trợ. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                            </p>
                        </div>
                    </Container>
                </section>

                {/* ================= Contact content ================= */}
                <section className="py-12 sm:py-16">
                    <Container>
                        <div className="grid gap-10 lg:grid-cols-5">
                            {/* Left: Contact info cards */}
                            <div className="space-y-4 lg:col-span-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Mail size={20} />
                                    </div>
                                    <h3 className="mt-3 text-sm font-bold text-slate-900">Email</h3>
                                    <p className="mt-1 text-sm text-slate-600">support@cuuho.gov.vn</p>
                                    <p className="text-sm text-slate-600">hotro@cuuho.gov.vn</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Phone size={20} />
                                    </div>
                                    <h3 className="mt-3 text-sm font-bold text-slate-900">Điện thoại</h3>
                                    <p className="mt-1 text-sm text-slate-600">Tổng đài: 1900-xxxx</p>
                                    <p className="text-sm text-slate-600">Khẩn cấp: 114</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <MapPin size={20} />
                                    </div>
                                    <h3 className="mt-3 text-sm font-bold text-slate-900">Địa chỉ</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                        Trung tâm Điều phối Cứu hộ - Cứu trợ<br />
                                        Số 123 Đường Mẫu, Quận 1, TP. Hồ Chí Minh
                                    </p>
                                </div>
                            </div>

                            {/* Right: Form */}
                            <div className="lg:col-span-3">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                                    <h2 className="text-lg font-bold text-slate-900">Gửi tin nhắn</h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Điền form bên dưới, chúng tôi sẽ liên hệ lại bạn.
                                    </p>
                                    {sent && (
                                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                            Đã gửi thành công. Cảm ơn bạn đã liên hệ.
                                        </div>
                                    )}
                                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                    Họ và tên
                                                </label>
                                                <Input
                                                    name="name"
                                                    value={form.name}
                                                    onChange={handleChange}
                                                    placeholder="Nguyễn Văn A"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                    Email
                                                </label>
                                                <Input
                                                    name="email"
                                                    type="email"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    placeholder="email@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                    Số điện thoại
                                                </label>
                                                <Input
                                                    name="phone"
                                                    type="tel"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    placeholder="0900 xxx xxx"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                                    Chủ đề
                                                </label>
                                                <Input
                                                    name="subject"
                                                    value={form.subject}
                                                    onChange={handleChange}
                                                    placeholder="Yêu cầu hỗ trợ / Góp ý / Khác"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                                Nội dung
                                            </label>
                                            <Textarea
                                                name="message"
                                                value={form.message}
                                                onChange={handleChange}
                                                placeholder="Nội dung tin nhắn..."
                                                rows={4}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            <Send size={16} />
                                            {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                                        </button>
                                    </form>
                                </div>
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
            </main>
        </div>
    );
}
