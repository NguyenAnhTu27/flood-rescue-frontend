import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Users, AlertTriangle, Info } from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { cancelRescueRequest, confirmRescueResult } from '../../features/citizen/api.js';

function normalizeStatus(s) {
    return String(s || '').toUpperCase();
}

function statusBadgeMeta(statusRaw) {
    const normalized = normalizeStatus(statusRaw);
    if (['COMPLETED', 'DONE', 'RESCUED', 'FINISHED'].includes(normalized)) {
        return { label: 'HOÀN THÀNH', variant: 'success' };
    }
    if (['CANCELLED', 'CANCELED'].includes(normalized)) {
        return { label: 'ĐÃ HỦY', variant: 'error' };
    }
    if (['VERIFIED', 'CONFIRMED', 'APPROVED'].includes(normalized)) {
        return { label: 'ĐÃ XÁC MINH', variant: 'info' };
    }
    return { label: 'ĐANG XỬ LÝ', variant: 'info' };
}

export default function RescueDetailRequestPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Request data được truyền từ trang tạo yêu cầu
    const request = location.state?.request || null;
    const formDraft = location.state?.formDraft || null;
    const [requestState, setRequestState] = React.useState(request || null);
    const [confirmingRescue, setConfirmingRescue] = React.useState(false);
    const [actionNotice, setActionNotice] = React.useState('');
    const [actionError, setActionError] = React.useState('');

    const data = requestState || request || null;

    // Prefer values from BE response; fallback to draft data from the create form
    const merged = {
        ...data,
        addressText: data?.addressText || formDraft?.address || '',
        affectedPeopleCount:
            data?.affectedPeopleCount ??
            (formDraft?.peopleCount ? parseInt(formDraft.peopleCount, 10) : undefined) ??
            0,
        priority: data?.priority || formDraft?.level || 'MEDIUM',
        description: data?.description || formDraft?.description || '',
    };

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

    const priorityMeta = formatPriority(merged.priority);

    const statusRaw = normalizeStatus(merged?.status);
    const badgeMeta = statusBadgeMeta(statusRaw);
    const isCompleted = ['COMPLETED', 'DONE', 'RESCUED', 'FINISHED'].includes(statusRaw);
    const isCancelled = ['CANCELLED', 'CANCELED'].includes(statusRaw);
    const waitingCitizenConfirmation = Boolean(
        merged?.waitingCitizenRescueConfirmation
        || (statusRaw === 'COMPLETED'
            && ['PENDING', '', 'NULL'].includes(String(merged?.rescueResultConfirmationStatus || 'PENDING').toUpperCase()))
    );
    const canUpdateRequest = !isCompleted && !isCancelled;
    const canCancelRequest = Boolean(merged?.id) && !isCompleted && !isCancelled;
    const canConfirmRescued = Boolean(merged?.id) && !isCancelled && (!isCompleted || waitingCitizenConfirmation);
    const activeStep = (() => {
        if (['COMPLETED', 'DONE', 'RESCUED'].includes(statusRaw)) return 4;
        if (['IN_PROGRESS', 'WORKING', 'PROCESSING', 'ARRIVED', 'ON_SITE', 'AT_SCENE'].includes(statusRaw)) return 3;
        if (['ASSIGNED', 'VERIFIED', 'CONFIRMED', 'APPROVED'].includes(statusRaw)) return 2;
        return 1;
    })();

    const steps = [
        {
            id: 1,
            title: 'Yêu cầu đã gửi',
            description: 'Hệ thống đã nhận được yêu cầu cứu hộ từ vị trí của bạn.',
            timeLabel: activeStep >= 1 ? 'Vừa xong' : 'Đang chờ',
            status: activeStep > 1 ? 'done' : activeStep === 1 ? 'current' : 'pending',
        },
        {
            id: 2,
            title: 'Đã xác minh',
            description: 'Điều phối viên đang đánh giá mức độ khẩn cấp của yêu cầu.',
            timeLabel: activeStep >= 2 ? 'Đã xác minh' : 'Đang chờ',
            status: activeStep > 2 ? 'done' : activeStep === 2 ? 'current' : 'pending',
        },
        {
            id: 3,
            title: 'Đội cứu hộ đang đến',
            description: activeStep >= 3
                ? 'Đội cứu hộ đang thực hiện quá trình cứu hộ.'
                : 'Đội cứu hộ gần nhất sẽ được điều tới vị trí của bạn.',
            timeLabel: activeStep >= 3 ? 'Đang xử lý' : 'Dự kiến sớm',
            status: activeStep > 3 ? 'done' : activeStep === 3 ? 'current' : 'pending',
        },
        {
            id: 4,
            title: 'Hoàn thành',
            description: 'Công tác cứu hộ kết thúc an toàn.',
            timeLabel: activeStep >= 4 ? 'Hoàn thành' : 'Chờ xác nhận',
            status: activeStep === 4 ? 'done' : 'pending',
        },
    ];

    const handleBackToList = () => {
        navigate('/cong-dan/yeu-cau-cuu-ho');
    };

    if (!data) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <h2 className="text-lg font-semibold text-slate-900">Không có dữ liệu yêu cầu</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Vui lòng truy cập từ danh sách yêu cầu của bạn để xem chi tiết.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleBackToList} className="mt-4">
                    Danh sách yêu cầu của tôi
                </Button>
            </div>
        );
    }

    const handleCancelRequest = async () => {
        if (!canCancelRequest) return;
        const confirmed = window.confirm('Bạn chắc chắn muốn hủy yêu cầu này?');
        if (!confirmed) return;
        try {
            await cancelRescueRequest(merged.id);
            navigate(CITIZEN_ROUTES.MY_RESCUE_REQUESTS);
        } catch (err) {
            alert(err?.message || 'Không thể hủy yêu cầu');
        }
    };

    const handleConfirmRescued = async () => {
        if (!canConfirmRescued || confirmingRescue) return;
        const confirmed = window.confirm('Xác nhận bạn và mọi người đã được cứu hộ an toàn?');
        if (!confirmed) return;

        try {
            setConfirmingRescue(true);
            setActionError('');
            setActionNotice('');
            const response = await confirmRescueResult(merged.id, { rescued: true });
            setRequestState((prev) => ({
                ...(prev || merged),
                status: 'COMPLETED',
                requestStatus: 'COMPLETED',
                waitingCitizenRescueConfirmation: false,
                rescueResultConfirmationStatus: 'CONFIRMED',
                updatedAt: new Date().toISOString(),
            }));
            setActionNotice(response?.message || 'Đã gửi xác nhận hoàn thành tới điều phối và cập nhật yêu cầu sang trạng thái hoàn thành.');
        } catch (err) {
            setActionError(err?.message || 'Không thể xác nhận đã được cứu hộ.');
        } finally {
            setConfirmingRescue(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Chi tiết Yêu cầu{' '}
                            <span className="text-blue-700">
                                #{merged.code || `RR${String(merged.id || 0).padStart(4, '0')}`}
                            </span>
                        </h1>
                        <Badge variant={badgeMeta.variant} size="lg">
                            {badgeMeta.label}
                        </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Hệ thống sẽ liên tục cập nhật tiến độ xử lý yêu cầu cứu hộ của bạn.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBackToList}
                    className="mt-3 sm:mt-0"
                >
                    Danh sách yêu cầu của tôi
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] items-start">
                {/* Tiến độ cứu hộ */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                            Cập nhật gần nhất: vài giây trước
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
                    {actionNotice && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {actionNotice}
                        </div>
                    )}
                    {actionError && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {actionError}
                        </div>
                    )}
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
                                        {merged.addressText || 'Chưa cập nhật địa chỉ'}
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
                                        {merged.affectedPeopleCount || 1} người
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
                                <p>{merged.description || 'Chưa có mô tả chi tiết.'}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    disabled={!canUpdateRequest}
                                    onClick={() => navigate(CITIZEN_ROUTES.UPDATE_RESCUE_REQUEST, {
                                        state: { request: merged }
                                    })}
                                    className="flex-1"
                                >
                                    {canUpdateRequest ? 'Cập nhật thêm thông tin' : 'Yêu cầu đã hoàn thành'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    onClick={handleCancelRequest}
                                    disabled={!canCancelRequest}
                                    className="flex-1"
                                >
                                    Hủy yêu cầu cứu hộ
                                </Button>
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
                        <Button
                            type="button"
                            variant="success"
                            size="sm"
                            onClick={handleConfirmRescued}
                            className="mt-2 sm:mt-0"
                            disabled={!canConfirmRescued || confirmingRescue}
                        >
                            {confirmingRescue
                                ? 'Đang xác nhận...'
                                : isCancelled
                                    ? 'Yêu cầu đã hủy'
                                    : isCompleted && !waitingCitizenConfirmation
                                        ? 'Đã xác nhận hoàn thành'
                                        : 'Xác nhận đã được cứu'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
