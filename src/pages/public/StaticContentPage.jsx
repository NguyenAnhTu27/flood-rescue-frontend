import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getPublicContentPage } from '../../features/content-pages/api.js';
import { Globe, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

const PAGE_KEY_BY_PATH = {
    '/dieu-khoan-su-dung': 'terms',
    '/chinh-sach-bao-mat': 'privacy',
    '/lien-he-ho-tro': 'support',
};

const DEFAULT_TITLE_BY_KEY = {
    terms: 'Điều khoản sử dụng',
    privacy: 'Chính sách bảo mật',
    support: 'Liên hệ hỗ trợ',
};

export default function StaticContentPage() {
    const location = useLocation();
    const pageKey = useMemo(() => PAGE_KEY_BY_PATH[location.pathname] || 'terms', [location.pathname]);

    const [data, setData] = useState({ title: DEFAULT_TITLE_BY_KEY[pageKey], content: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [form, setForm] = useState({ name: '', email: '', phone: '', topic: 'Yêu cầu cứu hộ khẩn cấp', message: '' });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const resp = await getPublicContentPage(pageKey);
                setData({
                    title: resp?.title || DEFAULT_TITLE_BY_KEY[pageKey],
                    content: resp?.content || '',
                });
            } catch (e) {
                setError(e?.message || 'Không thể tải nội dung trang.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [pageKey]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            // TODO: Gọi API gửi thông tin liên hệ
            await new Promise((resolve) => setTimeout(resolve, 700));
            window.alert('Cảm ơn bạn! Chúng tôi đã nhận được yêu cầu và sẽ phản hồi sớm.');
            setForm({ name: '', email: '', phone: '', topic: 'Yêu cầu cứu trợ khẩn cấp', message: '' });
        } catch {
            window.alert('Gửi không thành công. Vui lòng thử lại sau.');
        } finally {
            setSending(false);
        }
    };

    if (pageKey === 'support') {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto w-full max-w-6xl px-4 py-16">
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Liên hệ với chúng tôi</h1>
                        <p className="mt-2 text-base text-slate-600">
                            Đội ngũ điều phối luôn sẵn sàng lắng nghe và hỗ trợ cộng đồng 24/7 trong mọi tình huống khẩn cấp.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-8 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl bg-white p-8 shadow-lg">
                                <h2 className="text-lg font-semibold text-slate-900">Gửi tin nhắn phản hồi</h2>
                                <p className="mt-1 text-sm text-slate-500">Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>

                                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Họ và tên</span>
                                            <input
                                                value={form.name}
                                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                                required
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                placeholder="Nguyễn Văn A"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Email</span>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                                required
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                placeholder="example@gmail.com"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Số điện thoại</span>
                                            <input
                                                value={form.phone}
                                                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                placeholder="090x xxx xxx"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Chủ đề</span>
                                            <select
                                                value={form.topic}
                                                onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option>Yêu cầu cứu hộ khẩn cấp</option>
                                                <option>Yêu cầu cứu trợ khẩn cấp</option>
                                                <option>Hỗ trợ kỹ thuật</option>
                                                <option>Phản hồi về ứng dụng</option>
                                                <option>Khác</option>
                                            </select>
                                        </label>
                                    </div>

                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Nội dung tin nhắn</span>
                                        <textarea
                                            value={form.message}
                                            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                                            required
                                            rows={5}
                                            className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            placeholder="Mô tả chi tiết vấn đề bạn đang cần hỗ trợ..."
                                        />
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="space-y-6">
                                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-rose-700">Hotline Khẩn Cấp</h3>
                                            <p className="mt-1 text-sm text-rose-600">Hoạt động 24/7 cho các tình huống cứu nạn, cứu hộ trực tiếp.</p>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2">
                                            <Phone className="h-5 w-5 text-rose-600" />
                                            <span className="text-xl font-bold text-rose-700">114</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-slate-900">Địa chỉ văn phòng</h3>
                                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                                        <p className="flex items-start gap-2">
                                            <MapPin className="h-5 w-5 text-blue-500" />
                                            <span>
                                                Tòa nhà Điều phối Trung tâm, Số 18, Đường Giải Phóng, Quận Hai Bà Trưng, Hà Nội.
                                            </span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <Mail className="h-5 w-5 text-slate-500" />
                                            <span>support@rescuesystem.vn</span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <Phone className="h-5 w-5 text-slate-500" />
                                            <span>024.3322.1100</span>
                                        </p>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <span className="text-sm font-medium text-slate-500">Mạng xã hội</span>
                                        <a
                                            href="#"
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm transition hover:bg-slate-200"
                                            aria-label="Facebook"
                                        >
                                            <Globe className="h-5 w-5" />
                                        </a>
                                        <a
                                            href="#"
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm transition hover:bg-slate-200"
                                            aria-label="Twitter"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                        </a>
                                    </div>
                                </div>

                                <div className="relative overflow-hidden rounded-3xl shadow-lg">
                                    <iframe
                                        title="Bản đồ văn phòng"
                                        className="h-72 w-full border-0"
                                        loading="lazy"
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.800224470857!2d105.84070291534566!3d21.013594092627768!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab2b4d2dacc7%3A0x3f7b75a4486a1c41!2zVGjDtG5nIMSQw6xuaCBMaXQgQmG7mWMgVGjhuqluZywgSMOgbmggSMOqIHRpbiwgSOG7kyBI4buNY2ggQ-G7kWkgR2lhIELDqm4sIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1700413443162!5m2!1svi!2s"
                                    />
                                    <div className="absolute inset-0 bg-black/30" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 py-16 text-center text-white">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                                            <MapPin className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Văn phòng Trung tâm</p>
                                            <p className="mt-1 text-lg font-bold">Hà Nội, Việt Nam</p>
                                        </div>
                                        <a
                                            href="https://www.google.com/maps/search/?api=1&query=21.0136,105.8422"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/30"
                                        >
                                            Chỉ đường
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl px-2 py-8 lg:px-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">
                <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
                {loading ? (
                    <p className="mt-4 text-sm text-slate-500">Đang tải nội dung...</p>
                ) : error ? (
                    <p className="mt-4 text-sm text-rose-600">{error}</p>
                ) : (
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{data.content || 'Nội dung đang được cập nhật.'}</div>
                )}
            </article>
        </div>
    );
}
