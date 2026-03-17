import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Users, AlertTriangle, Info } from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import MapBox from '../../features/map/components/MapBox.jsx';
import {
    cancelMyCitizenReliefRequest,
    getMyCitizenReliefRequests,
    getReliefRequest,
} from '../../features/relief/api.js';

function pickFirstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return null;
}

function normalizeStatus(s) {
    return String(s || '').toUpperCase();
}

function parseNoteField(note, label) {
    const lines = String(note || '').split('\n');
    const line = lines.find((ln) => ln.trim().startsWith(`${label}:`));
    if (!line) return '';
    return line.replace(`${label}:`, '').trim();
}

function deliveryToActiveStep(statusRaw) {
    const s = normalizeStatus(statusRaw);
    if (!s) return 1;
    if (['REJECTED', 'CANCELLED'].includes(s)) return 1;
    if (['COMPLETED', 'DONE'].includes(s)) return 6;
    if (['ARRIVED_RELIEF_POINT'].includes(s)) return 5;
    if (['ARRIVED_WAREHOUSE'].includes(s)) return 4;
    if (['RESCUER_RECEIVED'].includes(s)) return 3;
    if (['MANAGER_APPROVED'].includes(s)) return 2;
    return 1;
}

function statusToHeaderLabel(statusRaw) {
    const s = normalizeStatus(statusRaw);
    if (['REJECTED', 'CANCELLED'].includes(s)) return 'ĐÃ TỪ CHỐI';
    if (['COMPLETED', 'DONE'].includes(s)) return 'HOÀN THÀNH';
    if (['ARRIVED_RELIEF_POINT'].includes(s)) return 'ĐANG GIAO HÀNG';
    if (['ARRIVED_WAREHOUSE'].includes(s)) return 'ĐÃ TỚI KHO';
    if (['RETURNED_TO_WAREHOUSE'].includes(s)) return 'ĐÃ TRẢ VỀ KHO';
    if (['RESCUER_RECEIVED'].includes(s)) return 'ĐỘI ĐÃ NHẬN YÊU CẦU';
    if (['MANAGER_APPROVED'].includes(s)) return 'ĐÃ ĐIỀU PHỐI';
    return 'ĐANG XỬ LÝ';
}

function deliveryMapStatusMeta(statusRaw) {
    const s = normalizeStatus(statusRaw);
    if (s === 'ARRIVED_WAREHOUSE') return { label: 'Đội cứu hộ đã tới kho', chip: 'bg-amber-100 text-amber-700' };
    if (s === 'ARRIVED_RELIEF_POINT') return { label: 'Đội cứu hộ đang đi giao hàng', chip: 'bg-blue-100 text-blue-700' };
    if (s === 'COMPLETED') return { label: 'Đội cứu hộ đã hoàn thành giao cứu trợ', chip: 'bg-emerald-100 text-emerald-700' };
    if (s === 'RESCUER_RECEIVED') return { label: 'Đội cứu hộ đã nhận yêu cầu', chip: 'bg-cyan-100 text-cyan-700' };
    if (s === 'MANAGER_APPROVED') return { label: 'Yêu cầu đã được điều phối', chip: 'bg-indigo-100 text-indigo-700' };
    return { label: 'Đang chờ xử lý', chip: 'bg-slate-100 text-slate-700' };
}

function priorityMeta(priority) {
    const p = normalizeStatus(priority);
    if (p === 'HIGH') return { label: 'Khẩn cấp', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' };
    if (p === 'LOW') return { label: 'Thấp', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
    return { label: 'Trung bình', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
}

export default function ReliefRequestStatusPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const request = location.state?.request || null;
    const requestId = Number(pickFirstTruthy(request?.id, location.state?.requestId, 0)) || 0;

    const [liveRequest, setLiveRequest] = useState(request || null);
    const [statusRaw, setStatusRaw] = useState(pickFirstTruthy(request?.deliveryStatus, request?.status, 'REQUESTED'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const data = liveRequest || request || null;
    const note = data?.note || '';
    const description = parseNoteField(note, 'Mô tả') || note;
    const peopleCount = parseNoteField(note, 'Số người cần hỗ trợ') || '1';
    const priority = parseNoteField(note, 'Mức độ ưu tiên') || 'MEDIUM';

    const activeStepIndex = useMemo(() => deliveryToActiveStep(statusRaw), [statusRaw]);
    const headerLabel = useMemo(() => statusToHeaderLabel(statusRaw), [statusRaw]);
    const priorityUI = useMemo(() => priorityMeta(priority), [priority]);
    const mapStatusMeta = useMemo(() => deliveryMapStatusMeta(statusRaw), [statusRaw]);
    const mapCoords = useMemo(() => {
        const lat = Number(data?.citizenLatitude ?? data?.latitude);
        const lng = Number(data?.citizenLongitude ?? data?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        return null;
    }, [data?.citizenLatitude, data?.citizenLongitude, data?.latitude, data?.longitude]);

    const requestStatus = normalizeStatus(data?.status);
    const deliveryStatus = normalizeStatus(statusRaw);
    const isRejected = ['REJECTED', 'CANCELLED'].includes(requestStatus) || ['REJECTED', 'CANCELLED'].includes(deliveryStatus);
    const canEditOrCancel = requestStatus === 'DRAFT' && !isRejected;

    const steps = useMemo(() => ([
        {
            id: 1,
            title: 'Yêu cầu đã gửi',
            description: 'Hệ thống đã ghi nhận yêu cầu cứu trợ của bạn.',
            timeLabel: 'Đã ghi nhận',
            status: activeStepIndex >= 1 ? 'done' : 'pending',
        },
        {
            id: 2,
            title: 'Đã duyệt và phân công',
            description: 'Manager duyệt yêu cầu và giao đội cứu hộ phụ trách.',
            timeLabel: activeStepIndex >= 2 ? 'Đã duyệt' : 'Đang chờ duyệt',
            status: activeStepIndex > 2 ? 'done' : activeStepIndex === 2 ? 'current' : 'pending',
        },
        {
            id: 3,
            title: 'Đội cứu hộ đã nhận yêu cầu',
            description: 'Đội cứu hộ đã tiếp nhận nhiệm vụ cứu trợ.',
            timeLabel: activeStepIndex >= 3 ? 'Đã nhận' : 'Chờ tiếp nhận',
            status: activeStepIndex > 3 ? 'done' : activeStepIndex === 3 ? 'current' : 'pending',
        },
        {
            id: 4,
            title: 'Đội cứu hộ đã tới kho',
            description: 'Đội cứu hộ đã có mặt tại kho để lấy hàng cứu trợ.',
            timeLabel: activeStepIndex >= 4 ? 'Đã tới kho' : 'Chưa tới kho',
            status: activeStepIndex > 4 ? 'done' : activeStepIndex === 4 ? 'current' : 'pending',
        },
        {
            id: 5,
            title: 'Đội cứu hộ đang đi giao hàng',
            description: 'Đội cứu hộ đang vận chuyển hàng đến điểm cứu trợ của bạn.',
            timeLabel: activeStepIndex >= 5 ? 'Đang giao hàng' : 'Chưa giao',
            status: activeStepIndex > 5 ? 'done' : activeStepIndex === 5 ? 'current' : 'pending',
        },
        {
            id: 6,
            title: 'Hoàn thành',
            description: 'Công tác cứu trợ đã hoàn tất.',
            timeLabel: activeStepIndex >= 6 ? 'Hoàn thành' : 'Chờ hoàn tất',
            status: activeStepIndex === 6 ? 'done' : 'pending',
        },
    ]), [activeStepIndex]);

    useEffect(() => {
        let mounted = true;
        let intervalId = null;

        async function load() {
            try {
                if (mounted) {
                    setLoading(true);
                    setError('');
                }
                if (requestId) {
                    const resp = await getReliefRequest(requestId);
                    if (!mounted) return;
                    setLiveRequest(resp);
                    setStatusRaw(pickFirstTruthy(resp?.deliveryStatus, resp?.status, 'REQUESTED'));
                } else {
                    const resp = await getMyCitizenReliefRequests({ page: 0, size: 1 });
                    let list = [];
                    if (Array.isArray(resp)) list = resp;
                    else if (Array.isArray(resp?.content)) list = resp.content;
                    else if (Array.isArray(resp?.data)) list = resp.data;
                    else if (Array.isArray(resp?.items)) list = resp.items;

                    const latest = list.length > 0 ? list[0] : null;
                    if (latest) {
                        setLiveRequest(latest);
                        setStatusRaw(pickFirstTruthy(latest?.deliveryStatus, latest?.status, 'REQUESTED'));
                    }
                }
            } catch (e) {
                if (!mounted) return;
                setError(e?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        intervalId = window.setInterval(load, 10000);

        return () => {
            mounted = false;
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [requestId]);

    const handleBackToList = () => navigate(CITIZEN_ROUTES.MY_RELIEF_REQUESTS);

    const handleGoToUpdateRequest = () => {
        const targetId = Number(data?.id || requestId || 0);
        if (!targetId) {
            window.alert('Không tìm thấy mã yêu cầu để cập nhật.');
            return;
        }
        navigate(CITIZEN_ROUTES.UPDATE_RELIEF_REQUEST, {
            state: {
                requestId: targetId,
                request: data,
            },
        });
    };

    const handleCancel = async () => {
        const targetId = Number(data?.id || requestId || 0);
        if (!targetId || cancelling || !canEditOrCancel) return;
        const confirmed = window.confirm('Bạn có chắc muốn hủy yêu cầu cứu trợ này?');
        if (!confirmed) return;
        setCancelling(true);
        try {
            await cancelMyCitizenReliefRequest(targetId, 'Citizen hủy yêu cầu cứu trợ từ trang trạng thái.');
            window.alert('Đã hủy yêu cầu cứu trợ.');
            navigate(CITIZEN_ROUTES.MY_RELIEF_REQUESTS);
        } catch (e) {
            window.alert(e?.message || 'Không thể hủy yêu cầu cứu trợ.');
        } finally {
            setCancelling(false);
        }
    };

    if (!data) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <h2 className="text-lg font-semibold text-slate-900">Chưa có yêu cầu để hiển thị</h2>
                <p className="mt-2 text-sm text-slate-600">
                    {loading ? 'Đang tải dữ liệu yêu cầu cứu trợ...' : 'Không tìm thấy dữ liệu yêu cầu cứu trợ từ hệ thống.'}
                </p>
                <button
                    type="button"
                    onClick={handleBackToList}
                    className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    Danh sách yêu cầu của tôi
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Chi tiết Yêu cầu{' '}
                            <span className="text-blue-700">
                                #{data.code || `RL${String(data.id || 0).padStart(4, '0')}`}
                            </span>
                        </h1>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {headerLabel}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Hệ thống sẽ liên tục cập nhật tiến độ xử lý yêu cầu cứu trợ của bạn.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleBackToList}
                    className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:mt-0"
                >
                    Danh sách yêu cầu của tôi
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] items-start">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    {isRejected && (
                        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <h3 className="text-sm font-semibold text-rose-900">Yêu cầu cứu trợ đã bị từ chối/hủy</h3>
                            <p className="mt-1 text-xs text-rose-800">
                                {data?.deliveryNote || 'Yêu cầu đã bị từ chối hoặc hủy trong quá trình xử lý.'}
                            </p>
                        </div>
                    )}

                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                                <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Tiến độ cứu trợ
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Trạng thái được đồng bộ từ điều phối viên và đội cứu hộ.
                                </p>
                            </div>
                        </div>
                        <div className="rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-500">
                            {loading ? 'Đang cập nhật...' : error ? `Lỗi: ${error}` : 'Cập nhật gần nhất: vừa xong'}
                        </div>
                    </div>

                    <div className="relative mt-4">
                        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-slate-200" />

                        <div className="space-y-4">
                            {steps.map((step, index) => {
                                const isLast = index === steps.length - 1;
                                const isDone = step.status === 'done';
                                const isCurrent = step.status === 'current';

                                return (
                                    <div key={step.id} className="relative flex gap-4">
                                        <div className="relative z-10 mt-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white">
                                            <span
                                                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${isDone
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : isCurrent
                                                        ? 'border-blue-500 bg-blue-500 text-white'
                                                        : 'border-slate-300 bg-slate-50 text-slate-400'
                                                    }`}
                                            >
                                                {isDone ? <CheckCircle2 className="h-3 w-3" /> : step.id}
                                            </span>
                                        </div>

                                        <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                                                    <p className="text-xs text-slate-600">{step.description}</p>
                                                </div>
                                                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 sm:mt-0">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{step.timeLabel}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!isLast && (
                                            <div className="pointer-events-none absolute left-[15px] top-7 bottom-[-14px] w-px bg-slate-200" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                                    <Info className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Thông tin đã gửi
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Kiểm tra lại các thông tin quan trọng của yêu cầu cứu trợ.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Địa chỉ
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {data.citizenAddressText || data.targetArea || 'Chưa cập nhật địa chỉ'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Số lượng người
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {peopleCount} người
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Mức độ ưu tiên
                                    </p>
                                    <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                                        <span className={`inline-flex h-2 w-2 rounded-full ${priorityUI.dot}`} />
                                        <span className={priorityUI.color}>
                                            {priorityUI.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Ghi chú tình hình
                                </p>
                                <p>{description || 'Chưa có mô tả chi tiết.'}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Bản đồ & trạng thái đội cứu hộ
                                    </p>
                                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${mapStatusMeta.chip}`}>
                                        {mapStatusMeta.label}
                                    </span>
                                </div>
                                <div className="h-48 overflow-hidden rounded-lg border border-slate-200">
                                    <MapBox
                                        center={mapCoords || { lat: 10.8231, lng: 106.6297 }}
                                        markerPosition={mapCoords || null}
                                        zoom={mapCoords ? 15 : 11}
                                    />
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500">
                                    Trạng thái map được đồng bộ trực tiếp theo cập nhật mới nhất từ đội cứu hộ.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleGoToUpdateRequest}
                                    disabled={!canEditOrCancel}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cập nhật thêm thông tin
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={!canEditOrCancel || cancelling}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {cancelling ? 'Đang hủy...' : 'Hủy yêu cầu cứu trợ'}
                                </button>
                            </div>
                        </div>
                        {!canEditOrCancel && (
                            <p className="mt-3 text-xs text-slate-500">
                                Yêu cầu đã qua bước chờ duyệt hoặc đã xử lý, bạn không thể cập nhật/hủy nữa.
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-500" />
                            <p>
                                Trạng thái sẽ thay đổi theo các mốc vận chuyển thực tế: duyệt, đội nhận yêu cầu,
                                giao cứu trợ và hoàn thành.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
