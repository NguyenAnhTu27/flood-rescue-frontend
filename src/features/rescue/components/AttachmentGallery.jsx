import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

/**
 * Attachment Gallery Component
 * Handles image upload, preview, and removal for rescue request attachments
 * 
 * @param {Object} props
 * @param {File[]} props.files - Array of selected files
 * @param {Function} props.onChange - Callback when files change: (files: File[]) => void
 * @param {number} props.maxFiles - Maximum number of files allowed (default: 10)
 * @param {number} props.maxSizeMB - Maximum file size in MB (default: 10)
 */
export default function AttachmentGallery({ files = [], onChange, maxFiles = 10, maxSizeMB = 10 }) {
    const [previews, setPreviews] = useState([]);

    // Create preview URLs when files change
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        const newPreviews = files.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));

        // Cleanup old preview URLs
        previews.forEach(preview => {
            if (!files.includes(preview.file)) {
                URL.revokeObjectURL(preview.url);
            }
        });

        setPreviews(newPreviews);

        // Cleanup on unmount
        return () => {
            newPreviews.forEach(preview => URL.revokeObjectURL(preview.url));
        };
    }, [files]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);

        // Validate file count
        if (files.length + selectedFiles.length > maxFiles) {
            alert(`Chỉ có thể tải tối đa ${maxFiles} ảnh`);
            return;
        }

        // Validate file size
        const invalidFiles = selectedFiles.filter(file => file.size > maxSizeMB * 1024 * 1024);
        if (invalidFiles.length > 0) {
            alert(`Một số ảnh vượt quá kích thước tối đa ${maxSizeMB}MB`);
            return;
        }

        // Add new files
        onChange([...files, ...selectedFiles]);

        // Reset input
        e.target.value = '';
    };

    const handleRemove = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        onChange(newFiles);
    };

    return (
        <div className="space-y-3">
            <span className="text-sm font-medium text-slate-700">Ảnh minh hoạ hiện trường</span>

            {/* Upload area */}
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/50">
                <Upload className="h-5 w-5 text-slate-500" />
                <span className="font-medium">Nhấn để tải ảnh hoặc kéo thả</span>
                <span className="text-[11px] text-slate-500">
                    Hỗ trợ JPG, PNG tối đa {maxSizeMB}MB
                </span>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={files.length >= maxFiles}
                />
            </label>

            {/* Preview gallery */}
            {previews.length > 0 && (
                <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                        {previews.map((preview, index) => (
                            <div
                                key={index}
                                className="group relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 shadow-sm transition-shadow hover:border-blue-300 hover:shadow-md"
                            >
                                <img
                                    src={preview.url}
                                    alt={`Preview ${index + 1}`}
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-all hover:bg-red-600 hover:scale-110 group-hover:opacity-100"
                                    title="Xóa ảnh"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                    <p className="text-[10px] text-white truncate">
                                        {preview.file.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                        Đã chọn {previews.length} ảnh{maxFiles > 0 && ` (tối đa ${maxFiles})`}
                    </p>
                </div>
            )}
        </div>
    );
}
