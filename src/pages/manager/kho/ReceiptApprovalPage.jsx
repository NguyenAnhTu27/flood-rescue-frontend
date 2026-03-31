import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, Eye, RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import {
    listInventoryReceipts,
    approveInventoryReceipt,
    cancelInventoryReceipt,
    getInventoryReceipt,
} from '../../../features/relief/api.js';

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'DONE', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_COLORS = {
    DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-blue-100 text-blue-700 border-blue-200',
    DONE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
};

const STATUS_LABELS = {
    DRAFT: 'Nháp',
    APPROVED: 'Đã duyệt',
    DONE: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
};

export default function ReceiptApprovalPage() {
    const navigate = useNavigate();
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // FIX: Set mặc định filter = 'DRAFT' để dễ thấy phiếu cần duyệt
    const [statusFilter, setStatusFilter] = useState('DRAFT');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    // FIX: Thêm state để track action đang thực hiện
    const [actionLoading, setActionLoading] = useState({});
    // State cho modal duyệt
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [receiptToApprove, setReceiptToApprove] = useState(null);
    const [approveModalLoading, setApproveModalLoading] = useState(false);
    // State để track row nào đang được expand để hiển thị form duyệt
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Load danh sách phiếu nhập
    const fetchReceipts = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.current - 1,
                size: pagination.pageSize,
            };

            if (statusFilter) {
                params.status = statusFilter;
            }

            console.log('[ReceiptApprovalPage] Fetching receipts with params:', params);
            const response = await listInventoryReceipts(params);
            console.log('[ReceiptApprovalPage] Receipts response:', response);

            // Parse response format
            let receiptsList = [];
            let total = 0;

            if (Array.isArray(response)) {
                receiptsList = response;
                total = response.length;
            } else if (Array.isArray(response?.content)) {
                receiptsList = response.content;
                total = response.totalElements || response.total || response.content.length;
            } else if (Array.isArray(response?.data)) {
                receiptsList = response.data;
                total = response.totalElements || response.total || response.data.length;
            } else if (Array.isArray(response?.items)) {
                receiptsList = response.items;
                total = response.totalElements || response.total || response.items.length;
            }

            console.log('[ReceiptApprovalPage] Parsed receipts list:', receiptsList);
            console.log('[ReceiptApprovalPage] Receipts with DRAFT status:', receiptsList.filter(r => r.status === 'DRAFT'));

            setReceipts(receiptsList);
            setPagination((prev) => ({
                ...prev,
                total: total,
            }));
        } catch (e) {
            console.error('[ReceiptApprovalPage] Error fetching receipts:', e);
            setError(e?.message || 'Không thể tải danh sách phiếu nhập kho');
            setReceipts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, [statusFilter, pagination.current]);

    // Load chi tiết phiếu nhập
    const loadReceiptDetail = async (id) => {
        try {
            setDetailLoading(true);
            const response = await getInventoryReceipt(id);
            console.log('[ReceiptApprovalPage] Receipt detail:', response);
            setSelectedReceipt(response);
            setShowDetailModal(true);
        } catch (e) {
            console.error('[ReceiptApprovalPage] Error loading receipt detail:', e);
            window.alert('Không thể tải chi tiết phiếu nhập: ' + (e?.message || 'Lỗi không xác định'));
        } finally {
            setDetailLoading(false);
        }
    };

    // Toggle expand row để hiển thị form duyệt
    const toggleExpandRow = async (receiptId) => {
        const newExpanded = new Set(expandedRows);

        if (newExpanded.has(receiptId)) {
            // Đóng row
            newExpanded.delete(receiptId);
            setExpandedRows(newExpanded);
        } else {
            // Mở row
            newExpanded.add(receiptId);
            setExpandedRows(newExpanded);
        }
    };

    // Mở modal duyệt
    const openApproveModal = async (receipt) => {
        try {
            setApproveModalLoading(true);
            // Load chi tiết phiếu nhập
            const detail = await getInventoryReceipt(receipt.id);
            setReceiptToApprove(detail);
            setShowApproveModal(true);
        } catch (e) {
            console.error('[ReceiptApprovalPage] Error loading receipt for approval:', e);
            window.alert('Không thể tải chi tiết phiếu nhập: ' + (e?.message || 'Lỗi không xác định'));
        } finally {
            setApproveModalLoading(false);
        }
    };

    // FIX: Cải thiện hàm duyệt phiếu nhập
    const handleApprove = async (id, code) => {
        try {
            // Set loading state cho action cụ thể
            setActionLoading((prev) => ({ ...prev, [`approve-${id}`]: true }));
            setError(null);

            console.log('[ReceiptApprovalPage] Approving receipt:', id);

            // Gọi API duyệt
            const result = await approveInventoryReceipt(id);
            console.log('[ReceiptApprovalPage] Approve result:', result);

            // Kiểm tra kết quả
            if (result && result.status === 'DONE') {
                window.alert(`✓ Đã duyệt phiếu nhập "${code}" thành công!\n\nTrạng thái: ${result.status}\nTồn kho đã được cập nhật.`);
            } else {
                window.alert(`✓ Đã duyệt phiếu nhập "${code}" thành công!`);
            }

            // Đóng modal và form expandable, refresh danh sách
            setShowApproveModal(false);
            setReceiptToApprove(null);
            // Đóng tất cả các row đang expand
            setExpandedRows(new Set());
            await fetchReceipts();
        } catch (e) {
            console.error('[ReceiptApprovalPage] Error approving receipt:', e);
            const errorMsg =
                e?.data?.message ||
                e?.response?.data?.message ||
                e?.message ||
                'Không thể duyệt phiếu nhập';
            setError(`Lỗi khi duyệt phiếu nhập: ${errorMsg}`);
            window.alert(`❌ Lỗi khi duyệt phiếu nhập:\n\n${errorMsg}`);
        } finally {
            setActionLoading((prev) => ({ ...prev, [`approve-${id}`]: false }));
        }
    };

    // FIX: Cải thiện hàm hủy phiếu nhập
    const handleCancel = async (id, code) => {
        if (!window.confirm(`Bạn có chắc chắn muốn hủy phiếu nhập "${code}"?\n\nPhiếu nhập sẽ không thể duyệt sau khi hủy.`)) {
            return;
        }

        try {
            // Set loading state cho action cụ thể
            setActionLoading((prev) => ({ ...prev, [`cancel-${id}`]: true }));
            setError(null);

            console.log('[ReceiptApprovalPage] Cancelling receipt:', id);

            // Gọi API hủy
            const result = await cancelInventoryReceipt(id);
            console.log('[ReceiptApprovalPage] Cancel result:', result);

            window.alert(`✓ Đã hủy phiếu nhập "${code}" thành công!`);

            // Refresh danh sách
            await fetchReceipts();
        } catch (e) {
            console.error('[ReceiptApprovalPage] Error cancelling receipt:', e);
            const errorMsg =
                e?.data?.message ||
                e?.response?.data?.message ||
                e?.message ||
                'Không thể hủy phiếu nhập';
            setError(`Lỗi khi hủy phiếu nhập: ${errorMsg}`);
            window.alert(`❌ Lỗi khi hủy phiếu nhập:\n\n${errorMsg}`);
        } finally {
            setActionLoading((prev) => ({ ...prev, [`cancel-${id}`]: false }));
        }
    };

    const handlePageChange = (page) => {
        setPagination((prev) => ({
            ...prev,
            current: page,
        }));
    };

    const handlePageSizeChange = (e) => {
        setPagination((prev) => ({
            ...prev,
            current: 1,
            pageSize: Number(e.target.value),
        }));
    };

    const getSourceTypeLabel = (sourceType) => {
        return sourceType === 'DONATION' ? 'Quyên góp' : 'Mua vào';
    };

    const getSourceTypeColor = (sourceType) => {
        return sourceType === 'DONATION'
            ? 'bg-blue-100 text-blue-700 border-blue-200'
            : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    // FIX: Helper để check loading state
    const isActionLoading = (action, id) => {
        return actionLoading[`${action}-${id}`] || false;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW)}
                        className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                        <ChevronLeft className="h-3 w-3" />
                        Trở về Kho Trung tâm
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">Duyệt phiếu nhập kho</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý và duyệt các phiếu nhập kho trong hệ thống
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Filter className="h-4 w-4 text-slate-400" />
                <label className="text-sm font-medium text-slate-700">Lọc theo trạng thái:</label>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPagination((prev) => ({ ...prev, current: 1 }));
                    }}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={fetchReceipts}
                    disabled={loading}
                    className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {/* FIX: Thêm thông báo khi không có phiếu DRAFT */}
            {!loading && statusFilter === 'DRAFT' && receipts.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    ℹ️ Không có phiếu nhập nào ở trạng thái "Nháp" cần duyệt. Hãy tạo phiếu nhập mới hoặc chọn filter khác.
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Mã phiếu
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Nguồn hàng
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Số dòng
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Ghi chú
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Duyệt
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Ngày tạo
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Đang tải...
                                        </div>
                                    </td>
                                </tr>
                            ) : receipts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                                        Không có phiếu nhập kho nào
                                    </td>
                                </tr>
                            ) : (
                                receipts.map((receipt) => {
                                    const approveLoading = isActionLoading('approve', receipt.id);
                                    const cancelLoading = isActionLoading('cancel', receipt.id);

                                    // Debug: Log receipt status
                                    console.log('[ReceiptApprovalPage] Receipt:', {
                                        id: receipt.id,
                                        code: receipt.code,
                                        status: receipt.status,
                                        isDraft: receipt.status === 'DRAFT' || receipt.status === 'Nháp' || receipt.status === 'Draft'
                                    });

                                    const isExpanded = expandedRows.has(receipt.id);

                                    return (
                                        <React.Fragment key={receipt.id}>
                                            <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpandRow(receipt.id)}
                                                            className="rounded p-1 hover:bg-slate-100"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-4 w-4 text-slate-500" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 text-slate-500" />
                                                            )}
                                                        </button>
                                                        <span>{receipt.code || `#${receipt.id}`}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[receipt.status] ||
                                                            'bg-slate-100 text-slate-700 border-slate-200'
                                                            }`}
                                                    >
                                                        {STATUS_LABELS[receipt.status] || receipt.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSourceTypeColor(
                                                            receipt.sourceType
                                                        )}`}
                                                    >
                                                        {getSourceTypeLabel(receipt.sourceType)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-slate-700">
                                                    {receipt.lines?.length || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {receipt.note || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {(() => {
                                                        // Kiểm tra nhiều format status có thể là DRAFT
                                                        const isDraft =
                                                            receipt.status === 'DRAFT' ||
                                                            receipt.status === 'Nháp' ||
                                                            receipt.status === 'Draft' ||
                                                            receipt.status === 'draft' ||
                                                            (typeof receipt.status === 'string' && receipt.status.toUpperCase() === 'DRAFT');

                                                        if (isDraft) {
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openApproveModal(receipt)}
                                                                    disabled={approveLoading || cancelLoading || loading}
                                                                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {approveLoading ? (
                                                                        <>
                                                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                                            Đang duyệt...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                                            Duyệt
                                                                        </>
                                                                    )}
                                                                </button>
                                                            );
                                                        }
                                                        return <span className="text-xs text-slate-400">-</span>;
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {receipt.createdAt
                                                        ? new Date(receipt.createdAt).toLocaleString('vi-VN')
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Chỉ hiển thị nút Hủy khi status = DRAFT */}
                                                        {receipt.status === 'DRAFT' && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCancel(receipt.id, receipt.code)
                                                                }
                                                                disabled={approveLoading || cancelLoading || loading}
                                                                className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {cancelLoading ? (
                                                                    <>
                                                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                                        Đang hủy...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-3.5 w-3.5" />
                                                                        Hủy
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => loadReceiptDetail(receipt.id)}
                                                            disabled={detailLoading}
                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Chi tiết
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Expandable row hiển thị form duyệt */}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && receipts.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                        <div className="text-sm text-slate-600">
                            Hiển thị{' '}
                            <span className="font-medium">
                                {(pagination.current - 1) * pagination.pageSize + 1} -{' '}
                                {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                            </span>{' '}
                            trong tổng số <span className="font-medium">{pagination.total}</span> phiếu nhập
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={pagination.pageSize}
                                onChange={handlePageSizeChange}
                                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                            >
                                <option value="10">10 / trang</option>
                                <option value="20">20 / trang</option>
                                <option value="50">50 / trang</option>
                                <option value="100">100 / trang</option>
                            </select>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current - 1)}
                                    disabled={pagination.current === 1}
                                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <span className="px-2 text-xs text-slate-600">
                                    Trang {pagination.current} /{' '}
                                    {Math.ceil(pagination.total / pagination.pageSize) || 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current + 1)}
                                    disabled={
                                        pagination.current >= Math.ceil(pagination.total / pagination.pageSize)
                                    }
                                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Chi tiết phiếu nhập {selectedReceipt.code || `#${selectedReceipt.id}`}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedReceipt(null);
                                }}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                            {detailLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                                    <span className="ml-2 text-sm text-slate-500">Đang tải...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Mã phiếu
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {selectedReceipt.code || `#${selectedReceipt.id}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Trạng thái
                                            </p>
                                            <p className="mt-1">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[selectedReceipt.status] ||
                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                        }`}
                                                >
                                                    {STATUS_LABELS[selectedReceipt.status] ||
                                                        selectedReceipt.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Nguồn hàng
                                            </p>
                                            <p className="mt-1">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSourceTypeColor(
                                                        selectedReceipt.sourceType
                                                    )}`}
                                                >
                                                    {getSourceTypeLabel(selectedReceipt.sourceType)}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Ngày tạo
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {selectedReceipt.createdAt
                                                    ? new Date(selectedReceipt.createdAt).toLocaleString('vi-VN')
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedReceipt.note && (
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Ghi chú
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700">{selectedReceipt.note}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Danh sách mặt hàng
                                        </p>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                                            <table className="w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            Mặt hàng
                                                        </th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            Số lượng
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            Đơn vị
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedReceipt.lines && selectedReceipt.lines.length > 0 ? (
                                                        selectedReceipt.lines.map((line, idx) => (
                                                            <tr
                                                                key={idx}
                                                                className="border-b border-slate-100 last:border-0"
                                                            >
                                                                <td className="px-4 py-2 text-sm text-slate-700">
                                                                    {line.itemName ||
                                                                        line.itemCategoryName ||
                                                                        `Mặt hàng ${idx + 1}`}
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-sm font-medium text-slate-900">
                                                                    {line.qty ?? line.quantity ?? 0}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-slate-600">
                                                                    {line.unit || '-'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan="3"
                                                                className="px-4 py-4 text-center text-sm text-slate-500"
                                                            >
                                                                Không có mặt hàng nào
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            {/* Nút Duyệt */}
                            {(() => {
                                const isDraft =
                                    selectedReceipt.status === 'DRAFT' ||
                                    selectedReceipt.status === 'Nháp' ||
                                    selectedReceipt.status === 'Draft' ||
                                    selectedReceipt.status === 'draft' ||
                                    (typeof selectedReceipt.status === 'string' &&
                                        selectedReceipt.status.toUpperCase() === 'DRAFT');

                                if (!isDraft) return null;

                                return (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    `Bạn có chắc chắn muốn duyệt phiếu nhập "${selectedReceipt.code || `#${selectedReceipt.id}`}"?\n\nSau khi duyệt, tồn kho sẽ được cập nhật tự động.`
                                                )
                                            ) {
                                                handleApprove(
                                                    selectedReceipt.id,
                                                    selectedReceipt.code || `#${selectedReceipt.id}`
                                                );
                                            }
                                        }}
                                        disabled={isActionLoading('approve', selectedReceipt.id)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isActionLoading('approve', selectedReceipt.id) ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Đang duyệt...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Duyệt
                                            </>
                                        )}
                                    </button>
                                );
                            })()}

                            {/* Nút Đóng */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedReceipt(null);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Form Duyệt Phiếu Nhập */}
            {showApproveModal && receiptToApprove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Duyệt phiếu nhập {receiptToApprove.code || `#${receiptToApprove.id}`}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setReceiptToApprove(null);
                                }}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                            {approveModalLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                                    <span className="ml-2 text-sm text-slate-500">Đang tải...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Thông tin phiếu nhập */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Mã phiếu
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {receiptToApprove.code || `#${receiptToApprove.id}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Trạng thái
                                            </p>
                                            <p className="mt-1">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[receiptToApprove.status] ||
                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                        }`}
                                                >
                                                    {STATUS_LABELS[receiptToApprove.status] ||
                                                        receiptToApprove.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Nguồn hàng
                                            </p>
                                            <p className="mt-1">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSourceTypeColor(
                                                        receiptToApprove.sourceType
                                                    )}`}
                                                >
                                                    {getSourceTypeLabel(receiptToApprove.sourceType)}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Ngày tạo
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {receiptToApprove.createdAt
                                                    ? new Date(
                                                        receiptToApprove.createdAt
                                                    ).toLocaleString('vi-VN')
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {receiptToApprove.note && (
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Ghi chú
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {receiptToApprove.note}
                                            </p>
                                        </div>
                                    )}

                                    {/* Danh sách mặt hàng */}
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Danh sách mặt hàng
                                        </p>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                                            <table className="w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            Mặt hàng
                                                        </th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            Số lượng
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            Đơn vị
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {receiptToApprove.lines &&
                                                        receiptToApprove.lines.length > 0 ? (
                                                        receiptToApprove.lines.map((line, idx) => (
                                                            <tr
                                                                key={idx}
                                                                className="border-b border-slate-100 last:border-0"
                                                            >
                                                                <td className="px-4 py-2 text-sm text-slate-700">
                                                                    {line.itemName ||
                                                                        line.itemCategoryName ||
                                                                        `Mặt hàng ${idx + 1}`}
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-sm font-medium text-slate-900">
                                                                    {line.qty ?? line.quantity ?? 0}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-slate-600">
                                                                    {line.unit || '-'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan="3"
                                                                className="px-4 py-4 text-center text-sm text-slate-500"
                                                            >
                                                                Không có mặt hàng nào
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Thông báo */}
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                                        <p className="text-sm text-blue-800">
                                            <strong>Lưu ý:</strong> Sau khi duyệt, tồn kho sẽ được cập nhật tự động với số lượng mặt hàng trong phiếu nhập này.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setReceiptToApprove(null);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    handleApprove(
                                        receiptToApprove.id,
                                        receiptToApprove.code || `#${receiptToApprove.id}`
                                    )
                                }
                                disabled={
                                    isActionLoading('approve', receiptToApprove.id) ||
                                    receiptToApprove.status !== 'DRAFT'
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isActionLoading('approve', receiptToApprove.id) ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Đang duyệt...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Xác nhận duyệt
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
