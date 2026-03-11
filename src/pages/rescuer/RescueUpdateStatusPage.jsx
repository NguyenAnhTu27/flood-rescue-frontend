import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    MessageCircle,
    Phone,
    RefreshCcw,
    Send,
    Truck,
    Flag,
    Wrench,
} from 'lucide-react';

import Card from '../../shared/ui/Card.jsx';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { updateRescueRequestStatusAsRescuer } from '../../features/rescuer/api.js';

function pickFirstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return null;
}

const STATUS_STEPS = [
    {
        key: 'DEPARTED',
        title: 'Đã xuất phát',
        subtitle: 'Ghi nhận mốc bắt đầu di chuyển',
        icon: Truck,
        color: 'bg-blue-50 text-blue-600',
    },
    {
        key: 'ARRIVED',
        title: 'Đã đến nơi',
        subtitle: 'Xác nhận có mặt tại hiện trường',
        icon: Flag,
        color: 'bg-green-50 text-green-600',
    },
    {
        key: 'WORKING',
        title: 'Đang xử lý',
        subtitle: 'Đang thực hiện nghiệp vụ cứu hộ',
        icon: Wrench,
        color: 'bg-amber-50 text-amber-600',
    },
];

export default function RescueUpdateStatusPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    // Prefer taskGroup code; fallback to rescue request code; then placeholder
    const code = useMemo(() => {
        const mission = state?.mission || null;
        const raw = mission?.raw || {};
        return String(
            pickFirstTruthy(
                state?.code,
                mission?.code,
                raw?.code,
                raw?.taskGroupCode,
                raw?.rescueRequestCode,
                state?.taskGroupCode,
                '—'
            )
        );
    }, [state]);

    const [headerStatus, setHeaderStatus] = useState(
        String(pickFirstTruthy(state?.statusLabel, state?.status, 'CHỜ BÁO CÁO'))
    );
    const reportTitle = String(pickFirstTruthy(state?.reportTitle, 'Báo cáo nhiệm vụ'));
    const leaderName = String(pickFirstTruthy(state?.leaderName, state?.teamLeaderName, 'Chưa cập nhật'));
    const pendingReports = Number(pickFirstTruthy(state?.pendingReports, 0)) || 0;

    const gpsText = useMemo(() => {
        const mission = state?.mission || null;
        const lat = mission?.latitude;
        const lng = mission?.longitude;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        return '—';
    }, [state]);

    const [selectedStep, setSelectedStep] = useState(STATUS_STEPS[0].key);
    const [savingStep, setSavingStep] = useState(false);
    const [sending, setSending] = useState(false);

    const requestId = useMemo(() => {
        const mission = state?.mission || null;
        const raw = mission?.raw || {};
        const rr0 =
            (Array.isArray(raw?.requests) && raw.requests[0]) ||
            (Array.isArray(raw?.rescueRequests) && raw.rescueRequests[0]) ||
            null;
        const id = pickFirstTruthy(
            state?.requestId,
            state?.request?.id,
            rr0?.id,
            (Array.isArray(raw?.rescueRequestIds) && raw.rescueRequestIds[0]) || null,
            (Array.isArray(raw?.requestIds) && raw.requestIds[0]) || null
        );
        const n = Number(id);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [state]);

    function mapStepToStatusCandidates(stepKey) {
        const key = String(stepKey || '').toUpperCase();
        if (key === 'DEPARTED') return ['ASSIGNED', 'ON_THE_WAY', 'EN_ROUTE', 'DEPARTED'];
        if (key === 'ARRIVED') return ['ARRIVED', 'AT_SCENE', 'ON_SITE', 'IN_PROGRESS'];
        if (key === 'WORKING') return ['IN_PROGRESS', 'WORKING', 'PROCESSING'];
        return ['IN_PROGRESS'];
    }

    async function handleSelectStep(stepKey) {
        setSelectedStep(stepKey);

        if (!requestId) {
            window.alert('Không tìm thấy requestId để cập nhật trạng thái. Vui lòng mở từ dashboard.');
            return;
        }

        const candidates = mapStepToStatusCandidates(stepKey);
        const note = `RESCUER_STEP:${stepKey}`;

        setSavingStep(true);
        try {
            let lastErr = null;
            for (const st of candidates) {
                try {
                    await updateRescueRequestStatusAsRescuer(requestId, st, note);
                    setHeaderStatus(st);
                    window.alert('Cập nhật trạng thái thành công!');
                    return;
                } catch (e) {
                    lastErr = e;
                    // if 400/422 -> try next status candidate; if 403/500 -> stop
                    if (e?.status === 400 || e?.status === 422) continue;
                    throw e;
                }
            }
            throw lastErr || new Error('Cannot update status');
        } catch (e) {
            console.error('[RescueUpdateStatusPage] update status failed', e);
            window.alert(e?.message || 'Cập nhật trạng thái thất bại. Vui lòng thử lại.');
        } finally {
            setSavingStep(false);
        }
    }

    const timeline = useMemo(() => {
        const t = Array.isArray(state?.timeline) ? state.timeline : [];
        if (t.length > 0) return t;
        return [];
    }, [state, gpsText]);

    async function handleSendNow() {
        try {
            setSending(true);
            await handleSelectStep(selectedStep);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-3 pb-24 pt-3">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Quay lại
                </button>

                <div className="flex items-center gap-2">
                    <Badge size="sm" className="bg-slate-100 text-slate-700">
                        {code}
                    </Badge>
                    <Badge size="sm" className="bg-amber-100 text-amber-700">
                        {headerStatus}
                    </Badge>
                </div>
            </div>

            {/* Header */}
            <Card className="px-4 py-4">
                <div className="text-base font-semibold text-slate-900">{reportTitle}</div>
                <div className="mt-1 text-xs text-slate-600">Đội trưởng: {leaderName}</div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div className="text-xs text-slate-700">
                        <span className="font-semibold text-rose-600">{pendingReports}</span> báo cáo đang chờ gửi
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        onClick={handleSendNow}
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        THỬ LẠI
                    </button>
                </div>
            </Card>

            {/* Status steps */}
            <Card className="px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Báo cáo trạng thái (kèm GPS)
                </div>

                <div className="mt-3 flex flex-col gap-3">
                    {STATUS_STEPS.map((s) => {
                        const Icon = s.icon;
                        const active = selectedStep === s.key;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => handleSelectStep(s.key)}
                                disabled={savingStep}
                                className={[
                                    'flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition',
                                    active
                                        ? 'border-blue-200 bg-blue-50/40 shadow-sm'
                                        : 'border-slate-200 bg-white hover:bg-slate-50',
                                    savingStep ? 'opacity-70 cursor-not-allowed' : '',
                                ].join(' ')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${s.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                                        <div className="text-xs text-slate-600">{s.subtitle}</div>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                            </button>
                        );
                    })}
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        GPS: <span className="font-mono">{gpsText}</span>
                    </span>
                    <Button
                        variant="primary"
                        size="sm"
                        disabled={sending}
                        onClick={handleSendNow}
                        className="inline-flex items-center gap-1"
                    >
                        <Send className="h-4 w-4" />
                        {sending ? 'Đang gửi...' : 'Gửi nhanh'}
                    </Button>
                </div>
            </Card>

            {/* Timeline */}
            <Card className="px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Lịch sử mốc thời gian
                </div>
                <div className="mt-3 space-y-3">
                    {timeline.length === 0 && (
                        <div className="text-xs text-slate-500">Chưa có lịch sử trạng thái từ hệ thống.</div>
                    )}
                    {timeline.map((t) => (
                        <div key={t.id || t.time} className="flex gap-3">
                            <div className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                            <div className="flex-1">
                                <div className="text-xs font-semibold text-slate-800">{t.label || '—'}</div>
                                <div className="mt-0.5 text-[11px] text-slate-500">
                                    {t.time || '--:--:--'}
                                    {t.meta ? ` · ${t.meta}` : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Bottom actions (fixed) */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-md items-center justify-around px-3 py-2 text-xs text-slate-600">
                    <button
                        type="button"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 hover:bg-slate-50"
                        disabled
                    >
                        <MessageCircle className="h-4 w-4" />
                        Nhắn tin
                    </button>
                    <button
                        type="button"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 hover:bg-slate-50"
                        disabled
                    >
                        <Phone className="h-4 w-4" />
                        Gọi đội
                    </button>
                </div>
            </div>
        </div>
    );
}
