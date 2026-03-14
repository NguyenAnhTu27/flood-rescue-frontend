import React, { useState, useMemo } from 'react';
import { Star, MessageSquare, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../../shared/ui/Card.jsx';
import Badge from '../../shared/ui/Badge.jsx';

const MOCK_FEEDBACKS = [
    {
        id: 1,
        name: 'Nguyễn Thị Lan',
        rating: 5,
        comment: 'Đội cứu hộ đến rất nhanh, chỉ 20 phút sau khi gửi yêu cầu. Cảm ơn các anh rất nhiều!',
        createdAt: '2026-03-08T10:30:00',
        requestCode: 'RQ-881',
    },
    {
        id: 2,
        name: 'Trần Văn Bình',
        rating: 5,
        comment: 'Rất chuyên nghiệp và tận tâm. Đã giúp gia đình tôi an toàn di chuyển đến nơi trú ẩn.',
        createdAt: '2026-03-08T09:15:00',
        requestCode: 'RQ-876',
    },
    {
        id: 3,
        name: 'Lê Minh Hải',
        rating: 4,
        comment: 'Dịch vụ tốt, tuy nhiên thời gian chờ đợi hơi lâu do lượng yêu cầu quá nhiều.',
        createdAt: '2026-03-07T16:45:00',
        requestCode: 'RQ-860',
    },
    {
        id: 4,
        name: 'Phạm Thị Mai',
        rating: 5,
        comment: 'Cứu hộ đã mang theo đầy đủ nhu yếu phẩm. Thái độ nhân viên rất thân thiện.',
        createdAt: '2026-03-07T14:00:00',
        requestCode: 'RQ-855',
    },
    {
        id: 5,
        name: 'Hoàng Đức Anh',
        rating: 3,
        comment: 'Đội đến muộn hơn dự kiến, nhưng sau khi đến thì xử lý rất nhanh chóng.',
        createdAt: '2026-03-07T11:20:00',
        requestCode: 'RQ-848',
    },
    {
        id: 6,
        name: 'Võ Thị Hương',
        rating: 5,
        comment: 'Tuyệt vời! Đã giúp cả xóm di dời an toàn. Cảm ơn hệ thống cứu hộ!',
        createdAt: '2026-03-06T08:30:00',
        requestCode: 'RQ-830',
    },
    {
        id: 7,
        name: 'Đặng Quốc Tuấn',
        rating: 4,
        comment: 'Hệ thống tracking rất tiện, biết được đội cứu hộ đang ở đâu.',
        createdAt: '2026-03-06T07:00:00',
        requestCode: 'RQ-822',
    },
    {
        id: 8,
        name: 'Bùi Thanh Tâm',
        rating: 2,
        comment: 'Phải gọi nhiều lần mới có người tiếp nhận. Cần cải thiện quy trình.',
        createdAt: '2026-03-05T20:00:00',
        requestCode: 'RQ-810',
    },
];

const FILTER_TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: '5', label: '5 sao' },
    { key: '4', label: '4 sao' },
    { key: '3', label: '3 sao' },
    { key: 'low', label: 'Dưới 3 sao' },
];

const PAGE_SIZE = 5;

function StarRating({ rating, size = 'sm' }) {
    const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${sizeClass} ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                />
            ))}
        </div>
    );
}

function getInitials(name) {
    return name
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase();
}

function formatTimeAgo(dateString) {
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
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FeedbackPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => {
        if (activeTab === 'all') return MOCK_FEEDBACKS;
        if (activeTab === 'low') return MOCK_FEEDBACKS.filter((f) => f.rating < 3);
        return MOCK_FEEDBACKS.filter((f) => f.rating === Number(activeTab));
    }, [activeTab]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Stats
    const totalCount = MOCK_FEEDBACKS.length;
    const avgRating = totalCount > 0
        ? (MOCK_FEEDBACKS.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1)
        : '0.0';

    const distribution = useMemo(() => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        MOCK_FEEDBACKS.forEach((f) => { dist[f.rating] = (dist[f.rating] || 0) + 1; });
        return dist;
    }, []);

    const handleTabChange = (key) => {
        setActiveTab(key);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Phản hồi từ Công dân</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Đánh giá và nhận xét từ người dân về dịch vụ cứu hộ
                </p>
            </div>

            {/* Stats header */}
            <div className="grid gap-4 sm:grid-cols-3">
                {/* Average rating */}
                <Card className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                        <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900">{avgRating}</div>
                        <div className="text-xs text-slate-500">Đánh giá trung bình</div>
                    </div>
                </Card>

                {/* Total feedbacks */}
                <Card className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                        <MessageSquare className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900">{totalCount}</div>
                        <div className="text-xs text-slate-500">Tổng phản hồi</div>
                    </div>
                </Card>

                {/* Star distribution */}
                <Card className="px-5 py-4">
                    <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = distribution[star] || 0;
                            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-2 text-xs">
                                    <span className="w-6 text-right font-medium text-slate-600">{star}</span>
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-amber-400"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-6 text-right text-slate-500">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            activeTab === tab.key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Feedback list */}
            {paginated.length === 0 ? (
                <Card className="px-6 py-12 text-center">
                    <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">Không có phản hồi nào trong danh mục này</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {paginated.map((feedback) => (
                        <Card key={feedback.id} className="px-5 py-4">
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                    {getInitials(feedback.name)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {feedback.name}
                                            </span>
                                            <StarRating rating={feedback.rating} />
                                        </div>
                                        <span className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                                            <Clock className="h-3 w-3" />
                                            {formatTimeAgo(feedback.createdAt)}
                                        </span>
                                    </div>

                                    <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                                        {feedback.comment}
                                    </p>

                                    <div className="mt-2">
                                        <Badge size="sm" variant="default">
                                            Yêu cầu: {feedback.requestCode}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                                page === currentPage
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
