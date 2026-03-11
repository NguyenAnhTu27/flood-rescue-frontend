import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { getAdminSystemFeedbacks, getAdminSystemFeedbackSummary } from '../../features/feedback/api.js';

const STAR_LABEL = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất hài lòng',
};

function RatingStars({ value }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Number(value || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                />
            ))}
        </div>
    );
}

export default function SystemFeedbacksPage() {
    const [summary, setSummary] = useState({ totalFeedbacks: 0, averageRating: 0, ratingDistribution: {} });
    const [pageData, setPageData] = useState({ content: [], totalPages: 1, number: 0, totalElements: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [page, setPage] = useState(0);
    const size = 10;

    const distribution = useMemo(() => {
        const current = summary?.ratingDistribution || {};
        return [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: Number(current?.[star] || current?.[String(star)] || 0),
        }));
    }, [summary]);

    const mostPopularStar = useMemo(() => {
        if (!distribution.length) return 0;
        return [...distribution].sort((a, b) => b.count - a.count)[0]?.star || 0;
    }, [distribution]);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                setError('');
                const [summaryResp, listResp] = await Promise.all([
                    getAdminSystemFeedbackSummary(),
                    getAdminSystemFeedbacks({ page, size }),
                ]);
                setSummary(summaryResp || { totalFeedbacks: 0, averageRating: 0, ratingDistribution: {} });
                setPageData(listResp || { content: [], totalPages: 1, number: 0, totalElements: 0 });
            } catch (e) {
                setError(e?.message || 'Không thể tải phản hồi hệ thống.');
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [page]);

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <MessageSquare size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Phản hồi Citizen về hệ thống</h1>
                        <p className="text-sm text-slate-600">Theo dõi điểm đánh giá 5 sao và ý kiến đóng góp.</p>
                    </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase text-slate-500">Điểm trung bình</p>
                        <p className="mt-1 text-3xl font-bold text-amber-600">{Number(summary?.averageRating || 0).toFixed(2)}/5</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase text-slate-500">Tổng phản hồi</p>
                        <p className="mt-1 text-3xl font-bold text-slate-900">{summary?.totalFeedbacks || 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase text-slate-500">Mức phổ biến</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                            {mostPopularStar} sao
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid gap-2">
                    {distribution.map((item) => (
                        <div key={item.star} className="flex items-center gap-3">
                            <div className="w-16 text-sm font-medium text-slate-700">{item.star} sao</div>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full bg-amber-400"
                                    style={{
                                        width: `${summary?.totalFeedbacks ? (item.count / summary.totalFeedbacks) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <div className="w-10 text-right text-sm text-slate-600">{item.count}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">Danh sách phản hồi gần đây</h2>
                {loading ? (
                    <div className="py-8 text-sm text-slate-500">Đang tải...</div>
                ) : error ? (
                    <div className="py-8 text-sm text-rose-600">{error}</div>
                ) : pageData?.content?.length ? (
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="px-3 py-2">Thời gian</th>
                                    <th className="px-3 py-2">Citizen</th>
                                    <th className="px-3 py-2">Đánh giá</th>
                                    <th className="px-3 py-2">Nội dung</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData.content.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100 align-top">
                                        <td className="px-3 py-3 text-slate-600">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-slate-900">{item.citizenName || '—'}</div>
                                            <div className="text-xs text-slate-500">{item.citizenEmail || '—'}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <RatingStars value={item.rating} />
                                            <div className="mt-1 text-xs text-slate-500">{STAR_LABEL[item.rating] || '—'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-700">
                                            <p>{item.feedbackContent || 'Không có nội dung.'}</p>
                                            <div className="mt-1 text-xs text-slate-500">
                                                XN cứu hộ: {item.rescuedConfirmed ? 'Có' : 'Không'} | XN cứu trợ: {item.reliefConfirmed ? 'Có' : 'Không'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-8 text-sm text-slate-500">Chưa có phản hồi nào.</div>
                )}

                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                        disabled={(pageData?.number || 0) <= 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        Trước
                    </button>
                    <span className="text-sm text-slate-600">
                        Trang {(pageData?.number || 0) + 1}/{Math.max(1, pageData?.totalPages || 1)}
                    </span>
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                        disabled={(pageData?.number || 0) >= Math.max(0, (pageData?.totalPages || 1) - 1)}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Sau
                    </button>
                </div>
            </section>
        </div>
    );
}
