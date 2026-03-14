import React, { useEffect, useMemo, useState } from 'react';
import { List, MapPin, Navigation, Plus } from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import { useNavigate } from 'react-router-dom';
import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import Button from '../../shared/ui/Button.jsx';
import { confirmRescueResult, getMyRescueRequests, reopenCancelledRequest } from '../../features/citizen/api.js';
import { getMyCitizenReliefRequests } from '../../features/relief/api.js';
import { getCitizenBlockState } from '../../shared/lib/storage.js';

const DEFAULT_CENTER = { lat: 10.8231, lng: 106.6297 };
const RESCUE_CONFIRM_DISMISSED_KEY = 'citizen_rescue_confirm_dismissed_ids';
const RELIEF_REJECTED_DISMISSED_KEY = 'citizen_relief_rejected_dismissed_ids';

function readDismissedIds() {
    try {
        const raw = window.localStorage.getItem(RESCUE_CONFIRM_DISMISSED_KEY);
        const arr = JSON.parse(raw || '[]');
        return Array.isArray(arr) ? arr.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0) : [];
    } catch {
        return [];
    }
}

function writeDismissedIds(ids) {
    try {
        const safe = Array.from(new Set((ids || []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)));
        window.localStorage.setItem(RESCUE_CONFIRM_DISMISSED_KEY, JSON.stringify(safe));
    } catch {
        // ignore
    }
}

function readReliefDismissedIds() {
    try {
        const raw = window.localStorage.getItem(RELIEF_REJECTED_DISMISSED_KEY);
        const arr = JSON.parse(raw || '[]');
        return Array.isArray(arr) ? arr.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0) : [];
    } catch {
        return [];
    }
}

function writeReliefDismissedIds(ids) {
    try {
        const safe = Array.from(new Set((ids || []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)));
        window.localStorage.setItem(RELIEF_REJECTED_DISMISSED_KEY, JSON.stringify(safe));
    } catch {
        // ignore
    }
}

function normalizeList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    return [];
}

export default function CitizenDashboard() {
    const navigate = useNavigate();
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [gpsReady, setGpsReady] = useState(false);
    const [gpsError, setGpsError] = useState('');
    const [latestRequest, setLatestRequest] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [hideCancelPrompt, setHideCancelPrompt] = useState(false);
    const [handledRescueConfirmRequestId, setHandledRescueConfirmRequestId] = useState(null);
    const [dismissedRescueConfirmIds, setDismissedRescueConfirmIds] = useState(() => readDismissedIds());
    const [latestRejectedRelief, setLatestRejectedRelief] = useState(null);
    const [dismissedRejectedReliefIds, setDismissedRejectedReliefIds] = useState(() => readReliefDismissedIds());
    const [citizenBlock, setCitizenBlock] = useState(() => getCitizenBlockState());

    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsError('Thiết bị không hỗ trợ định vị GPS.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = Number(position?.coords?.latitude);
                const lng = Number(position?.coords?.longitude);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    setMapCenter({ lat, lng });
                    setGpsReady(true);
                    setGpsError('');
                    return;
                }
                setGpsError('Không đọc được tọa độ GPS hợp lệ.');
            },
            () => {
                setGpsError('Không thể lấy GPS hiện tại. Đang dùng vị trí mặc định.');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, []);

    const loadLatestRequest = async () => {
        try {
            const response = await getMyRescueRequests({ page: 1, limit: 100 });
            const list = Array.isArray(response)
                ? response
                : Array.isArray(response?.content)
                    ? response.content
                    : Array.isArray(response?.data)
                        ? response.data
                        : Array.isArray(response?.items)
                            ? response.items
                            : [];

            const toTs = (val) => {
                const t = new Date(val || 0).getTime();
                return Number.isFinite(t) ? t : 0;
            };
            const sorted = [...list].sort((a, b) => toTs(b?.updatedAt || b?.createdAt) - toTs(a?.updatedAt || a?.createdAt));
            const pendingConfirm = sorted.find((r) => {
                const status = String(r?.status || '').toUpperCase();
                const confirm = String(r?.rescueResultConfirmationStatus || 'PENDING').toUpperCase();
                return Boolean(r?.waitingCitizenRescueConfirmation)
                    || (status === 'COMPLETED' && ['PENDING', '', 'NULL'].includes(confirm));
            });

            setLatestRequest(pendingConfirm || sorted[0] || null);
        } catch {
            setLatestRequest(null);
        }
    };

    const loadLatestRejectedRelief = async () => {
        try {
            const response = await getMyCitizenReliefRequests({ page: 0, size: 100 });
            const list = normalizeList(response);
            const sorted = [...list].sort((a, b) => {
                const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
                const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
                return tb - ta;
            });
            const rejected = sorted.find((r) => {
                const status = String(r?.status || '').toUpperCase();
                const delivery = String(r?.deliveryStatus || '').toUpperCase();
                const id = Number(r?.id || 0);
                return id > 0
                    && (status === 'CANCELLED' || delivery === 'REJECTED')
                    && !dismissedRejectedReliefIds.includes(id);
            });
            setLatestRejectedRelief(rejected || null);
        } catch {
            setLatestRejectedRelief(null);
        }
    };

    useEffect(() => {
        loadLatestRequest();
        loadLatestRejectedRelief();
        const id = window.setInterval(loadLatestRequest, 15000);
        const reliefId = window.setInterval(loadLatestRejectedRelief, 15000);
        const blockId = window.setInterval(() => {
            setCitizenBlock(getCitizenBlockState());
        }, 3000);
        return () => {
            window.clearInterval(id);
            window.clearInterval(reliefId);
            window.clearInterval(blockId);
        };
    }, [dismissedRejectedReliefIds]);

    const gpsLabel = useMemo(() => {
        if (!mapCenter) return 'Chưa có vị trí';
        return `${mapCenter.lat.toFixed(6)}, ${mapCenter.lng.toFixed(6)}`;
    }, [mapCenter]);

    const statusRaw = String(latestRequest?.status || '').toUpperCase();
    const latestId = Number(latestRequest?.id || 0);
    const waitingCitizenConfirmation = Boolean(
        latestRequest
        && (
            latestRequest.waitingCitizenRescueConfirmation
            || (
                statusRaw === 'COMPLETED'
                && ['PENDING', '', 'NULL'].includes(String(latestRequest.rescueResultConfirmationStatus || 'PENDING').toUpperCase())
            )
        )
    ) && latestId !== Number(handledRescueConfirmRequestId || 0)
        && !dismissedRescueConfirmIds.includes(latestId);
    const showCancelledPrompt = statusRaw === 'CANCELLED' && !hideCancelPrompt;
    const showRejectedReliefPrompt = Boolean(latestRejectedRelief?.id);

    const handleConfirmRescued = async () => {
        if (!latestRequest?.id || submitting) return;
        const targetId = latestRequest.id;
        const nextDismissed = Array.from(new Set([...dismissedRescueConfirmIds, Number(targetId)]));
        setDismissedRescueConfirmIds(nextDismissed);
        writeDismissedIds(nextDismissed);
        try {
            setSubmitting(true);
            await confirmRescueResult(targetId, { rescued: true });
            setHandledRescueConfirmRequestId(targetId);
            navigate(CITIZEN_ROUTES.FEEDBACK, { state: { requestId: targetId } });
        } catch (e) {
            const rollback = dismissedRescueConfirmIds.filter((id) => id !== Number(targetId));
            setDismissedRescueConfirmIds(rollback);
            writeDismissedIds(rollback);
            window.alert(e?.message || 'Không thể xác nhận đã được cứu hộ.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmNotRescued = async () => {
        if (!latestRequest?.id || submitting) return;
        const targetId = latestRequest.id;
        const nextDismissed = Array.from(new Set([...dismissedRescueConfirmIds, Number(targetId)]));
        setDismissedRescueConfirmIds(nextDismissed);
        writeDismissedIds(nextDismissed);
        try {
            setSubmitting(true);
            await confirmRescueResult(targetId, {
                rescued: false,
                reason: 'Chưa được cứu hộ nhưng đội cứu hộ đã bấm hoàn thành.',
            });
            setHandledRescueConfirmRequestId(targetId);
            window.alert('Đã tự động gửi lại yêu cầu cứu hộ cho điều phối.');
            await loadLatestRequest();
        } catch (e) {
            const rollback = dismissedRescueConfirmIds.filter((id) => id !== Number(targetId));
            setDismissedRescueConfirmIds(rollback);
            writeDismissedIds(rollback);
            window.alert(e?.message || 'Không thể gửi lại yêu cầu cứu hộ.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReopenCancelled = async () => {
        if (!latestRequest?.id || submitting) return;
        try {
            setSubmitting(true);
            const reason = latestRequest?.coordinatorCancelNote
                ? `Yêu cầu gửi lại sau khi bị hủy. Lý do hủy trước đó: ${latestRequest.coordinatorCancelNote}`
                : 'Yêu cầu gửi lại sau khi bị đội cứu hộ hủy.';
            await reopenCancelledRequest(latestRequest.id, reason);
            window.alert('Đã gửi lại yêu cầu cứu hộ.');
            setHideCancelPrompt(true);
            await loadLatestRequest();
        } catch (e) {
            window.alert(e?.message || 'Không thể gửi lại yêu cầu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDismissRejectedRelief = () => {
        const targetId = Number(latestRejectedRelief?.id || 0);
        if (!targetId) return;
        const next = Array.from(new Set([...dismissedRejectedReliefIds, targetId]));
        setDismissedRejectedReliefIds(next);
        writeReliefDismissedIds(next);
        setLatestRejectedRelief(null);
    };

    return (
        <div className="space-y-5 pb-8">
            {waitingCitizenConfirmation && (
                <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                    <h2 className="text-sm font-bold text-amber-900">Đội cứu hộ báo đã hoàn thành. Bạn đã được cứu hộ chưa?</h2>
                    <p className="mt-1 text-xs text-amber-800">
                        Nếu bạn chọn chưa được cứu hộ, hệ thống sẽ tự gửi lại yêu cầu cứu hộ cho điều phối với mô tả phù hợp.
                    </p>
                    <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3 text-xs text-slate-700">
                        <div><span className="font-semibold text-slate-900">Mã yêu cầu:</span> {latestRequest?.code || `#${latestRequest?.id || '—'}`}</div>
                        <div className="mt-1"><span className="font-semibold text-slate-900">Địa chỉ:</span> {latestRequest?.addressText || '—'}</div>
                        <div className="mt-1"><span className="font-semibold text-slate-900">Số người:</span> {latestRequest?.affectedPeopleCount || 1}</div>
                        <div className="mt-1"><span className="font-semibold text-slate-900">Ưu tiên hiện tại:</span> {latestRequest?.priority || 'MEDIUM'}</div>
                        <div className="mt-1"><span className="font-semibold text-slate-900">Mô tả:</span> {latestRequest?.description || '—'}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="primary" size="sm" onClick={handleConfirmRescued} disabled={submitting}>
                            Đã được cứu hộ
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleConfirmNotRescued} disabled={submitting}>
                            Chưa được cứu hộ
                        </Button>
                    </div>
                </section>
            )}

            {showCancelledPrompt && (
                <section className="rounded-2xl border border-rose-300 bg-rose-50 p-4">
                    <h2 className="text-sm font-bold text-rose-900">Yêu cầu cứu hộ đã bị hủy</h2>
                    <p className="mt-1 text-xs text-rose-800">
                        {latestRequest?.coordinatorCancelNote
                            ? `Lý do hủy: ${latestRequest.coordinatorCancelNote}`
                            : 'Đội cứu hộ đã hủy yêu cầu này.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="primary" size="sm" onClick={handleReopenCancelled} disabled={submitting}>
                            Gửi lại yêu cầu
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setHideCancelPrompt(true)} disabled={submitting}>
                            Đã rõ
                        </Button>
                    </div>
                </section>
            )}

            {showRejectedReliefPrompt && (
                <section className="rounded-2xl border border-rose-300 bg-rose-50 p-4">
                    <h2 className="text-sm font-bold text-rose-900">Yêu cầu cứu trợ bị từ chối</h2>
                    <p className="mt-1 text-xs text-rose-800">
                        {latestRejectedRelief?.deliveryNote
                            ? `Lý do: ${latestRejectedRelief.deliveryNote}`
                            : 'Yêu cầu cứu trợ của bạn đã bị từ chối.'}
                    </p>
                    <div className="mt-2 rounded-xl border border-rose-200 bg-white p-3 text-xs text-slate-700">
                        <div><span className="font-semibold text-slate-900">Mã yêu cầu:</span> {latestRejectedRelief?.code || `#${latestRejectedRelief?.id || '—'}`}</div>
                        <div className="mt-1"><span className="font-semibold text-slate-900">Địa chỉ:</span> {latestRejectedRelief?.targetArea || latestRejectedRelief?.citizenAddressText || '—'}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={handleDismissRejectedRelief} disabled={submitting}>
                            Đã rõ
                        </Button>
                    </div>
                </section>
            )}

            {citizenBlock?.blocked && (
                <section className="rounded-2xl border border-rose-300 bg-rose-50 p-4">
                    <h2 className="text-sm font-bold text-rose-900">Bạn đang bị khóa gửi yêu cầu</h2>
                    <p className="mt-1 text-xs text-rose-800">
                        {citizenBlock?.reason || 'Điều phối đã khóa quyền gửi yêu cầu của tài khoản này.'}
                    </p>
                </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">Vị trí hiện tại của bạn (GPS)</h2>
                    <p className="mt-1 text-xs text-slate-600 inline-flex items-center gap-1">
                        <Navigation className="h-3.5 w-3.5" />
                        {gpsReady ? 'Đã lấy GPS thành công' : 'Đang dùng vị trí hiện tại'}: {gpsLabel}
                    </p>
                    {gpsError && (
                        <p className="mt-1 text-xs text-rose-600">{gpsError}</p>
                    )}
                </div>

                <div className="relative h-[420px] w-full bg-slate-100">
                    <GoogleMap
                        center={mapCenter}
                        zoom={15}
                        markerPosition={mapCenter}
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-slate-700 shadow">
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-blue-600" />
                            Vị trí của bạn
                        </span>
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/60 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Bảng điều khiển công dân</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Tạo yêu cầu cứu hộ mới hoặc kiểm tra các yêu cầu đã gửi ngay bên dưới.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                            <Navigation className="h-3.5 w-3.5 text-blue-600" />
                            {gpsReady ? 'GPS sẵn sàng để gửi yêu cầu' : 'Khuyến nghị bật GPS để định vị chính xác'}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={Boolean(citizenBlock?.blocked)}
                            onClick={() => navigate(CITIZEN_ROUTES.CREATE_RESCUE_REQUEST)}
                        >
                            <Plus className="h-4 w-4" />
                            Tạo yêu cầu cứu hộ
                        </Button>
                        <Button
                            to={CITIZEN_ROUTES.MY_RESCUE_REQUESTS}
                            variant="secondary"
                            size="lg"
                            fullWidth
                        >
                            <List className="h-4 w-4" />
                            Xem yêu cầu đã tạo
                        </Button>
                    </div>
                </div>
            </section>

        </div>
    );
}
