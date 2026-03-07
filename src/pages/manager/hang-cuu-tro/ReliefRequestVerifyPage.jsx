import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CircleX, Edit3, FileText, Info, Printer, Share2 } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import { approveReliefRequest, getReliefRequest, rejectReliefRequest } from '../../../features/relief/api.js';

const PRIORITY_STYLES = {
    KHAN_CAP: { label: 'KHAN CAP', className: 'bg-rose-100 text-rose-700' },
    TRUNG_BINH: { label: 'TRUNG BINH', className: 'bg-amber-100 text-amber-700' },
    THAP: { label: 'THAP', className: 'bg-slate-100 text-slate-700' },
};

const sampleRequest = {
    id: 'REQ-12845',
    code: 'REQ-12845',
    title: 'Xac minh Yeu cau Cuu tro',
    sentAt: '14:30, 20/10/2023',
    status: 'Cho duyet',
    person: {
        fullName: 'Nguyen Van An',
        phone: '0901 234 567',
        address: '123 Duong B, Phuong Vinh Ninh, Thanh pho Hue, Thua Thien Hue',
        emergency:
            'Nuoc dang cao den tang 2, mat dien hoan toan. Trong nha co 2 nguoi gia va 1 tre em 3 tuoi. Can ho tro di doi khan cap hoac tiep te nhu yeu pham.',
    },
    items: [
        { name: 'Nuoc sach (Loc 6 chai)', quantity: '03 loc', priority: 'KHAN_CAP' },
        { name: 'Luong kho / Mi tom', quantity: '02 thung', priority: 'KHAN_CAP' },
        { name: 'Bo so cuu co ban', quantity: '01 bo', priority: 'TRUNG_BINH' },
    ],
    duplicateHint: 'Khong tim thay yeu cau trung lap thong tin nguoi nhan tai dia chi nay.',
};

function formatDate(dateValue) {
    if (!dateValue) return '';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return String(dateValue);
    return parsed.toLocaleString('vi-VN');
}

function normalizePriority(priority) {
    const normalized = String(priority || 'THAP').trim().toUpperCase();
    if (normalized.includes('KHAN')) return 'KHAN_CAP';
    if (normalized.includes('TRUNG')) return 'TRUNG_BINH';
    return 'THAP';
}

function normalizeStatus(status) {
    const normalized = String(status || '').trim().toUpperCase();
    if (normalized.includes('PENDING') || normalized.includes('CHO_DUYET') || normalized.includes('WAITING')) {
        return 'Cho duyet';
    }
    if (normalized.includes('APPROVED') || normalized.includes('DA_DUYET')) {
        return 'Da duyet';
    }
    if (normalized.includes('REJECTED') || normalized.includes('TU_CHOI')) {
        return 'Tu choi';
    }
    return status || 'Cho duyet';
}

function mapRequestDetail(req) {
    const list = Array.isArray(req?.items)
        ? req.items
        : Array.isArray(req?.essentialItems)
            ? req.essentialItems
            : Array.isArray(req?.lines)
                ? req.lines
                : [];

    const items = list.map((item) => {
        if (typeof item === 'string') {
            return { name: item, quantity: '-', priority: 'THAP' };
        }
        return {
            name: item?.itemName || item?.name || item?.item || 'Mat hang',
            quantity: item?.quantity || item?.qty || '-',
            priority: normalizePriority(item?.priority || item?.urgentLevel),
        };
    });

    return {
        ...sampleRequest,
        ...req,
        code: req?.code || req?.requestCode || sampleRequest.code,
        title: 'Xac minh Yeu cau Cuu tro',
        sentAt: formatDate(req?.dateSent || req?.createdAt) || sampleRequest.sentAt,
        status: normalizeStatus(req?.status),
        person: {
            fullName: req?.sender?.name || req?.senderName || req?.contactName || sampleRequest.person.fullName,
            phone: req?.sender?.phone || req?.senderPhone || req?.contactPhone || sampleRequest.person.phone,
            address: req?.address || req?.targetAreaName || req?.targetArea || req?.area || req?.location || sampleRequest.person.address,
            emergency: req?.note || req?.description || req?.emergencyNote || sampleRequest.person.emergency,
        },
        items: items.length ? items : sampleRequest.items,
        duplicateHint: sampleRequest.duplicateHint,
    };
}

export default function ReliefRequestVerifyPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestId = searchParams.get('id');

    const [note, setNote] = useState('');
    const [request, setRequest] = useState(sampleRequest);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadRequestDetail = async () => {
            if (!requestId) {
                setRequest(sampleRequest);
                return;
            }

            try {
                setLoading(true);
                setError('');
                const data = await getReliefRequest(requestId);
                setRequest(mapRequestDetail(data));
            } catch (e) {
                setError(e?.message || 'Khong the tai chi tiet yeu cau.');
                setRequest({
                    ...sampleRequest,
                    id: requestId,
                    code: requestId,
                });
            } finally {
                setLoading(false);
            }
        };

        loadRequestDetail();
    }, [requestId]);

    const requestDisplayCode = useMemo(() => {
        return String(request?.code || request?.id || sampleRequest.id);
    }, [request]);

    const handleCreateDistributionSlip = () => {
        const selectedRequestId = requestId || request?.id || request?.code;
        const nextPath = selectedRequestId
            ? `${MANAGER_ROUTES.DISTRIBUTION_PLAN}?requestId=${encodeURIComponent(selectedRequestId)}`
            : MANAGER_ROUTES.DISTRIBUTION_PLAN;
        navigate(nextPath);
    };

    const handleApprove = async () => {
        if (!requestId) {
            window.alert('Khong tim thay id yeu cau de duyet.');
            return;
        }

        try {
            setSubmitting(true);
            await approveReliefRequest(requestId);
            window.alert('Da duyet yeu cau cuu tro thanh cong.');
            navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD);
        } catch (e) {
            window.alert(e?.message || 'Duyet yeu cau that bai. Vui long thu lai.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!requestId) {
            window.alert('Khong tim thay id yeu cau de tu choi.');
            return;
        }

        const reason = note.trim();
        if (!reason) {
            window.alert('Vui long nhap ghi chu truoc khi tu choi yeu cau.');
            return;
        }

        try {
            setSubmitting(true);
            await rejectReliefRequest(requestId, reason);
            window.alert('Da tu choi yeu cau cuu tro.');
            navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD);
        } catch (e) {
            window.alert(e?.message || 'Tu choi yeu cau that bai. Vui long thu lai.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-xs text-slate-500">
                <button onClick={() => navigate('/')} className="hover:text-slate-700">
                    Trang chu
                </button>{' '}
                /{' '}
                <button onClick={() => navigate(MANAGER_ROUTES.RELIEF_REQUEST_DASHBOARD)} className="hover:text-slate-700">
                    Danh sach yeu cau
                </button>{' '}
                / <span className="font-medium text-blue-600">Xac minh {requestDisplayCode}</span>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{request.title} #{requestDisplayCode}</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Gui luc: {request.sentAt} <span className="mx-2">.</span>{' '}
                        <span className="font-semibold text-amber-600">{request.status}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Printer className="h-4 w-4" />
                        In phieu
                    </button>
                    <button
                        onClick={handleCreateDistributionSlip}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                        <FileText className="h-4 w-4" />
                        Tao phieu phan phoi hang
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Share2 className="h-4 w-4" />
                        Chia se
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <section className="rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Info className="h-4 w-4 text-blue-600" />
                                Thong tin ca nhan
                            </h2>
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                Chinh sua
                            </button>
                        </div>
                        <div className="space-y-4 px-4 py-4 text-sm">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Ho va ten</p>
                                    <p className="mt-1 font-medium text-slate-800">{request.person.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">So dien thoai</p>
                                    <p className="mt-1 font-semibold text-blue-600">{request.person.phone}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Dia chi chi tiet</p>
                                <p className="mt-1 text-slate-700">{request.person.address}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Tinh huong hien tai</p>
                                <div className="mt-1 rounded-lg border border-rose-100 bg-rose-50 p-3 text-slate-700">
                                    {request.person.emergency}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Danh sach nhu yeu pham
                            </h2>
                        </div>
                        <div className="px-4 py-3">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                                        <th className="py-2">Hang muc</th>
                                        <th className="py-2">So luong</th>
                                        <th className="py-2">Uu tien</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {request.items.map((item, idx) => {
                                        const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.THAP;
                                        return (
                                            <tr key={`${item.name}-${idx}`} className="text-sm">
                                                <td className="py-3 text-slate-800">{item.name}</td>
                                                <td className="py-3 text-slate-700">{item.quantity}</td>
                                                <td className="py-3">
                                                    <span className={`rounded px-2 py-1 text-[10px] font-bold ${priority.className}`}>
                                                        {priority.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Anh minh chung</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-3 p-4">
                            <div className="aspect-square rounded-lg bg-gradient-to-br from-slate-700 to-slate-500" />
                            <div className="aspect-square rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-400" />
                            <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-slate-400">
                                <Edit3 className="h-6 w-6" />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="space-y-4">
                    <section className="rounded-xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <h2 className="text-sm font-semibold text-slate-900">Kiem tra trung lap</h2>
                            <p className="mt-1 text-xs text-slate-400">Phat hien cac yeu cau trung ban kinh 500m</p>
                        </div>
                        <div className="relative h-64 bg-slate-200">
                            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500" />
                            <span className="absolute left-[70%] top-[35%] h-3 w-3 rounded-full bg-rose-500" />
                            <span className="absolute left-[25%] top-[65%] h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="absolute left-[47%] top-[42%] rounded bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                                #{requestDisplayCode}
                            </span>
                        </div>
                        <div className="p-3">
                            <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{request.duplicateHint}</span>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Ghi chu xac minh (Noi bo)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={4}
                            placeholder="Nhap ghi chu sau khi goi dien xac minh..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:ring-2"
                        />
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                                onClick={handleApprove}
                                disabled={loading || submitting}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {submitting ? 'Dang xu ly...' : 'Duyet yeu cau'}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={loading || submitting}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CircleX className="h-4 w-4" />
                                {submitting ? 'Dang xu ly...' : 'Tu choi'}
                            </button>
                        </div>
                        <p className="mt-3 text-center text-xs text-slate-400">
                            Yeu cau duoc duyet se chuyen ngay den bo phan kho van.
                        </p>
                    </section>

                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                        <p className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            Kiem tra lai thong tin lien he truoc khi duyet de tranh trung lap ho so.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
