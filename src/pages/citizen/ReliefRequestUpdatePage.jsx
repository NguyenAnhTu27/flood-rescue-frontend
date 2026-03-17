import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Camera, Info, Save, X } from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import { uploadRescueAttachments } from '../../features/rescue/api.js';
import { getReliefRequest, updateMyCitizenReliefRequest } from '../../features/relief/api.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function resolveAttachmentUrl(fileUrl) {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    if (fileUrl.startsWith('/')) return `${BACKEND_ORIGIN}${fileUrl}`;
    return `${BACKEND_ORIGIN}/${fileUrl}`;
}

function parseImagesFromNote(note) {
    const line = String(note || '')
        .split('\n')
        .find((ln) => ln.trim().startsWith('Ảnh hiện trường:'));
    if (!line) return [];

    const raw = line.replace('Ảnh hiện trường:', '').trim();
    if (!raw || raw === 'Không có') return [];

    return raw
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({ fileUrl: url, fileType: 'IMAGE' }));
}

function formatImageUrlsForNote(images) {
    if (!Array.isArray(images) || images.length === 0) return 'Không có';
    return images
        .map((img) => String(img?.fileUrl || img?.url || '').trim())
        .filter(Boolean)
        .join(', ');
}

export default function ReliefRequestUpdatePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const requestFromState = location.state?.request || null;
    const requestIdFromState = Number(location.state?.requestId || requestFromState?.id || 0) || 0;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingRequest, setIsLoadingRequest] = useState(false);
    const [error, setError] = useState(null);
    const [request, setRequest] = useState(requestFromState);
    const [form, setForm] = useState({
        additionalDescription: '',
        newImages: [],
        existingImages: [],
    });

    useEffect(() => {
        if (request) {
            setForm((prev) => ({
                ...prev,
                existingImages: parseImagesFromNote(request.note),
            }));
        }
    }, [request]);

    useEffect(() => {
        const targetId = Number(requestFromState?.id || requestIdFromState || 0);
        if (!targetId) return;

        const loadDetail = async () => {
            try {
                setIsLoadingRequest(true);
                const detail = await getReliefRequest(targetId);
                setRequest(detail || requestFromState);
            } catch (err) {
                console.error('Load relief request detail error:', err);
                setRequest(requestFromState);
            } finally {
                setIsLoadingRequest(false);
            }
        };

        loadDetail();
    }, [requestFromState, requestIdFromState]);

    useEffect(() => {
        if (!request && !requestIdFromState) {
            navigate(CITIZEN_ROUTES.MY_RELIEF_REQUESTS);
        }
    }, [request, requestIdFromState, navigate]);

    const handleDescriptionChange = (e) => {
        setForm((prev) => ({
            ...prev,
            additionalDescription: e.target.value,
        }));
    };

    const handleNewImagesChange = (files) => {
        setForm((prev) => ({
            ...prev,
            newImages: files,
        }));
    };

    const handleRemoveExistingImage = (index) => {
        setForm((prev) => ({
            ...prev,
            existingImages: prev.existingImages.filter((_, i) => i !== index),
        }));
    };

    const handleRemoveNewImage = (index) => {
        setForm((prev) => ({
            ...prev,
            newImages: prev.newImages.filter((_, i) => i !== index),
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        const maxFiles = 10;
        const maxSizeMB = 10;

        if (form.newImages.length + selectedFiles.length > maxFiles) {
            alert(`Chỉ có thể tải tối đa ${maxFiles} ảnh`);
            return;
        }

        const invalidFiles = selectedFiles.filter((file) => file.size > maxSizeMB * 1024 * 1024);
        if (invalidFiles.length > 0) {
            alert(`Một số ảnh vượt quá kích thước tối đa ${maxSizeMB}MB`);
            return;
        }

        handleNewImagesChange([...form.newImages, ...selectedFiles]);
        e.target.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.additionalDescription.trim() && form.newImages.length === 0) {
            setError('Vui lòng nhập mô tả bổ sung hoặc thêm ảnh mới');
            return;
        }

        const targetId = Number(request?.id || requestIdFromState || 0);
        if (!targetId) {
            setError('Không tìm thấy yêu cầu cứu trợ cần cập nhật');
            return;
        }

        try {
            setIsSubmitting(true);

            const uploadedAttachments = form.newImages.length > 0
                ? await uploadRescueAttachments(form.newImages)
                : [];

            const keptExistingAttachments = form.existingImages
                .filter((img) => (img.fileUrl || img.url))
                .map((img) => ({
                    fileUrl: img.fileUrl || img.url,
                    fileType: img.fileType || 'IMAGE',
                }));

            const mergedAttachments = [
                ...keptExistingAttachments,
                ...(Array.isArray(uploadedAttachments) ? uploadedAttachments : []),
            ];

            const currentNote = String(request?.note || '').trim();
            const additionalDescription = form.additionalDescription.trim();
            const updateBlock = additionalDescription
                ? `\n\n[Cập nhật ${new Date().toLocaleString('vi-VN')}]\n${additionalDescription}`
                : '';

            let nextNote = `${currentNote}${updateBlock}`.trim();

            const imageLine = `Ảnh hiện trường: ${formatImageUrlsForNote(mergedAttachments)}`;
            if (/^Ảnh hiện trường:/m.test(nextNote)) {
                nextNote = nextNote.replace(/^Ảnh hiện trường:.*$/m, imageLine);
            } else {
                nextNote = `${nextNote}\n${imageLine}`.trim();
            }

            const payload = {
                targetArea: request?.targetArea || request?.citizenAddressText || 'Chưa cập nhật',
                addressText: request?.citizenAddressText || request?.addressText || request?.targetArea || null,
                latitude: request?.citizenLatitude ?? request?.latitude ?? null,
                longitude: request?.citizenLongitude ?? request?.longitude ?? null,
                locationDescription: request?.citizenLocationDescription ?? request?.locationDescription ?? null,
                rescueRequestId: request?.rescueRequestId ?? null,
                note: nextNote,
            };

            const updatedRequest = await updateMyCitizenReliefRequest(targetId, payload);

            navigate(CITIZEN_ROUTES.RELIEF_REQUEST_STATUS, {
                state: {
                    requestId: (updatedRequest?.id || request?.id || targetId),
                    request: updatedRequest || { ...request, note: nextNote },
                    successMessage: 'Thông tin yêu cầu cứu trợ đã được cập nhật thành công!',
                },
            });
        } catch (err) {
            setError(err.message || 'Không thể cập nhật yêu cầu cứu trợ. Vui lòng thử lại.');
            console.error('Update relief error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(CITIZEN_ROUTES.RELIEF_REQUEST_STATUS, {
            state: { requestId: request?.id || requestIdFromState, request },
        });
    };

    const newImagePreviews = form.newImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
    }));

    // Cleanup preview URLs on unmount
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        return () => {
            newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [form.newImages]);
    /* eslint-enable react-hooks/exhaustive-deps */

    if (!request && !requestIdFromState) {
        return null;
    }

    if (isLoadingRequest) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Đang tải chi tiết yêu cầu cứu trợ...
            </div>
        );
    }

    const totalImages = form.existingImages.length + form.newImages.length;
    const canAddMore = totalImages < 10;

    return (
        <div className="space-y-6 pb-10">
            <section>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">
                    Cập nhật Thông tin Yêu cầu
                </h1>
                <p className="text-sm text-slate-600">
                    Vui lòng cung cấp thông tin mới nhất để chúng tôi hỗ trợ bạn tốt nhất.
                </p>
            </section>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">
                            Mô tả bổ sung
                        </h2>
                    </div>
                    <div className="mb-4">
                        <h3 className="mb-2 text-sm font-medium text-slate-700">
                            Chi tiết tình hình hiện tại
                        </h3>
                        <textarea
                            value={form.additionalDescription}
                            onChange={handleDescriptionChange}
                            placeholder="Nhập thêm chi tiết mới cho yêu cầu cứu trợ..."
                            rows={6}
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Camera className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">
                            Ảnh bổ sung
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {form.existingImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                {form.existingImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className="group relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 shadow-sm"
                                    >
                                        <img
                                            src={resolveAttachmentUrl(img.fileUrl || img.url || '')}
                                            alt={`Existing ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExistingImage(index)}
                                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600"
                                            title="Xóa ảnh"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {newImagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                {newImagePreviews.map((preview, index) => (
                                    <div
                                        key={index}
                                        className="group relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 shadow-sm"
                                    >
                                        <img
                                            src={preview.url}
                                            alt={`New ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveNewImage(index)}
                                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600"
                                            title="Xóa ảnh"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {canAddMore && (
                            <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
                                <Camera className="h-6 w-6 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Tải ảnh mới</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        )}

                        {!canAddMore && (
                            <p className="text-center text-xs text-slate-500">
                                Đã đạt giới hạn tối đa 10 ảnh
                            </p>
                        )}
                    </div>
                </section>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex gap-3">
                        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                        <p className="text-sm text-blue-800">
                            Thông tin thay đổi của bạn sẽ được gửi trực tiếp đến điều phối viên ngay lập tức để điều chỉnh kế hoạch hỗ trợ.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Đang cập nhật...' : 'Lưu cập nhật'}
                    </button>
                </div>
            </form>
        </div>
    );
}
