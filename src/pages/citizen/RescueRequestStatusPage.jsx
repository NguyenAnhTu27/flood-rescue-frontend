import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Users, AlertTriangle, Info } from 'lucide-react';

import { getRescueRequest, getRescueRequestStatus } from '../../features/rescue/api.js';
import { confirmRescueResult, getMyRescueRequests, reopenCancelledRequest } from '../../features/citizen/api.js';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';

function pickFirstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return null;
}

function normalizeStatus(s) {
    return String(s || '').toUpperCase();
}

function statusToActiveStepIndex(statusRaw, waitingForTeam) {
    if (waitingForTeam) return 3;
    const s = normalizeStatus(statusRaw);
    // 1: submitted, 2: verified, 3: rescue team processing/waiting, 4: done
    if (!s) return 2;
    if (['CANCELLED', 'CANCELED'].includes(s)) return 1;
    if (['DONE', 'COMPLETED', 'FINISHED', 'RESCUED'].includes(s)) return 4;
    if (['IN_PROGRESS', 'WORKING', 'PROCESSING', 'ON_SITE', 'AT_SCENE', 'ARRIVED'].includes(s)) return 3;
    if (['ASSIGNED', 'DEPARTED', 'EN_ROUTE', 'ON_THE_WAY', 'ONWAY'].includes(s)) return 3;
    if (['VERIFIED', 'CONFIRMED', 'APPROVED'].includes(s)) return 2;
    if (['PENDING', 'NEW', 'CREATED', 'SUBMITTED', 'RECEIVED'].includes(s)) return 1;
    return 2;
}

function statusToHeaderLabel(statusRaw, waitingForTeam) {
    if (waitingForTeam) return 'ĐANG CHỜ ĐỘI';
    const s = normalizeStatus(statusRaw);
    if (['CANCELLED', 'CANCELED'].includes(s)) return 'ĐÃ HỦY';
    if (['DONE', 'COMPLETED', 'FINISHED', 'RESCUED'].includes(s)) return 'HOÀN THÀNH';
    if (['IN_PROGRESS', 'WORKING', 'PROCESSING', 'ON_SITE', 'AT_SCENE', 'ARRIVED'].includes(s)) return 'ĐANG XỬ LÝ';
    if (['ASSIGNED', 'DEPARTED', 'EN_ROUTE', 'ON_THE_WAY', 'ONWAY'].includes(s)) return 'ĐANG DI CHUYỂN';
    if (['VERIFIED', 'CONFIRMED', 'APPROVED'].includes(s)) return 'ĐÃ XÁC MINH';
    return 'ĐANG XỬ LÝ';
}

export default function RescueRequestStatusPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Request data được truyền từ trang tạo yêu cầu
    const request = location.state?.request || null;

    const requestId = Number(pickFirstTruthy(request?.id, location.state?.requestId, 0)) || 0;
    const [liveRequest, setLiveRequest] = useState(request || null);
    const [statusRaw, setStatusRaw] = useState(pickFirstTruthy(request?.status, 'PENDING'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmingRescueResult, setConfirmingRescueResult] = useState(false);
    const [showNotRescuedReason, setShowNotRescuedReason] = useState(false);
    const [notRescuedReason, setNotRescuedReason] = useState('');
    const [reopening, setReopening] = useState(false);

    const data = liveRequest || request || null;

    const formatPriority = (priority) => {
        switch (priority) {
            case 'HIGH':
                return { label: 'Khẩn cấp', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' };
            case 'LOW':
                return { label: 'Thấp', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
            default:
                return { label: 'Trung bình', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
        }
    };

    const priorityMeta = formatPriority(data?.priority);

    const waitingForTeam = Boolean(data?.waitingForTeam);
    const activeStepIndex = useMemo(() => statusToActiveStepIndex(statusRaw, waitingForTeam), [statusRaw, waitingForTeam]);
    const headerLabel = useMemo(() => statusToHeaderLabel(statusRaw, waitingForTeam), [statusRaw, waitingForTeam]);
    const waitingCitizenConfirmation = Boolean(
        data?.waitingCitizenRescueConfirmation
        || (normalizeStatus(statusRaw) === 'COMPLETED'
            && ['PENDING', '', 'NULL'].includes(String(data?.rescueResultConfirmationStatus || 'PENDING').toUpperCase()))
    );
    const isCancelled = ['CANCELLED', 'CANCELED'].includes(normalizeStatus(statusRaw));
    const isInProgress = ['IN_PROGRESS', 'WORKING', 'PROCESSING', 'ON_SITE', 'AT_SCENE', 'ARRIVED'].includes(normalizeStatus(statusRaw));

    const steps = useMemo(() => ([
        {
            id: 1,
            title: 'Yêu cầu đã gửi',
            description: 'Hệ thống đã nhận được yêu cầu cứu hộ từ vị trí của bạn.',
            timeLabel: 'Đã ghi nhận',
            status: activeStepIndex >= 1 ? 'done' : 'pending',
        },
        {
            id: 2,
            title: 'Đã xác minh',
            description: 'Điều phối viên đang đánh giá mức độ khẩn cấp của yêu cầu.',
            timeLabel: activeStepIndex >= 2 ? 'Đã xác minh' : 'Đang chờ',
            status: activeStepIndex > 2 ? 'done' : activeStepIndex === 2 ? 'current' : 'pending',
        },
        {
            id: 3,
            title: waitingForTeam
                ? 'Đang chờ đội cứu hộ'
                : isInProgress
                    ? 'Đội cứu hộ đang thực hiện quá trình cứu hộ'
                    : 'Đội cứu hộ đang đến',
            description: waitingForTeam
                ? 'Yêu cầu đã xác minh, hiện chưa có đội rảnh. Hệ thống đang tiếp tục điều phối.'
                : isInProgress
                    ? 'Đội cứu hộ đang trực tiếp xử lý và cứu hộ tại khu vực của bạn.'
                    : 'Đội cứu hộ gần nhất sẽ được điều tới vị trí của bạn.',
            timeLabel: waitingForTeam
                ? 'Chưa có đội rảnh'
                : isInProgress
                    ? 'Đang thực hiện cứu hộ'
                    : activeStepIndex >= 3 ? 'Đang di chuyển' : 'Dự kiến sớm',
            status: activeStepIndex > 3 ? 'done' : activeStepIndex === 3 ? 'current' : 'pending',
        },
        {
            id: 4,
            title: 'Hoàn thành',
            description: 'Công tác cứu hộ kết thúc an toàn.',
            timeLabel: activeStepIndex >= 4 ? 'Hoàn thành' : 'Chờ xác nhận',
            status: activeStepIndex === 4 ? 'done' : 'pending',
        },
    ]), [activeStepIndex, waitingForTeam, isInProgress]);

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
                    // Fetch detail + status for specific request
                    const [detailRes, statusRes] = await Promise.allSettled([
                        getRescueRequest(String(requestId)),
                        getRescueRequestStatus(String(requestId)),
                    ]);

                    if (!mounted) return;

                    if (detailRes.status === 'fulfilled') {
                        setLiveRequest(detailRes.value);
                        const s0 = pickFirstTruthy(detailRes.value?.status, detailRes.value?.requestStatus);
                        if (s0) setStatusRaw(s0);
                    }

                    if (statusRes.status === 'fulfilled') {
                        const sObj = statusRes.value;
                        const s1 = pickFirstTruthy(
                            sObj?.status,
                            sObj?.requestStatus,
                            sObj?.state,
                            sObj?.data?.status,
                            sObj?.data?.requestStatus
                        );
                        if (s1) setStatusRaw(s1);
                    }
                } else {
                    // Không có requestId cụ thể: lấy yêu cầu mới nhất giống dashboard citizen
                    const resp = await getMyRescueRequests({ page: 1, limit: 1 });
                    let list = [];
                    if (Array.isArray(resp)) list = resp;
                    else if (resp?.data && Array.isArray(resp.data)) list = resp.data;
                    else if (resp?.content && Array.isArray(resp.content)) list = resp.content;
                    else if (resp?.items && Array.isArray(resp.items)) list = resp.items;

                    const latest = list.length > 0 ? list[0] : null;
                    if (latest) {
                        setLiveRequest(latest);
                        const s0 = pickFirstTruthy(latest.status, latest.requestStatus);
                        if (s0) setStatusRaw(s0);
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

    const handleBackToList = () => {
        navigate('/cong-dan/yeu-cau-cuu-ho');
    };

    const handleGoToUpdateRequest = () => {
        const targetId = Number(data?.id || requestId || 0);
        if (!targetId) {
            window.alert('Không tìm thấy mã yêu cầu để cập nhật.');
            return;
        }
        navigate(CITIZEN_ROUTES.UPDATE_RESCUE_REQUEST, {
            state: {
                requestId: targetId,
                request: data,
            },
        });
    };

    const handleConfirmRescued = async () => {
        if (!requestId || confirmingRescueResult) return;
        setConfirmingRescueResult(true);
        try {
            await confirmRescueResult(requestId, { rescued: true });
            navigate(CITIZEN_ROUTES.FEEDBACK, { state: { requestId } });
        } catch (e) {
            window.alert(e?.message || 'Không thể xác nhận trạng thái cứu hộ.');
        } finally {
            setConfirmingRescueResult(false);
        }
    };

    const handleConfirmNotRescued = async () => {
        if (!requestId || confirmingRescueResult) return;
        if (!notRescuedReason.trim()) {
            window.alert('Vui lòng nhập lý do cứu hộ chưa thành công thực tế.');
            return;
        }
        setConfirmingRescueResult(true);
        try {
            const resp = await confirmRescueResult(requestId, { rescued: false, reason: notRescuedReason.trim() });
            const followUpId = Number(resp?.followUpRequestId || 0);
            if (followUpId > 0) {
                navigate(CITIZEN_ROUTES.RESCUE_REQUEST_STATUS, { state: { requestId: followUpId } });
            } else {
                window.location.reload();
            }
        } catch (e) {
            window.alert(e?.message || 'Không thể gửi lại yêu cầu cứu hộ.');
        } finally {
            setConfirmingRescueResult(false);
        }
    };

    const handleReopenCancelled = async () => {
        if (!requestId || reopening) return;
        const reason = window.prompt('Nhập lý do gửi lại yêu cầu:');
        if (reason === null) return;
        if (!reason.trim()) {
            window.alert('Vui lòng nhập lý do.');
            return;
        }
        setReopening(true);
        try {
            await reopenCancelledRequest(requestId, reason.trim());
            window.alert('Đã gửi lại yêu cầu cứu hộ.');
            window.location.reload();
        } catch (e) {
            window.alert(e?.message || 'Không thể gửi lại yêu cầu.');
        } finally {
            setReopening(false);
        }
    };

    if (!data) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <h2 className="text-lg font-semibold text-slate-900">Chưa có yêu cầu để hiển thị</h2>
                <p className="mt-2 text-sm text-slate-600">
                    {loading ? 'Đang tải dữ liệu yêu cầu cứu hộ...' : 'Không tìm thấy dữ liệu yêu cầu cứu hộ từ hệ thống.'}
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
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Chi tiết Yêu cầu{' '}
                            <span className="text-blue-700">
                                #{data.code || `RR${String(data.id || 0).padStart(4, '0')}`}
                            </span>
                        </h1>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {headerLabel}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Hệ thống sẽ liên tục cập nhật tiến độ xử lý yêu cầu cứu hộ của bạn.
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
                {/* Tiến độ cứu hộ */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    {waitingCitizenConfirmation && (
                        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <h3 className="text-sm font-semibold text-amber-900">
                                Đội cứu hộ đã báo hoàn thành. Bạn đã được cứu hộ chưa?
                            </h3>
                            <p className="mt-1 text-xs text-amber-800">
                                Nếu chưa thành công thực tế, hệ thống sẽ tự gửi lại yêu cầu cứu hộ kèm lý do của bạn.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleConfirmRescued}
                                    disabled={confirmingRescueResult}
                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    Tôi đã được cứu hộ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNotRescuedReason((v) => !v)}
                                    disabled={confirmingRescueResult}
                                    className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                >
                                    Chưa được cứu hộ
                                </button>
                            </div>
                            {showNotRescuedReason && (
                                <div className="mt-3 space-y-2">
                                    <textarea
                                        value={notRescuedReason}
                                        onChange={(e) => setNotRescuedReason(e.target.value)}
                                        placeholder="Mô tả rõ lý do cứu hộ chưa thành công thực tế..."
                                        rows={3}
                                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-amber-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleConfirmNotRescued}
                                        disabled={confirmingRescueResult}
                                        className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                    >
                                        {confirmingRescueResult ? 'Đang gửi lại yêu cầu...' : 'Gửi lại yêu cầu cứu hộ'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {waitingForTeam && (
                        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <h3 className="text-sm font-semibold text-blue-900">Yêu cầu đã xác minh, đang chờ đội cứu hộ</h3>
                            <p className="mt-1 text-xs text-blue-800">
                                Hiện chưa có đội rảnh. Yêu cầu của bạn đã được đưa vào hàng đợi và ưu tiên điều phối ngay khi có đội.
                            </p>
                        </div>
                    )}
                    {isCancelled && (
                        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <h3 className="text-sm font-semibold text-rose-900">Yêu cầu đã bị hủy</h3>
                            <p className="mt-1 text-xs text-rose-800">
                                {data?.coordinatorCancelNote
                                    ? `Lý do: ${data.coordinatorCancelNote}`
                                    : 'Yêu cầu đã bị hủy bởi hệ thống/điều phối.'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(CITIZEN_ROUTES.FEEDBACK, { state: { requestId } })}
                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                    Đánh giá dịch vụ
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReopenCancelled}
                                    disabled={reopening}
                                    className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                >
                                    {reopening ? 'Đang gửi lại...' : 'Gửi lại yêu cầu'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                                <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Tiến độ cứu hộ
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Hãy giữ bình tĩnh, đội cứu hộ sẽ sớm liên hệ và cập nhật cho bạn.
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
                                                {isDone ? (
                                                    <CheckCircle2 className="h-3 w-3" />
                                                ) : (
                                                    step.id
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {step.title}
                                                    </p>
                                                    <p className="text-xs text-slate-600">
                                                        {step.description}
                                                    </p>
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

                {/* Thông tin đã gửi */}
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
                                        Kiểm tra lại các thông tin quan trọng của yêu cầu cứu hộ.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            {/* Địa chỉ */}
                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Địa chỉ
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {data.addressText || 'Chưa cập nhật địa chỉ'}
                                    </p>
                                </div>
                            </div>

                            {/* Số lượng người */}
                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Số lượng người
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {data.affectedPeopleCount || 1} người
                                    </p>
                                </div>
                            </div>

                            {/* Mức độ ưu tiên */}
                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Mức độ ưu tiên
                                    </p>
                                    <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                                        <span
                                            className={`inline-flex h-2 w-2 rounded-full ${priorityMeta.dot}`}
                                        />
                                        <span className={priorityMeta.color}>
                                            {priorityMeta.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ghi chú tình hình */}
                            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Ghi chú tình hình
                                </p>
                                <p>{data.description || 'Chưa có mô tả chi tiết.'}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleGoToUpdateRequest}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
                                >
                                    Cập nhật thêm thông tin
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                    Hủy yêu cầu cứu hộ
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Xác nhận đã được cứu */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                            <p>
                                Nếu bạn và mọi người đã an toàn, vui lòng xác nhận để hệ thống kết thúc yêu cầu và
                                ưu tiên nguồn lực cho các trường hợp khác.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:mt-0"
                            disabled
                        >
                            Xác nhận đã được cứu (sắp có)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
