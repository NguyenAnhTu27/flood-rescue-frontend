import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { MANAGER_ROUTES } from '../../app/routes/route.constants.js';
import { listReliefRequests, getAreas, getItemCategories } from '../../features/relief/api.js';

const STATUS_FILTERS = [
    { id: 'all', label: 'Tất cả', value: null, count: 128 },
    { id: 'pending', label: 'Chờ duyệt', value: 'PENDING', count: 42, color: 'bg-yellow-500' },
    { id: 'approved', label: 'Đã duyệt', value: 'APPROVED', count: 76, color: 'bg-green-500' },
    { id: 'rejected', label: 'Từ chối', value: 'REJECTED', count: 10, color: 'bg-red-500' },
];

const STATUS_BADGES = {
    PENDING: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
    APPROVED: { label: 'Đã duyệt', className: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-700' },
};

// Mock data - sẽ được thay thế bằng API
const mockRequests = [
    {
        id: 'REQ-1024',
        code: 'REQ-1024',
        sender: { name: 'Nguyễn Văn An', phone: '0905 123 456' },
        area: 'Huyện Lệ Thủy, Quảng Bình',
        items: ['Gạo', 'Nước sạch', 'Mi tôm'],
        dateSent: '20/10/2023',
        status: 'PENDING',
    },
    {
        id: 'REQ-1023',
        code: 'REQ-1023',
        sender: { name: 'Trần Thị Hoa', phone: '0987 654 321' },
        area: 'Thị xã Ba Đồn, Quảng Bình',
        items: ['Thuốc men', 'Chăn màn'],
        dateSent: '19/10/2023',
        status: 'APPROVED',
    },
    {
        id: 'REQ-1022',
        code: 'REQ-1022',
        sender: { name: 'Lê Minh Đức', phone: '0912 345 678' },
        area: 'Huyện Cam Lộ, Quảng Trị',
        items: ['Áo phao', 'Pin dự phòng'],
        dateSent: '19/10/2023',
        status: 'REJECTED',
    },
    {
        id: 'REQ-1021',
        code: 'REQ-1021',
        sender: { name: 'Phạm Thu Trang', phone: '0933 987 654' },
        area: 'Huyện Hương Khê, Hà Tĩnh',
        items: ['Sữa trẻ em', 'Thực phẩm khô'],
        dateSent: '18/10/2023',
        status: 'PENDING',
    },
    {
        id: 'REQ-1020',
        code: 'REQ-1020',
        sender: { name: 'Hoàng Văn Thái', phone: '0944 222 333' },
        area: 'Huyện Kỳ Anh, Hà Tĩnh',
        items: ['Gạo', 'Dầu ăn'],
        dateSent: '18/10/2023',
        status: 'PENDING',
    },
];

const ITEMS_PER_PAGE = 5;

export default function ReliefRequestDashboardPage() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [areas, setAreas] = useState([]); // Danh sách khu vực để map targetAreaId -> name
    const [itemCategories, setItemCategories] = useState([]); // Danh sách loại hàng để map itemCategoryId -> name
    const [stats, setStats] = useState({
        all: 128,
        pending: 42,
        approved: 76,
        rejected: 10,
    });

    // Load areas and item categories for mapping
    useEffect(() => {
        const loadReferenceData = async () => {
            try {
                const [areasData, categoriesData] = await Promise.allSettled([
                    getAreas(),
                    getItemCategories(),
                ]);

                // Parse areas
                if (areasData.status === 'fulfilled') {
                    let areasList = [];
                    const data = areasData.value;
                    if (Array.isArray(data)) areasList = data;
                    else if (Array.isArray(data?.data)) areasList = data.data;
                    else if (Array.isArray(data?.content)) areasList = data.content;
                    setAreas(areasList);
                }

                // Parse item categories
                if (categoriesData.status === 'fulfilled') {
                    let categoriesList = [];
                    const data = categoriesData.value;
                    if (Array.isArray(data)) categoriesList = data;
                    else if (Array.isArray(data?.data)) categoriesList = data.data;
                    else if (Array.isArray(data?.content)) categoriesList = data.content;
                    setItemCategories(categoriesList);
                }
            } catch (e) {
                console.warn('[ReliefRequestDashboardPage] Could not load reference data:', e);
            }
        };

        loadReferenceData();
    }, []);

    // Load requests from API
    useEffect(() => {
        const loadRequests = async () => {
            try {
                setLoading(true);
                setError(null);
                const params = {
                    status: statusFilter,
                    page: currentPage - 1,
                    size: ITEMS_PER_PAGE,
                };
                const data = await listReliefRequests(params);

                // Parse response format
                let requestsList = [];
                let totalCount = 0;

                if (Array.isArray(data)) {
                    requestsList = data;
                    totalCount = data.length;
                } else if (Array.isArray(data?.content)) {
                    requestsList = data.content;
                    totalCount = data.totalElements || data.total || data.content.length;
                } else if (Array.isArray(data?.data)) {
                    requestsList = data.data;
                    totalCount = data.total || data.data.length;
                } else if (Array.isArray(data?.items)) {
                    requestsList = data.items;
                    totalCount = data.total || data.items.length;
                }

                // Map và normalize dữ liệu requests
                const mappedRequests = requestsList.map((req) => {
                    // Map targetArea (có thể là ID hoặc tên)
                    let areaName = req.area || req.location || req.targetAreaName;
                    if (!areaName && req.targetArea) {
                        // Nếu targetArea là ID, tìm trong danh sách areas
                        const area = areas.find(
                            (a) => a.id === req.targetArea || a.id === parseInt(req.targetArea) || a.name === req.targetArea
                        );
                        areaName = area?.name || req.targetArea;
                    }

                    // Map items từ lines
                    let itemsList = req.items || req.essentialItems || [];
                    if (!itemsList.length && req.lines && Array.isArray(req.lines)) {
                        // Nếu có lines, map từ lines
                        itemsList = req.lines.map((line) => {
                            // Ưu tiên itemName, sau đó tìm trong itemCategories
                            const itemName = line.itemName || line.name;
                            if (itemName) return itemName;

                            // Nếu có itemCategoryId, tìm tên trong itemCategories
                            if (line.itemCategoryId) {
                                const category = itemCategories.find(
                                    (cat) => cat.id === line.itemCategoryId || cat.id === parseInt(line.itemCategoryId)
                                );
                                return category?.name || category?.categoryName || `Loại hàng #${line.itemCategoryId}`;
                            }

                            return 'Mặt hàng';
                        });
                    }

                    return {
                        ...req,
                        area: areaName || 'N/A',
                        items: itemsList,
                        essentialItems: itemsList, // Đảm bảo tương thích với code hiện tại
                    };
                });

                // Update stats if available
                if (data?.stats) {
                    setStats(data.stats);
                }

                // Nếu API trả về rỗng, dùng mock data
                setRequests(mappedRequests.length > 0 ? mappedRequests : mockRequests);
            } catch (e) {
                console.warn('[ReliefRequestDashboardPage] Could not load requests, using mock data:', e);
                // Nếu API fail, dùng mock data
                setRequests(mockRequests);
            } finally {
                setLoading(false);
            }
        };
        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, currentPage, areas, itemCategories]);

    const filteredRequests = useMemo(() => {
        if (!statusFilter) return requests;
        return requests.filter((req) => req.status === statusFilter);
    }, [requests, statusFilter]);

    const totalPages = Math.max(1, Math.ceil((statusFilter ? filteredRequests.length : stats.all) / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

    const handleViewDetail = (request) => {
        // Navigate to detail/verify page
        navigate(`${MANAGER_ROUTES.RELIEF_APPROVE}?id=${request.id}`);
    };

    const handleExportReport = () => {
        // TODO: Implement export functionality
        console.log('Export report with filters:', { statusFilter });
        window.alert('Tính năng xuất báo cáo đang được phát triển');
    };

    const handleFilter = () => {
        // TODO: Open filter modal
        console.log('Open filter modal');
        window.alert('Tính năng bộ lọc đang được phát triển');
    };

    return (
        <div className="space-y-6">
            {/* ===== HEADER ===== */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Danh sách Yêu cầu Cứu trợ</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Quản lý, xác minh và điều phối nguồn lực cứu trợ cho người dân vùng lũ.
                </p>
            </div>

            {/* ===== FILTER & ACTION BAR ===== */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    {STATUS_FILTERS.map((filter) => {
                        const isActive = statusFilter === filter.value;
                        const count = stats[filter.id] || filter.count || 0;
                        return (
                            <button
                                key={filter.id}
                                onClick={() => {
                                    setStatusFilter(filter.value);
                                    setCurrentPage(1);
                                }}
                                className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {filter.label} {count}
                                {!isActive && filter.color && (
                                    <span className={`h-2 w-2 rounded-full ${filter.color}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleFilter}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        <Filter className="h-4 w-4" />
                        Bộ lọc
                    </button>
                    <button
                        onClick={() => navigate(MANAGER_ROUTES.RELIEF_REQUEST_CREATE)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                        + Tạo yêu cầu cứu trợ
                    </button>
                </div>
            </div>

            {/* ===== TABLE ===== */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-500">Đang tải danh sách yêu cầu...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <p className="text-rose-600">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            MÃ YÊU CẦU
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            NGƯỜI GỬI
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            KHU VỰC
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            NHU YẾU PHẨM
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            NGÀY GỬI
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            TRẠNG THÁI
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            THAO TÁC
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {paginatedRequests.map((request) => {
                                        const statusBadge = STATUS_BADGES[request.status] || STATUS_BADGES.PENDING;
                                        const isPending = request.status === 'PENDING';
                                        return (
                                            <tr key={request.id} className="hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className="font-semibold text-slate-900">
                                                        {request.code || request.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {request.sender?.name || request.senderName || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {request.sender?.phone || request.senderPhone || ''}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-700">
                                                        {request.area || request.location || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(request.items || request.essentialItems || []).map(
                                                            (item, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                                                                >
                                                                    {typeof item === 'string' ? item : item.name || item}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {request.dateSent ||
                                                        request.createdAt ||
                                                        new Date(request.createdAt || Date.now()).toLocaleDateString(
                                                            'vi-VN'
                                                        )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadge.className}`}
                                                    >
                                                        {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <button
                                                        onClick={() => handleViewDetail(request)}
                                                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${isPending
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        {isPending ? 'Xem & xác minh' : 'Chi tiết'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty state */}
                        {paginatedRequests.length === 0 && (
                            <div className="p-12 text-center">
                                <p className="text-slate-500">Không có yêu cầu nào phù hợp với bộ lọc.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ===== PAGINATION ===== */}
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-slate-500">
                    Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} trong{' '}
                    {statusFilter ? filteredRequests.length : stats.all} yêu cầu
                </p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                            page = i + 1;
                        } else if (currentPage <= 3) {
                            page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                        } else {
                            page = currentPage - 2 + i;
                        }

                        const isActive = page === currentPage;
                        return (
                            <React.Fragment key={page}>
                                {i === 0 && currentPage > 3 && totalPages > 5 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            className="h-9 w-9 rounded-lg text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                        >
                                            1
                                        </button>
                                        <span className="px-2 text-slate-400">...</span>
                                    </>
                                )}
                                <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-9 w-9 rounded-lg text-sm font-medium transition ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    {page}
                                </button>
                                {i === 4 && currentPage < totalPages - 2 && totalPages > 5 && (
                                    <>
                                        <span className="px-2 text-slate-400">...</span>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="h-9 w-9 rounded-lg text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </React.Fragment>
                        );
                    })}
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
