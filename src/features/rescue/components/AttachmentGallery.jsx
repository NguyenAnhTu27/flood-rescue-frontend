import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Build preview URLs from current files and revoke when they change/unmount
    const previews = useMemo(() => (
        files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }))
    ), [files]);

    useEffect(() => () => {
        previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    }, [previews]);

    const mergeFiles = (selectedFiles) => {
        if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) return;

        // Validate file count
        if (files.length + selectedFiles.length > maxFiles) {
            alert(`Chỉ có thể tải tối đa ${maxFiles} ảnh`);
            return;
        }

        // Validate file size
        const invalidFiles = selectedFiles.filter((file) => file.size > maxSizeMB * 1024 * 1024);
        if (invalidFiles.length > 0) {
            alert(`Một số ảnh vượt quá kích thước tối đa ${maxSizeMB}MB`);
            return;
        }

        // Add new files
        onChange([...files, ...selectedFiles]);
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        mergeFiles(selectedFiles);

        // Reset input
        e.target.value = '';
    };

    const handleRemove = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        onChange(newFiles);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'));
        mergeFiles(droppedFiles);
    };

    return (
        <div className="space-y-3">
            <span className="text-sm font-medium text-slate-700">Ảnh minh hoạ hiện trường</span>

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
                </div>
            )}

            {/* Upload area */}
            <div
                className={`rounded-lg border border-dashed p-2.5 transition ${isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-300 bg-slate-50'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={files.length >= maxFiles}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Chọn hoặc kéo thả ảnh
                    </button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={files.length >= maxFiles}
                />
            </div>
        </div>
    );
}
