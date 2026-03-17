import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminContentPages, updateAdminContentPages } from '../../features/content-pages/api.js';
import httpClient from '../../shared/lib/http.js';
import { ADMIN_ROUTES } from '../../app/routes/route.constants.js';

const DEFAULT_VALUES = {
    termsTitle: 'Tuyên bố miễn trừ trách nhiệm',
    termsContent: '',
    termsLabel: 'Tuyên bố miễn trừ trách nhiệm',
    privacyTitle: 'Chính sách bảo mật',
    privacyContent: '',
    privacyLabel: 'Chính sách bảo mật',
    supportTitle: 'Liên hệ hỗ trợ',
    supportContent: '',
    supportLabel: 'Liên hệ hỗ trợ',
};

export default function ContentPagesSettingsPage() {
    const [form, setForm] = useState(DEFAULT_VALUES);
    const [pageLabels, setPageLabels] = useState({
        terms: DEFAULT_VALUES.termsLabel,
        privacy: DEFAULT_VALUES.privacyLabel,
        support: DEFAULT_VALUES.supportLabel,
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const load = async () => {
        try {
            setMessage('');
            setMessageType('');
            const [data, settingsResp] = await Promise.all([
                getAdminContentPages(),
                httpClient.get('/admin/system-settings').catch(() => null),
            ]);
            const values = settingsResp?.values || {};
            setForm((prev) => ({ ...prev, ...data }));
            setPageLabels({
                terms: String(values.footerTermsLabel || data?.termsLabel || DEFAULT_VALUES.termsLabel).trim(),
                privacy: String(values.footerPrivacyLabel || data?.privacyLabel || DEFAULT_VALUES.privacyLabel).trim(),
                support: String(values.footerSupportLabel || data?.supportLabel || DEFAULT_VALUES.supportLabel).trim(),
            });
        } catch (e) {
            setMessage(e?.message || 'Không thể tải nội dung trang.');
            setMessageType('error');
        }
    };

    useEffect(() => {
        load();
    }, []);

    const save = async () => {
        try {
            setSaving(true);
            setMessage('');
            setMessageType('');
            const payload = {
                termsTitle: form.termsTitle,
                termsContent: form.termsContent,
                privacyTitle: form.privacyTitle,
                privacyContent: form.privacyContent,
                supportTitle: form.supportTitle,
                supportContent: form.supportContent,
            };
            if (Object.keys(payload).length === 0) {
                setMessage('Không có nội dung hợp lệ để lưu.');
                return;
            }
            const resp = await updateAdminContentPages(payload);
            setMessage(resp?.message || 'Đã lưu nội dung trang.');
            setMessageType('success');
            window.dispatchEvent(new Event('runtime-settings-updated'));
            await load();
        } catch (e) {
            setMessage(e?.message || 'Không thể lưu nội dung trang.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h1 className="text-2xl font-bold text-slate-900">Nội dung trang công khai</h1>
                <p className="mt-1 text-slate-600">Admin có thể chỉnh sửa nội dung các trang public đang được hiển thị ở footer và điều hướng công khai.</p>
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Lưu ý về Tuyên bố miễn trừ trách nhiệm</p>
                    <p className="mt-1 leading-6">
                        Nếu ở cấu hình hệ thống bạn đã đổi nhãn link miễn trừ trách nhiệm thành <strong>"{pageLabels.terms}"</strong>,
                        thì nội dung của trang đó vẫn đang được quản lý bằng nhóm <strong>terms</strong> bên dưới.
                        Nói cách khác, phần này chính là nơi để sửa nội dung cho trang miễn trừ trách nhiệm hiện tại.
                    </p>
                    <div className="mt-3">
                        <Link to={ADMIN_ROUTES.SYSTEM_SETTINGS} className="font-semibold text-blue-700 hover:text-blue-900">
                            Mở cấu hình hệ thống để đổi nhãn footer
                        </Link>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
                <div className="grid gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trang 1</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900">{pageLabels.terms}</h2>
                        <p className="text-sm text-slate-500">Route hiện tại: /tuyen-bo-mien-tru-trach-nhiem</p>
                    </div>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Tiêu đề trang {pageLabels.terms}</span>
                        <input value={form.termsTitle} onChange={(e) => updateField('termsTitle', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nội dung {pageLabels.terms}</span>
                        <textarea value={form.termsContent} onChange={(e) => updateField('termsContent', e.target.value)} rows={8} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nhãn link ở footer</span>
                        <input value={form.termsLabel} onChange={(e) => updateField('termsLabel', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                </div>

                <div className="grid gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trang 2</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900">{pageLabels.privacy}</h2>
                        <p className="text-sm text-slate-500">Route hiện tại: /chinh-sach-bao-mat</p>
                    </div>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Tiêu đề trang {pageLabels.privacy}</span>
                        <input value={form.privacyTitle} onChange={(e) => updateField('privacyTitle', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nội dung {pageLabels.privacy}</span>
                        <textarea value={form.privacyContent} onChange={(e) => updateField('privacyContent', e.target.value)} rows={8} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nhãn link ở footer</span>
                        <input value={form.privacyLabel} onChange={(e) => updateField('privacyLabel', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                </div>

                <div className="grid gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trang 3</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900">{pageLabels.support}</h2>
                        <p className="text-sm text-slate-500">Route hiện tại: /lien-he-ho-tro</p>
                    </div>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Tiêu đề trang {pageLabels.support}</span>
                        <input value={form.supportTitle} onChange={(e) => updateField('supportTitle', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nội dung {pageLabels.support}</span>
                        <textarea value={form.supportContent} onChange={(e) => updateField('supportContent', e.target.value)} rows={8} className="w-full rounded-lg border p-2" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-slate-600">Nhãn link ở footer</span>
                        <input value={form.supportLabel} onChange={(e) => updateField('supportLabel', e.target.value)} className="w-full rounded-lg border p-2" />
                    </label>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                    >
                        {saving ? 'Đang lưu...' : 'Lưu nội dung'}
                    </button>
                    {message && (
                        <p className={`text-sm ${messageType === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
