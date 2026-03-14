import React, { useEffect, useState } from 'react';
import { MapPin, Clock, Users, ArrowRight, AlertCircle, CheckCircle2, Loader2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import { getMyCitizenReliefRequests } from '../../features/relief/api.js';
import PriorityBadge from '../../features/rescue/components/PriorityBadge.jsx';

function normalizeList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.items)) return response.items;
    return [];
}

function parseNoteField(note, label) {
    const lines = String(note || '').split('\n');
    const line = lines.find((ln) => ln.trim().startsWith(`${label}:`));
    if (!line) return '';
    return line.replace(`${label}:`, '').trim();
}

const DELIVERY_STATUS_META = {
    REQUESTED: {
        label: 'Đã gửi yêu cầu',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
    },
    MANAGER_APPROVED: {
        label: 'Manager đã duyệt',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: CheckCircle2,
    },
    RESCUER_RECEIVED: {
        label: 'Đội đã nhận yêu cầu',
        color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        icon: CheckCircle2,
    },
    ARRIVED_WAREHOUSE: {
        label: 'Đã tới kho',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Loader2,
    },
    ARRIVED_RELIEF_POINT: {
        label: 'Đã tới điểm cứu trợ',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Loader2,
    },
    COMPLETED: {
        label: 'Hoàn thành',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
    },
    RETURNED_TO_WAREHOUSE: {
        label: 'Đã trả hàng về kho',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: CheckCircle2,
    },
    REJECTED: {
        label: 'Bị từ chối',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: AlertCircle,
    },
};

function formatRelativeTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

export default function MyReliefRequestsPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await getMyCitizenReliefRequests({ page: 0, size: 100 });
            setRequests(normalizeList(response));
        } catch (e) {
            setError(e?.message || 'Không thể tải danh sách yêu cầu cứu trợ');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        const id = window.setInterval(fetchRequests, 10000);
        return () => window.clearInterval(id);
    }, []);

    const handleClick = (request) => {
        navigate(CITIZEN_ROUTES.RELIEF_REQUEST_STATUS, {
            state: { requestId: request?.id, request },
        });
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-7 w-60 animate-pulse rounded bg-slate-200" />
                <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
                <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
            </div>
        );
    }

    if (error && requests.length === 0) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-500" />
                <p className="text-sm text-rose-700">{error}</p>
                <button type="button" onClick={fetchRequests} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white">
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-10">
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Yêu cầu cứu trợ của tôi</h1>
                    <p className="text-xs text-slate-500">
                        Tổng cộng <span className="font-semibold text-blue-600">{requests.length}</span> yêu cầu
                    </p>
                </div>
            </section>

            {error && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
                    {error}
                </div>
            )}

            {requests.length === 0 ? (
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-16 text-center shadow-sm ring-1 ring-blue-100">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Bạn chưa có yêu cầu cứu trợ nào</h2>
                    <p className="mt-2 text-sm text-slate-600">Tạo yêu cầu mới để hệ thống chuyển đến manager xử lý.</p>
                </div>
            ) : (
                <section className="space-y-3">
                    {requests.map((request) => {
                        const statusKey = String(request.deliveryStatus || 'REQUESTED').toUpperCase();
                        const statusInfo = DELIVERY_STATUS_META[statusKey] || DELIVERY_STATUS_META.REQUESTED;
                        const StatusIcon = statusInfo.icon;
                        const peopleCount = parseInt(parseNoteField(request.note, 'Số người cần hỗ trợ'), 10);
                        const priority = parseNoteField(request.note, 'Mức độ ưu tiên') || 'MEDIUM';
                        return (
                            <div
                                key={request.id}
                                onClick={() => handleClick(request)}
                                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-blue-600">
                                                {request.code || `#${request.id}`}
                                            </h3>
                                            <PriorityBadge level={priority} size="sm" />
                                        </div>
                                        <div className="mb-2 flex items-start gap-1.5">
                                            <MapPin className="mt-0.5 h-3.5 w-3.5 text-blue-500" />
                                            <span className="line-clamp-1 text-xs text-slate-600">{request.targetArea || '—'}</span>
                                        </div>
                                        {request.note && <p className="line-clamp-1 text-xs text-slate-600">{request.note}</p>}
                                        <div className="mt-2 flex items-center gap-2.5 text-xs text-slate-500">
                                            {Number.isFinite(peopleCount) && peopleCount > 0 && (
                                                <div className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5">
                                                    <Users className="h-3 w-3 text-blue-500" />
                                                    <span className="font-medium">{peopleCount}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5">
                                                <Clock className="h-3 w-3 text-slate-400" />
                                                <span>{formatRelativeTime(request.updatedAt || request.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}>
                                            <StatusIcon className={`h-3 w-3 ${statusKey === 'ARRIVED_WAREHOUSE' || statusKey === 'ARRIVED_RELIEF_POINT' ? 'animate-spin' : ''}`} />
                                            {statusInfo.label}
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}
        </div>
    );
}
