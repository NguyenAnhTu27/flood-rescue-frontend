import React, { useState, useEffect } from "react";
import { Plus, MapPin, Clock, Users, ArrowRight, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { CITIZEN_ROUTES } from "../../app/routes/route.constants.js";
import { Link, useNavigate } from "react-router-dom";
import { getMyRescueRequests } from "../../features/citizen/api.js";
import PriorityBadge from "../../features/rescue/components/PriorityBadge.jsx";

export default function MyRescueRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getMyRescueRequests({
                page: 1,
                limit: 100,
            });

            // Handle different response formats
            let requestsList = [];
            if (Array.isArray(response)) {
                requestsList = response;
            } else if (response?.data && Array.isArray(response.data)) {
                requestsList = response.data;
            } else if (response?.content && Array.isArray(response.content)) {
                requestsList = response.content;
            } else if (response?.items && Array.isArray(response.items)) {
                requestsList = response.items;
            }

            setRequests(requestsList);
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách yêu cầu');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatStatus = (status) => {
        const statusMap = {
            PENDING: {
                label: 'Chờ xử lý',
                color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                icon: Clock,
                iconColor: 'text-yellow-600'
            },
            IN_PROGRESS: {
                label: 'Đang xử lý',
                color: 'bg-blue-50 text-blue-700 border-blue-200',
                icon: Loader2,
                iconColor: 'text-blue-600'
            },
            COMPLETED: {
                label: 'Hoàn thành',
                color: 'bg-green-50 text-green-700 border-green-200',
                icon: CheckCircle2,
                iconColor: 'text-green-600'
            },
            CANCELLED: {
                label: 'Đã hủy',
                color: 'bg-slate-50 text-slate-700 border-slate-200',
                icon: XCircle,
                iconColor: 'text-slate-600'
            },
        };
        return statusMap[status] || statusMap.PENDING;
    };

    const formatRelativeTime = (dateString) => {
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

        const formatted = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        return formatted;
    };

    const handleRequestClick = (request) => {
        navigate(CITIZEN_ROUTES.RESCUE_DETAIL, {
            state: { request },
        });
    };

    // Compact Skeleton loading component
    const SkeletonCard = () => (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-40 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded-full w-20"></div>
            </div>
            <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
        </div>
    );

    // Loading state
    if (loading) {
        return (
            <div className="space-y-4 pb-10">
                <section>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="h-7 bg-slate-200 rounded-lg w-56 mb-2 animate-pulse"></div>
                            <div className="h-4 bg-slate-200 rounded w-40 animate-pulse"></div>
                        </div>
                        <div className="h-10 bg-slate-200 rounded-full w-44 animate-pulse"></div>
                    </div>
                </section>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error && requests.length === 0) {
        return (
            <div className="space-y-6 pb-10">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center animate-in fade-in slide-in-from-top-4 duration-500">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-700 mb-4 font-medium">{error}</p>
                    <button
                        onClick={fetchRequests}
                        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 hover:shadow-lg"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-10">
            {/* Compact Header */}
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">
                            Yêu cầu cứu hộ của tôi
                        </h1>
                        <p className="text-xs text-slate-500">
                            Tổng cộng <span className="font-semibold text-blue-600">{requests.length}</span> yêu cầu
                        </p>
                    </div>
                    <Link
                        to={CITIZEN_ROUTES.CREATE_RESCUE_REQUEST}
                        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                        Tạo yêu cầu mới
                    </Link>
                </div>
            </section>

            {/* Error banner */}
            {error && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700 animate-in fade-in slide-in-from-top-4 duration-300">
                    {error}
                </div>
            )}

            {/* Empty state */}
            {requests.length === 0 ? (
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-16 shadow-sm ring-1 ring-blue-100 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <AlertCircle className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Bạn chưa có yêu cầu cứu hộ nào</h2>
                    <p className="text-sm text-slate-600 mb-5 max-w-md mx-auto">
                        Tạo yêu cầu cứu hộ đầu tiên của bạn để nhận được hỗ trợ
                    </p>
                    <Link
                        to={CITIZEN_ROUTES.CREATE_RESCUE_REQUEST}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo yêu cầu cứu hộ mới
                    </Link>
                </div>
            ) : (
                /* Compact Requests list */
                <section className="space-y-3">
                    {requests.map((request, index) => {
                        const statusInfo = formatStatus(request.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={request.id}
                                onClick={() => handleRequestClick(request)}
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                {/* Left accent bar */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                                <div className="flex items-start justify-between gap-3">
                                    {/* Left: Main info */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header row */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                {request.code || `#${request.id}`}
                                            </h3>
                                            <PriorityBadge level={request.priority || 'MEDIUM'} size="sm" />
                                        </div>

                                        {/* Address */}
                                        {request.addressText && (
                                            <div className="flex items-start gap-1.5 mb-2">
                                                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                                                <span className="text-xs text-slate-600 line-clamp-1">{request.addressText}</span>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {request.description && (
                                            <p className="text-xs text-slate-600 line-clamp-1 mb-2">
                                                {request.description}
                                            </p>
                                        )}

                                        {/* Meta info */}
                                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                                            {request.affectedPeopleCount && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50">
                                                    <Users className="h-3 w-3 text-blue-500" />
                                                    <span className="font-medium">{request.affectedPeopleCount}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50">
                                                <Clock className="h-3 w-3 text-slate-400" />
                                                <span>{formatRelativeTime(request.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Status and arrow */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${statusInfo.color} group-hover:scale-105`}
                                        >
                                            <StatusIcon className={`h-3 w-3 ${statusInfo.iconColor} ${request.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
                                            <span className="whitespace-nowrap">{statusInfo.label}</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all duration-200 group-hover:translate-x-0.5" />
                                    </div>
                                </div>

                                {/* Subtle hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/3 group-hover:to-transparent transition-all duration-200 pointer-events-none rounded-xl"></div>
                            </div>
                        );
                    })}
                </section>
            )}
        </div>
    );
}
