import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check, FileText, List, BarChart3, Info } from 'lucide-react';
import { MANAGER_ROUTES } from '../../../app/routes/route.constants.js';
import MapBox from '../../../features/map/components/MapBox.jsx';
import {
    createInventoryIssue,
    approveInventoryIssue,
    generateInventoryIssueCode,
    getInventoryStock,
    getItemCategories,
    getReliefRequest,
} from '../../../features/relief/api.js';
import { getTeams } from '../../../features/teams/api.js';
import { getAssets } from '../../../features/assets/api.js';
import { getUser } from '../../../shared/lib/storage.js';

const INITIAL_ITEMS = [
    {
        id: 1,
        itemCategoryId: '',
        itemName: '',
        quantity: '',
        unit: '',
        stockQty: 0,
    },
];

export default function IssueCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const prefillRequest = useMemo(
        () => location.state?.prefillFromReliefRequest || location.state?.prefillFromRescueRequest || null,
        [location.state]
    );

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        reliefRequestId: null,
        reliefRequestCode: '',
        reliefRequestArea: '',
        teamId: '',
        assetId: '',
        note: '',
    });

    // Items state
    const [items, setItems] = useState(INITIAL_ITEMS);

    // Reference data
    const [itemCategories, setItemCategories] = useState([]);
    const [stockData, setStockData] = useState([]); // Tồn kho hiện tại
    const [teams, setTeams] = useState([]);
    const [assets, setAssets] = useState([]);
    const [selectedReliefDetail, setSelectedReliefDetail] = useState(null);
    const [itemQueryByRow, setItemQueryByRow] = useState({});
    const [itemPickerOpenRow, setItemPickerOpenRow] = useState(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [generatingCode, setGeneratingCode] = useState(false);
    const [autoSaveTime, setAutoSaveTime] = useState(null);

    const parseNoteField = (note, label) => {
        const lines = String(note || '').split('\n');
        const line = lines.find((ln) => ln.trim().startsWith(`${label}:`));
        if (!line) return '';
        return line.replace(`${label}:`, '').trim();
    };

    const extractCoordinates = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        const lat = Number(obj.citizenLatitude ?? obj.latitude ?? obj.currentLatitude ?? obj.lat);
        const lng = Number(obj.citizenLongitude ?? obj.longitude ?? obj.currentLongitude ?? obj.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        return null;
    };

    const calculateDistanceKm = (a, b) => {
        if (!a || !b) return null;
        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);
        const aa = Math.sin(dLat / 2) ** 2
            + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
        return R * c;
    };

    const getStockQtyForCategory = (categoryId) => {
        const targetId = Number(categoryId);
        if (!Number.isFinite(targetId)) return 0;
        const stockItem = stockData.find((s) =>
            Number(s.itemCategoryId) === targetId
            || Number(s.itemId) === targetId
            || Number(s.id) === targetId
        );
        const qty = Number(stockItem?.totalQty ?? stockItem?.qty ?? stockItem?.quantity ?? stockItem?.balance ?? 0);
        return Number.isFinite(qty) ? qty : 0;
    };

    const getCategoryDisplayLabel = (cat) => {
        if (!cat) return '';
        const code = cat.code || '';
        const name = cat.name || cat.categoryName || '';
        const clsCode = cat.classificationCode || '';
        const clsName = cat.classificationName || '';
        const cls = [clsCode, clsName].filter(Boolean).join(' - ');
        return cls
            ? `${code} - ${name} (${cls})`
            : `${code} - ${name}`;
    };

    const filterCategoriesByQuery = (query) => {
        const q = String(query || '').trim().toLowerCase();
        if (!q) return availableItemCategories;
        return availableItemCategories.filter((cat) => {
            const haystack = [
                cat.code,
                cat.name,
                cat.categoryName,
                cat.classificationCode,
                cat.classificationName,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    };

    // Load reference data
    useEffect(() => {
        const loadReferenceData = async () => {
            try {
                setLoadingData(true);
                const [categoriesData, stockDataRes, teamsData, assetsData] = await Promise.allSettled([
                    getItemCategories(),
                    getInventoryStock(),
                    getTeams(),
                    getAssets({ status: 'available' }),
                ]);

                // Parse item categories
                if (categoriesData.status === 'fulfilled') {
                    const data = categoriesData.value;
                    let list = [];
                    if (Array.isArray(data)) list = data;
                    else if (Array.isArray(data?.content)) list = data.content;
                    else if (Array.isArray(data?.data)) list = data.data;
                    setItemCategories(list);
                }

                // Parse stock data
                if (stockDataRes.status === 'fulfilled') {
                    const data = stockDataRes.value;
                    let list = [];
                    if (Array.isArray(data)) list = data;
                    else if (Array.isArray(data?.content)) list = data.content;
                    else if (Array.isArray(data?.data)) list = data.data;
                    else if (Array.isArray(data?.lines)) list = data.lines;
                    setStockData(list);
                }

                // Parse teams
                if (teamsData.status === 'fulfilled') {
                    const data = teamsData.value;
                    let list = [];
                    if (Array.isArray(data)) list = data;
                    else if (Array.isArray(data?.content)) list = data.content;
                    else if (Array.isArray(data?.data)) list = data.data;
                    setTeams(list);
                }

                // Parse assets
                if (assetsData.status === 'fulfilled') {
                    const data = assetsData.value;
                    let list = [];
                    if (Array.isArray(data)) list = data;
                    else if (Array.isArray(data?.content)) list = data.content;
                    else if (Array.isArray(data?.data)) list = data.data;
                    else if (Array.isArray(data?.items)) list = data.items;

                    console.log('[IssueCreatePage] Loaded assets:', list.length);
                    setAssets(list);
                } else {
                    console.warn('[IssueCreatePage] Could not load assets:', assetsData.reason);
                    // Nếu không load được, để mảng rỗng (không dùng mock data ở đây vì đây là form tạo mới)
                    setAssets([]);
                }

                // Generate initial code
                generateCode();
            } catch (e) {
                console.error('Error loading reference data:', e);
                setError('Không thể tải dữ liệu. Vui lòng thử lại.');
            } finally {
                setLoadingData(false);
            }
        };

        loadReferenceData();
    }, []);

    useEffect(() => {
        if (!prefillRequest?.id) {
            window.alert('Trang này chỉ dùng khi xác minh yêu cầu cứu trợ từ hàng đợi.');
            navigate(MANAGER_ROUTES.DASHBOARD, { replace: true });
            return;
        }

        setFormData((prev) => ({
            ...prev,
            reliefRequestId: prefillRequest.id || null,
            reliefRequestCode: prefillRequest.code || prefillRequest.id || '',
            reliefRequestArea: prefillRequest.addressText || '',
            note: prefillRequest.description
                ? `Từ yêu cầu cứu trợ #${prefillRequest.code || prefillRequest.id}: ${prefillRequest.description}`
                : prev.note,
        }));
    }, [navigate, prefillRequest]);

    useEffect(() => {
        const targetId = Number(formData.reliefRequestId || 0);
        if (!targetId) {
            setSelectedReliefDetail(null);
            return;
        }

        let cancelled = false;
        const loadDetail = async () => {
            try {
                const detail = await getReliefRequest(targetId);
                if (!cancelled) setSelectedReliefDetail(detail || null);
            } catch (e) {
                console.warn('[IssueCreatePage] Cannot load relief request detail:', e);
                if (!cancelled) setSelectedReliefDetail(null);
            }
        };
        loadDetail();

        return () => {
            cancelled = true;
        };
    }, [formData.reliefRequestId]);

    // Auto-save timer
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setAutoSaveTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const generateCode = () => {
        setGeneratingCode(true);
        generateInventoryIssueCode()
            .then((data) => {
                setFormData((prev) => ({ ...prev, code: data?.code || '' }));
            })
            .catch((e) => {
                setError(e?.message || 'Không thể sinh mã phiếu xuất từ hệ thống.');
            })
            .finally(() => setGeneratingCode(false));
    };

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddItem = () => {
        const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
        setItems([
            ...items,
            {
                id: nextId,
                itemCategoryId: '',
                itemName: '',
                quantity: '',
                unit: '',
                stockQty: 0,
            },
        ]);
    };

    const handleChangeItem = (id, field, value) => {
        setItems((prev) => {
            const next = prev.map((item) => {
                if (item.id !== id) return item;

                const updated = { ...item, [field]: value };

                // Auto-fill unit and stockQty when itemCategoryId is selected
                if (field === 'itemCategoryId' && value) {
                    const category = itemCategories.find(
                        (cat) => cat.id === parseInt(value) || cat.id === value
                    );
                    if (category) {
                        updated.unit = category.unit || '';
                        updated.itemName = category.name || category.categoryName || '';
                        updated.stockQty = getStockQtyForCategory(category.id);
                    }
                }

                return updated;
            });
            return next;
        });
    };

    const handleRemoveItem = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleQuickSelectStockItem = (cat) => {
        if (!cat?.id) return;
        const emptyRow = items.find((it) => !it.itemCategoryId);
        if (emptyRow) {
            handleChangeItem(emptyRow.id, 'itemCategoryId', String(cat.id));
            setItemQueryByRow((prev) => ({ ...prev, [emptyRow.id]: getCategoryDisplayLabel(cat) }));
            setItemPickerOpenRow(emptyRow.id);
            return;
        }

        const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
        const newRow = {
            id: nextId,
            itemCategoryId: String(cat.id),
            itemName: cat.name || cat.categoryName || '',
            quantity: '',
            unit: cat.unit || '',
            stockQty: getStockQtyForCategory(cat.id),
        };
        setItems((prev) => [...prev, newRow]);
        setItemQueryByRow((prev) => ({ ...prev, [nextId]: getCategoryDisplayLabel(cat) }));
        setItemPickerOpenRow(nextId);
    };

    const summary = useMemo(() => {
        const currentUser = getUser();
        return {
            totalLines: items.length,
            totalTypes: new Set(items.filter((i) => i.itemCategoryId).map((i) => i.itemCategoryId)).size,
            status: 'DRAFT',
            warehouse: 'Kho trung tâm Miền Trung',
            creator: currentUser?.fullName || currentUser?.email || 'Quản lý',
        };
    }, [items]);

    const selectedTeam = useMemo(
        () => teams.find((t) => Number(t.id) === Number(formData.teamId)),
        [teams, formData.teamId]
    );

    const requestCoords = useMemo(
        () => extractCoordinates(selectedReliefDetail),
        [selectedReliefDetail]
    );

    const selectedTeamCoords = useMemo(
        () => extractCoordinates(selectedTeam),
        [selectedTeam]
    );

    const distanceKm = useMemo(
        () => calculateDistanceKm(requestCoords, selectedTeamCoords),
        [requestCoords, selectedTeamCoords]
    );

    const availableItemCategories = useMemo(
        () => itemCategories.filter((cat) => getStockQtyForCategory(cat.id) > 0),
        [itemCategories, stockData]
    );

    const validateForm = () => {
        if (!formData.code) {
            setError('Vui lòng tạo mã phiếu xuất');
            return false;
        }
        if (!formData.reliefRequestId) {
            setError('Vui lòng chọn yêu cầu cứu trợ trong hàng đợi để tạo phiếu xuất.');
            return false;
        }
        if (!formData.teamId) {
            setError('Vui lòng chọn đội cứu hộ phụ trách giao hàng');
            return false;
        }
        if (items.length === 0) {
            setError('Vui lòng thêm ít nhất một mặt hàng xuất');
            return false;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.itemCategoryId) {
                setError(`Vui lòng chọn loại hàng cho dòng ${i + 1}`);
                return false;
            }
            if (!item.quantity || parseFloat(item.quantity) <= 0) {
                setError(`Vui lòng nhập số lượng hợp lệ cho dòng ${i + 1}`);
                return false;
            }
            if (Number(item.stockQty) <= 0) {
                setError(`Loại hàng ở dòng ${i + 1} đã hết tồn kho, vui lòng chọn loại khác`);
                return false;
            }
            if (parseFloat(item.quantity) > Number(item.stockQty)) {
                setError(`Số lượng xuất (${item.quantity}) vượt quá tồn kho (${item.stockQty}) cho dòng ${i + 1}`);
                return false;
            }
        }
        return true;
    };

    const buildPayload = () => {
        const lines = items
            .filter((item) => item.itemCategoryId && item.quantity)
            .map((item) => ({
                itemCategoryId: parseInt(item.itemCategoryId),
                qty: parseFloat(item.quantity),
                unit: item.unit || '',
            }));

        // Build payload theo format của InventoryIssueCreateRequest
        const payload = {
            code: formData.code.trim(),
            lines: lines,
        };

        // Optional fields - chỉ thêm nếu có giá trị
        if (formData.reliefRequestId) {
            payload.reliefRequestId = parseInt(formData.reliefRequestId);
        }
        if (formData.teamId) {
            payload.assignedTeamId = parseInt(formData.teamId);
        }
        if (formData.assetId) {
            payload.assetId = parseInt(formData.assetId);
        }
        if (formData.note && formData.note.trim()) {
            payload.note = formData.note.trim();
        }

        return payload;
    };

    const handleCancel = () => {
        if (window.confirm('Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) {
            navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW);
        }
    };

    const handleSaveDraft = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload = buildPayload();
            console.log('[IssueCreatePage] Saving draft with payload:', payload);

            const result = await createInventoryIssue(payload);
            console.log('[IssueCreatePage] Draft saved successfully:', result);

            window.alert('Đã lưu nháp thành công!');
            navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW);
        } catch (e) {
            console.error('[IssueCreatePage] Error saving draft:', e);
            const errorMessage = e?.response?.data?.message || e?.message || 'Không thể lưu nháp. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!validateForm()) {
            return;
        }

        if (!window.confirm('Bạn có chắc muốn duyệt phiếu xuất này? Sau khi duyệt, số lượng tồn kho sẽ được trừ đi.')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Bước 1: Tạo phiếu xuất (status = DRAFT)
            const payload = buildPayload();
            console.log('[IssueCreatePage] Creating issue with payload:', payload);

            const result = await createInventoryIssue(payload);
            console.log('[IssueCreatePage] Issue created:', result);

            // Bước 2: Duyệt phiếu xuất ngay sau khi tạo
            const issueId = result?.id || result?.data?.id;
            if (issueId) {
                console.log('[IssueCreatePage] Approving issue:', issueId);
                await approveInventoryIssue(issueId);
                console.log('[IssueCreatePage] Issue approved successfully');
            } else {
                console.warn('[IssueCreatePage] Cannot find issue ID from response:', result);
                throw new Error('Không thể lấy ID phiếu xuất để duyệt');
            }

            window.alert('Đã duyệt phiếu xuất thành công!');
            navigate(MANAGER_ROUTES.RELIEF_TEAM_MANAGEMENT, {
                state: {
                    preselectTeamId: formData.teamId ? Number(formData.teamId) : null,
                    fromIssueId: issueId,
                    fromIssueCode: formData.code,
                },
            });
        } catch (e) {
            console.error('[IssueCreatePage] Error approving issue:', e);
            const errorMessage = e?.response?.data?.message || e?.message || 'Không thể duyệt phiếu xuất. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-slate-500">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="mb-2 text-xs text-slate-500">
                    Quản lý / Kho cứu trợ / Phiếu xuất kho
                </nav>
                <h1 className="text-2xl font-bold text-slate-900">Phiếu xuất kho cứu trợ</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Phân phối hàng hóa từ kho trung tâm đến các khu vực cứu trợ khẩn cấp.
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm text-rose-600">{error}</p>
                </div>
            )}

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Left Panel */}
                <div className="flex-1 space-y-6">
                    {/* Thông tin phiếu xuất */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Thông tin phiếu xuất</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Mã phiếu xuất *</label>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => handleFormChange('code', e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="PXK-20231024-001"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        disabled={generatingCode}
                                        className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {generatingCode ? 'Đang tạo...' : 'Tạo mã tự động'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Phiếu cứu trợ liên quan</label>
                                <div className="mt-1 relative">
                                    {formData.reliefRequestCode ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                                            <span className="flex-1 text-sm font-medium text-blue-900">
                                                #{formData.reliefRequestCode} - {formData.reliefRequestArea}
                                            </span>
                                            <span className="text-xs text-blue-700">
                                                TRẠNG THÁI: ĐANG CHỜ XỬ LÝ
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                            Không có yêu cầu cứu trợ để tạo phiếu xuất. Vui lòng quay lại Hàng đợi yêu cầu.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedReliefDetail && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Chi tiết yêu cầu cứu trợ
                                    </div>
                                    <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                                        <div>
                                            <span className="font-semibold">Mã:</span> {selectedReliefDetail.code || selectedReliefDetail.id}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Trạng thái:</span> {selectedReliefDetail.status || 'DRAFT'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Người gửi:</span> {selectedReliefDetail.createdByName || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">SĐT:</span> {selectedReliefDetail.createdByPhone || 'N/A'}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="font-semibold">Địa chỉ:</span> {selectedReliefDetail.citizenAddressText || selectedReliefDetail.targetArea || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Số người:</span> {parseNoteField(selectedReliefDetail.note, 'Số người cần hỗ trợ') || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Ưu tiên:</span> {parseNoteField(selectedReliefDetail.note, 'Mức độ ưu tiên') || 'MEDIUM'}
                                        </div>
                                        {(selectedReliefDetail.lines || []).length > 0 && (
                                            <div className="sm:col-span-2">
                                                <span className="font-semibold">Danh sách hàng:</span>{' '}
                                                {(selectedReliefDetail.lines || [])
                                                    .map((line) => `${line.itemName || line.itemCode || `#${line.itemCategoryId}`}: ${line.qty} ${line.unit || ''}`.trim())
                                                    .join(' | ')}
                                            </div>
                                        )}
                                        {selectedReliefDetail.note && (
                                            <div className="sm:col-span-2">
                                                <span className="font-semibold">Ghi chú:</span> {selectedReliefDetail.note}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-medium text-slate-600">Đội vận chuyển</label>
                                <select
                                    value={formData.teamId}
                                    onChange={(e) => handleFormChange('teamId', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Chọn đội vận chuyển</option>
                                    {teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name || team.teamName || `Đội ${team.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(selectedReliefDetail || selectedTeam) && (
                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            So sánh vị trí yêu cầu và đội vận chuyển
                                        </div>
                                        {Number.isFinite(distanceKm) && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                                Cách nhau ~ {distanceKm.toFixed(2)} km
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-2">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                            <div className="mb-1 text-xs font-semibold text-slate-700">
                                                Vị trí yêu cầu cứu trợ
                                            </div>
                                            <div className="h-52 overflow-hidden rounded-md border border-slate-200 bg-white">
                                                <MapBox
                                                    center={requestCoords || { lat: 10.8231, lng: 106.6297 }}
                                                    markerPosition={requestCoords}
                                                    zoom={requestCoords ? 15 : 11}
                                                />
                                            </div>
                                            <div className="mt-1 text-[11px] text-slate-500">
                                                {requestCoords
                                                    ? `${requestCoords.lat.toFixed(6)}, ${requestCoords.lng.toFixed(6)}`
                                                    : 'Chưa có tọa độ yêu cầu cứu trợ'}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                            <div className="mb-1 text-xs font-semibold text-slate-700">
                                                Vị trí đội vận chuyển đã chọn
                                            </div>
                                            <div className="h-52 overflow-hidden rounded-md border border-slate-200 bg-white">
                                                <MapBox
                                                    center={selectedTeamCoords || requestCoords || { lat: 10.8231, lng: 106.6297 }}
                                                    markerPosition={selectedTeamCoords}
                                                    zoom={selectedTeamCoords ? 15 : 11}
                                                />
                                            </div>
                                            <div className="mt-1 text-[11px] text-slate-500">
                                                {selectedTeamCoords
                                                    ? `${selectedTeamCoords.lat.toFixed(6)}, ${selectedTeamCoords.lng.toFixed(6)}`
                                                    : 'Đội này chưa cập nhật tọa độ hiện tại'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-medium text-slate-600">Phương tiện</label>
                                <select
                                    value={formData.assetId}
                                    onChange={(e) => handleFormChange('assetId', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Chọn phương tiện</option>
                                    {assets.map((asset) => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.code || asset.assetCode || `PT-${asset.id}`} - {asset.type || asset.name || 'Phương tiện'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Ghi chú</label>
                                <textarea
                                    rows={3}
                                    value={formData.note}
                                    onChange={(e) => handleFormChange('note', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Nhập ghi chú chi tiết về lô hàng xuất..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Danh sách hàng xuất */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <List className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900">Danh sách hàng xuất</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Thêm hàng xuất
                            </button>
                        </div>

                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left">LOẠI HÀNG</th>
                                        <th className="px-4 py-3 text-right">SỐ LƯỢNG</th>
                                        <th className="px-4 py-3 text-left">ĐƠN VỊ</th>
                                        <th className="px-4 py-3 text-right">TỒN KHO</th>
                                        <th className="px-4 py-3 text-right">HÀNH ĐỘNG</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, index) => {
                                        const qtyNumber = Number(item.quantity || 0);
                                        const stockNumber = Number(item.stockQty || 0);
                                        const hasQty = String(item.quantity || '').trim() !== '';
                                        const isOverStock = hasQty && qtyNumber > 0 && stockNumber >= 0 && qtyNumber > stockNumber;
                                        return (
                                        <tr key={item.id} className={`hover:bg-slate-50 ${isOverStock ? 'bg-rose-50/50' : ''}`}>
                                            <td className="px-4 py-3 align-top">
                                                <div className="relative">
                                                    <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={
                                                            itemQueryByRow[item.id]
                                                            ?? getCategoryDisplayLabel(
                                                                availableItemCategories.find((cat) => Number(cat.id) === Number(item.itemCategoryId))
                                                            )
                                                        }
                                                        onFocus={() => setItemPickerOpenRow(item.id)}
                                                        onBlur={() => {
                                                            window.setTimeout(() => setItemPickerOpenRow((prev) => (prev === item.id ? null : prev)), 120);
                                                        }}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setItemQueryByRow((prev) => ({ ...prev, [item.id]: value }));
                                                            setItemPickerOpenRow(item.id);
                                                        }}
                                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Tìm theo mã hàng hoặc phân loại..."
                                                    />
                                                        <button
                                                            type="button"
                                                            onClick={() => setItemPickerOpenRow(item.id)}
                                                            className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                                        >
                                                            Tìm
                                                        </button>
                                                    </div>
                                                    {itemPickerOpenRow === item.id && (
                                                        <div className="mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                                                            {filterCategoriesByQuery(itemQueryByRow[item.id]).length === 0 ? (
                                                                <div className="px-3 py-2 text-xs text-slate-500">Không có loại hàng còn tồn kho phù hợp</div>
                                                            ) : (
                                                                filterCategoriesByQuery(itemQueryByRow[item.id]).map((cat) => (
                                                                    <button
                                                                        key={cat.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleChangeItem(item.id, 'itemCategoryId', String(cat.id));
                                                                            setItemQueryByRow((prev) => ({ ...prev, [item.id]: getCategoryDisplayLabel(cat) }));
                                                                            setItemPickerOpenRow(null);
                                                                        }}
                                                                        className="w-full border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50 last:border-b-0"
                                                                    >
                                                                        <div className="font-medium text-slate-900">{cat.code} - {cat.name || cat.categoryName}</div>
                                                                        <div className="text-slate-500">
                                                                            {cat.classificationCode || 'N/A'} - {cat.classificationName || 'Chưa phân loại'} • Tồn kho: {getStockQtyForCategory(cat.id).toLocaleString('vi-VN')}
                                                                        </div>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => handleChangeItem(item.id, 'quantity', e.target.value)}
                                                    className={`w-24 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-1 ${isOverStock ? 'border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                                                />
                                                {isOverStock && (
                                                    <p className="mt-1 text-[11px] font-medium text-rose-600">
                                                        Dòng {index + 1}: Số lượng xuất ({qtyNumber}) vượt quá tồn kho ({stockNumber})
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => handleChangeItem(item.id, 'unit', e.target.value)}
                                                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Thùng..."
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <span className={`text-sm font-medium ${isOverStock ? 'text-rose-700' : 'text-slate-600'}`}>
                                                    {item.stockQty.toLocaleString('vi-VN')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-rose-600 hover:text-rose-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );})}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Danh sách hàng hiện có trong kho
                            </div>
                            <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white">
                                {availableItemCategories.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-slate-500">Hiện không có hàng tồn kho khả dụng.</div>
                                ) : (
                                    availableItemCategories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs last:border-b-0">
                                            <div>
                                                <div className="font-semibold text-slate-900">{cat.code} - {cat.name || cat.categoryName}</div>
                                                <div className="text-slate-500">
                                                    {cat.classificationCode || 'N/A'} - {cat.classificationName || 'Chưa phân loại'} | Đơn vị: {cat.unit || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                                                    Tồn: {getStockQtyForCategory(cat.id).toLocaleString('vi-VN')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickSelectStockItem(cat)}
                                                    className="rounded border border-blue-200 bg-blue-50 px-2 py-1 font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    Chọn
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Summary */}
                <div className="w-full lg:w-80 lg:flex-shrink-0">
                    <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Tóm tắt phiếu</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Trạng thái</label>
                                <div className="mt-1">
                                    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                        BẢN NHÁP
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Kho xuất</label>
                                <p className="mt-1 text-sm text-slate-900">{summary.warehouse}</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Tổng số dòng hàng</label>
                                <p className="mt-1 text-sm text-slate-900">{String(summary.totalLines).padStart(2, '0')} dòng</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Tổng loại vật phẩm</label>
                                <p className="mt-1 text-sm text-slate-900">{String(summary.totalTypes).padStart(2, '0')} loại</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Người tạo</label>
                                <p className="mt-1 text-sm text-slate-900">{summary.creator}</p>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <p className="text-xs text-blue-800">
                                        Sau khi 'Duyệt phiếu xuất', số lượng tồn kho thực tế sẽ được trừ đi và không thể sửa đổi thông tin hàng hóa.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />
                    <span>DRAFT MODE</span>
                    {autoSaveTime && (
                        <>
                            <span>•</span>
                            <span>Tự động lưu lúc {autoSaveTime}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                        Hủy phiếu
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                    >
                        Lưu nháp
                    </button>
                    <button
                        type="button"
                        onClick={handleApprove}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Check className="h-4 w-4" />
                        Duyệt phiếu xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
