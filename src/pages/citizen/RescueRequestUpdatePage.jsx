import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Camera, Info, Save, X } from 'lucide-react';
import { CITIZEN_ROUTES } from '../../app/routes/route.constants.js';
import { getRescueRequestById, updateRescueRequest, uploadRescueAttachments } from '../../features/citizen/api.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function resolveAttachmentUrl(fileUrl) {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    if (fileUrl.startsWith('/')) return `${BACKEND_ORIGIN}${fileUrl}`;
    return `${BACKEND_ORIGIN}/${fileUrl}`;
}

export default function RescueRequestUpdatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const requestFromState = location.state?.request || null;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingRequest, setIsLoadingRequest] = useState(false);
    const [error, setError] = useState(null);
    const [request, setRequest] = useState(requestFromState);
    const [form, setForm] = useState({
        additionalDescription: '',
        newImages: [],
        existingImages: [],
    });

    // Initialize form with existing request data
    useEffect(() => {
        if (request) {
            setForm(prev => ({
                ...prev,
                existingImages: request.attachments || [],
            }));
        }
    }, [request]);

    useEffect(() => {
        if (!requestFromState?.id) {
            return;
        }

        const loadDetail = async () => {
            try {
                setIsLoadingRequest(true);
                const detailedRequest = await getRescueRequestById(requestFromState.id);
                setRequest(detailedRequest || requestFromState);
            } catch (err) {
                console.error('Load request detail error:', err);
                setRequest(requestFromState);
            } finally {
                setIsLoadingRequest(false);
            }
        };

        loadDetail();
    }, [requestFromState]);

    // Redirect if no request data
    useEffect(() => {
        if (!request) {
            navigate(CITIZEN_ROUTES.MY_RESCUE_REQUESTS);
        }
    }, [request, navigate]);

    const handleDescriptionChange = (e) => {
        setForm(prev => ({
            ...prev,
            additionalDescription: e.target.value,
        }));
    };

    const handleNewImagesChange = (files) => {
        setForm(prev => ({
            ...prev,
            newImages: files,
        }));
    };

    const handleRemoveExistingImage = (index) => {
        setForm(prev => ({
            ...prev,
            existingImages: prev.existingImages.filter((_, i) => i !== index),
        }));
    };

    const handleRemoveNewImage = (index) => {
        setForm(prev => ({
            ...prev,
            newImages: prev.newImages.filter((_, i) => i !== index),
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        const maxFiles = 10;
        const maxSizeMB = 10;

        // Validate file count
        if (form.newImages.length + selectedFiles.length > maxFiles) {
            alert(`Chỉ có thể tải tối đa ${maxFiles} ảnh`);
            return;
        }

        // Validate file size
        const invalidFiles = selectedFiles.filter(file => file.size > maxSizeMB * 1024 * 1024);
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

            const existingDescription = (request.description || '').trim();
            const additionalDescription = form.additionalDescription.trim();
            const description = additionalDescription
                ? (existingDescription
                    ? `${existingDescription}\n\n[Cập nhật ${new Date().toLocaleString('vi-VN')}]\n${additionalDescription}`
                    : additionalDescription)
                : existingDescription;

            const payload = {
                description,
            };
            const shouldSendAttachments = Array.isArray(request.attachments) || form.newImages.length > 0;
            if (shouldSendAttachments) {
                payload.attachments = mergedAttachments;
            }

            const updatedRequest = await updateRescueRequest(request.id, payload);

            // Navigate back to status page
            navigate(CITIZEN_ROUTES.RESCUE_REQUEST_STATUS, {
                state: {
                    requestId: (updatedRequest?.id || request?.id),
                    request: updatedRequest || { ...request, updated: true },
                    successMessage: 'Thông tin yêu cầu đã được cập nhật thành công!'
                },
            });
        } catch (err) {
            setError(err.message || 'Không thể cập nhật yêu cầu. Vui lòng thử lại.');
            console.error('Update error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(CITIZEN_ROUTES.RESCUE_REQUEST_STATUS, {
            state: { requestId: request?.id, request },
        });
    };

    // Create preview URLs for new images
    const newImagePreviews = form.newImages.map(file => ({
        file,
        url: URL.createObjectURL(file),
    }));

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            newImagePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
        };
    }, [form.newImages]);

    if (!request) {
        return null; // Will redirect in useEffect
    }

    if (isLoadingRequest) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Đang tải chi tiết yêu cầu...
            </div>
        );
    }

    const totalImages = form.existingImages.length + form.newImages.length;
    const canAddMore = totalImages < 10;

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <section>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Cập nhật Thông tin Yêu cầu
                </h1>
                <p className="text-sm text-slate-600">
                    Vui lòng cung cấp thông tin mới nhất để chúng tôi hỗ trợ bạn tốt nhất.
                </p>
            </section>

            {/* Error message */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Mô tả bổ sung Section */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">
                            Mô tả bổ sung
                        </h2>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-slate-700 mb-2">
                            Chi tiết tình hình hiện tại
                        </h3>
                        <textarea
                            value={form.additionalDescription}
                            onChange={handleDescriptionChange}
                            placeholder="Nhập thêm chi tiết về tình hình của bạn (ví dụ: mực nước dâng, tình trạng sức khỏe cụ thể...)"
                            rows={6}
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                        />
                    </div>
                </section>

                {/* Ảnh bổ sung Section */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Camera className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">
                            Ảnh bổ sung
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Existing images */}
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
                                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 hover:scale-110"
                                            title="Xóa ảnh"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New images */}
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
                                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 hover:scale-110"
                                            title="Xóa ảnh"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload new image button */}
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
                            <p className="text-xs text-slate-500 text-center">
                                Đã đạt giới hạn tối đa 10 ảnh
                            </p>
                        )}
                    </div>
                </section>

                {/* Information message */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            Thông tin thay đổi của bạn sẽ được gửi trực tiếp đến điều phối viên ngay lập tức để điều chỉnh kế hoạch hỗ trợ.
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>Lưu thay đổi</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
