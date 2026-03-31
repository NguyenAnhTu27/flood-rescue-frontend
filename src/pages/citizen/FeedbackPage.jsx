import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Square, Star, Heart } from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import { createCitizenSystemFeedback } from '../../features/feedback/api.js';
import Button from '../../shared/ui/Button.jsx';
import Textarea from '../../shared/ui/Textarea.jsx';

const STATUS_OPTIONS = [
    { id: 'rescued', label: 'Tôi đã được cứu an toàn', value: 'rescued' },
    { id: 'relief', label: 'Tôi đã nhận đầy đủ hàng cứu trợ', value: 'relief' },
];

const RATING_LABELS = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Rất hài lòng',
    5: 'Cực kỳ hài lòng',
};

export default function FeedbackPage() {
    const navigate = useNavigate();
    const [confirmedStatus, setConfirmedStatus] = useState({
        rescued: true,
        relief: true,
    });
    const [rating, setRating] = useState(4);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const displayRating = hoverRating || rating;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');
        try {
            await createCitizenSystemFeedback({
                rating,
                feedbackContent: message?.trim() || null,
                rescuedConfirmed: Boolean(confirmedStatus.rescued),
                reliefConfirmed: Boolean(confirmedStatus.relief),
            });
            navigate(CITIZEN_ROUTES.DASHBOARD);
        } catch (err) {
            setSubmitError(err?.message || 'Không thể gửi phản hồi. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-120px)] bg-slate-50/80 py-8">
            <div className="mx-auto max-w-lg px-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="mt-4 text-xl font-bold text-slate-900">
                            Đánh giá hệ thống & Gửi phản hồi
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Chia sẻ mức độ hài lòng của bạn với hệ thống cứu hộ/cứu trợ để đội
                            quản trị cải thiện trải nghiệm phục vụ.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {/* Xác nhận tình trạng */}
                        <div>
                            <div className="flex items-center gap-2">
                                <Square className="h-4 w-4 fill-green-500 text-green-500" />
                                <h2 className="font-semibold text-slate-900">
                                    Xác nhận tình trạng
                                </h2>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {STATUS_OPTIONS.map((opt) => {
                                    const isChecked = confirmedStatus[opt.id];
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() =>
                                                setConfirmedStatus((prev) => ({
                                                    ...prev,
                                                    [opt.id]: !prev[opt.id],
                                                }))
                                            }
                                            className={`flex items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition ${
                                                isChecked
                                                    ? 'border-green-500 text-green-700'
                                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                            {isChecked ? (
                                                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                                            ) : (
                                                <div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300" />
                                            )}
                                            <span className="text-sm font-medium">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Đánh giá dịch vụ */}
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Đánh giá dịch vụ cứu hộ
                            </h2>
                            <div className="mt-3 flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition hover:scale-110"
                                    >
                                        <Star
                                            className={`h-8 w-8 ${
                                                star <= displayRating
                                                    ? 'fill-green-500 text-green-500'
                                                    : 'text-slate-200'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-sm font-medium text-green-700">
                                {RATING_LABELS[displayRating]}
                            </p>
                        </div>

                        {/* Lời nhắn / Phản hồi */}
                        <div>
                            <div className="flex items-center gap-2">
                                <Square className="h-4 w-4 fill-green-500 text-green-500" />
                                <h2 className="font-semibold text-slate-900">
                                    Lời nhắn / Phản hồi
                                </h2>
                            </div>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ví dụ: hệ thống dễ dùng, phản hồi nhanh/chậm, đề xuất cải thiện..."
                                rows={4}
                                className="mt-3"
                            />
                        </div>

                        {/* Block đồng hành */}
                        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                                <Heart className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="font-medium text-slate-800">Đồng hành cùng bạn</span>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-2">
                            {submitError && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                    {submitError}
                                </div>
                            )}
                            <Button
                                type="submit"
                                variant="success"
                                size="lg"
                                fullWidth
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                            </Button>
                            <p className="text-center">
                                <Link
                                    to={CITIZEN_ROUTES.DASHBOARD}
                                    className="text-sm text-slate-500 hover:text-slate-700 underline"
                                >
                                    Trở về trang chủ
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
