import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getPublicContentPage } from '../../features/content-pages/api.js';

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
