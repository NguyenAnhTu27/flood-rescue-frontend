import React, { useState } from 'react';
import {
    AlertCircle,
    Camera,
    Image as ImageIcon,
    Info,
    Loader2,
} from 'lucide-react';

export default function RescueRequestUpdatePage() {
    const [note, setNote] = useState(
        'Ví dụ: Mực nước đã rút bớt nhưng vẫn còn ngập sân, cần hỗ trợ thêm lương thực, nước sạch, thuốc men...',
    );
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setImages(files);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        // TODO: Gọi API cập nhật yêu cầu cứu hộ
        setTimeout(() => {
            setIsSubmitting(false);
            // Có thể hiển thị toast hoặc redirect sau này
        }, 800);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">Cập nhật thông tin yêu cầu</h1>
                <p className="max-w-2xl text-sm text-slate-600">
                    Vui lòng cung cấp thêm mô tả chi tiết và hình ảnh để chúng tôi có thể điều chỉnh kế
                    hoạch hỗ trợ tốt nhất.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
            >
                {/* Ghi chú bổ sung */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Mô tả bổ sung</p>
                            <p className="text-xs text-slate-500">
                                Cập nhật diễn biến mới nhất để đội cứu hộ nắm được tình hình hiện tại.
                            </p>
                        </div>
                    </div>
                    <textarea
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Nhập mô tả chi tiết (mức nước, tình trạng sức khoẻ, nhu cầu hỗ trợ...)"
                    />
                </div>

                {/* Ảnh bổ sung */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                            <Camera className="h-4 w-4 text-blue-600" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Ảnh bổ sung</p>
                            <p className="text-xs text-slate-500">
                                Tải lên hình ảnh hiện trường mới nhất để đội cứu hộ đánh giá mức độ thay đổi.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Ô upload */}
                        <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-[11px] text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/60">
                            <Camera className="h-5 w-5 text-slate-500" />
                            <span className="font-medium">Thêm ảnh</span>
                            <span className="text-[10px] text-slate-400">JPG, PNG &lt; 10MB</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImagesChange}
                                className="hidden"
                            />
                        </label>

                        {/* Preview ảnh */}
                        {images.map((file, index) => (
                            <div
                                key={index}
                                className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-[10px] text-slate-600"
                            >
                                <ImageIcon className="h-5 w-5 text-slate-500" />
                                <span className="line-clamp-2 text-center">{file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Thông điệp chú ý */}
                <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                        Thông tin cập nhật sẽ được gửi tới đội điều phối và đội cứu hộ đang xử lý yêu cầu của
                        bạn. Hãy chỉ gửi các cập nhật quan trọng để tránh làm gián đoạn kế hoạch hỗ trợ.
                    </p>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Lưu thay đổi
                    </button>
                </div>
            </form>
        </div>
    );
}

