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
    const [stockData, setStockData] = useState([]); // Tß╗ôn kho hiß╗çn tß║íi
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
                    // Nß║┐u kh├┤ng load ─æ╞░ß╗úc, ─æß╗â mß║úng rß╗ùng (kh├┤ng d├╣ng mock data ß╗ƒ ─æ├óy v├¼ ─æ├óy l├á form tß║ío mß╗¢i)
                    setAssets([]);
                }

                // Generate initial code
                generateCode();
            } catch (e) {
                console.error('Error loading reference data:', e);
                setError('Kh├┤ng thß╗â tß║úi dß╗» liß╗çu. Vui l├▓ng thß╗¡ lß║íi.');
            } finally {
                setLoadingData(false);
            }
        };

        loadReferenceData();
    }, []);

    useEffect(() => {
        if (!prefillRequest?.id) {
            window.alert('Trang n├áy chß╗ë d├╣ng khi x├íc minh y├¬u cß║ºu cß╗⌐u trß╗ú tß╗½ h├áng ─æß╗úi.');
            navigate(MANAGER_ROUTES.DASHBOARD, { replace: true });
            return;
        }

        setFormData((prev) => ({
            ...prev,
            reliefRequestId: prefillRequest.id || null,
            reliefRequestCode: prefillRequest.code || prefillRequest.id || '',
            reliefRequestArea: prefillRequest.addressText || '',
            note: prefillRequest.description
                ? `Tß╗½ y├¬u cß║ºu cß╗⌐u trß╗ú #${prefillRequest.code || prefillRequest.id}: ${prefillRequest.description}`
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
                setError(e?.message || 'Kh├┤ng thß╗â sinh m├ú phiß║┐u xuß║Ñt tß╗½ hß╗ç thß╗æng.');
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
            warehouse: 'Kho trung t├óm Miß╗ün Trung',
            creator: currentUser?.fullName || currentUser?.email || 'Quß║ún l├╜',
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
            setError('Vui l├▓ng tß║ío m├ú phiß║┐u xuß║Ñt');
            return false;
        }
        if (!formData.reliefRequestId) {
            setError('Vui l├▓ng chß╗ìn y├¬u cß║ºu cß╗⌐u trß╗ú trong h├áng ─æß╗úi ─æß╗â tß║ío phiß║┐u xuß║Ñt.');
            return false;
        }
        if (!formData.teamId) {
            setError('Vui l├▓ng chß╗ìn ─æß╗Öi cß╗⌐u hß╗Ö phß╗Ñ tr├ích giao h├áng');
            return false;
        }
        if (items.length === 0) {
            setError('Vui l├▓ng th├¬m ├¡t nhß║Ñt mß╗Öt mß║╖t h├áng xuß║Ñt');
            return false;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.itemCategoryId) {
                setError(`Vui l├▓ng chß╗ìn loß║íi h├áng cho d├▓ng ${i + 1}`);
                return false;
            }
            if (!item.quantity || parseFloat(item.quantity) <= 0) {
                setError(`Vui l├▓ng nhß║¡p sß╗æ l╞░ß╗úng hß╗úp lß╗ç cho d├▓ng ${i + 1}`);
                return false;
            }
            if (Number(item.stockQty) <= 0) {
                setError(`Loß║íi h├áng ß╗ƒ d├▓ng ${i + 1} ─æ├ú hß║┐t tß╗ôn kho, vui l├▓ng chß╗ìn loß║íi kh├íc`);
                return false;
            }
            if (parseFloat(item.quantity) > Number(item.stockQty)) {
                setError(`Sß╗æ l╞░ß╗úng xuß║Ñt (${item.quantity}) v╞░ß╗út qu├í tß╗ôn kho (${item.stockQty}) cho d├▓ng ${i + 1}`);
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

        // Build payload theo format cß╗ºa InventoryIssueCreateRequest
        const payload = {
            code: formData.code.trim(),
            lines: lines,
        };

        // Optional fields - chß╗ë th├¬m nß║┐u c├│ gi├í trß╗ï
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
        if (window.confirm('Bß║ín c├│ chß║»c muß╗æn hß╗ºy? Dß╗» liß╗çu ch╞░a l╞░u sß║╜ bß╗ï mß║Ñt.')) {
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

            window.alert('─É├ú l╞░u nh├íp th├ánh c├┤ng!');
            navigate(MANAGER_ROUTES.INVENTORY_OVERVIEW);
        } catch (e) {
            console.error('[IssueCreatePage] Error saving draft:', e);
            const errorMessage = e?.response?.data?.message || e?.message || 'Kh├┤ng thß╗â l╞░u nh├íp. Vui l├▓ng thß╗¡ lß║íi.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!validateForm()) {
            return;
        }

        if (!window.confirm('Bß║ín c├│ chß║»c muß╗æn duyß╗çt phiß║┐u xuß║Ñt n├áy? Sau khi duyß╗çt, sß╗æ l╞░ß╗úng tß╗ôn kho sß║╜ ─æ╞░ß╗úc trß╗½ ─æi.')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // B╞░ß╗¢c 1: Tß║ío phiß║┐u xuß║Ñt (status = DRAFT)
            const payload = buildPayload();
            console.log('[IssueCreatePage] Creating issue with payload:', payload);

            const result = await createInventoryIssue(payload);
            console.log('[IssueCreatePage] Issue created:', result);

            // B╞░ß╗¢c 2: Duyß╗çt phiß║┐u xuß║Ñt ngay sau khi tß║ío
            const issueId = result?.id || result?.data?.id;
            if (issueId) {
                console.log('[IssueCreatePage] Approving issue:', issueId);
                await approveInventoryIssue(issueId);
                console.log('[IssueCreatePage] Issue approved successfully');
            } else {
                console.warn('[IssueCreatePage] Cannot find issue ID from response:', result);
                throw new Error('Kh├┤ng thß╗â lß║Ñy ID phiß║┐u xuß║Ñt ─æß╗â duyß╗çt');
            }

            window.alert('─É├ú duyß╗çt phiß║┐u xuß║Ñt th├ánh c├┤ng!');
            navigate(MANAGER_ROUTES.RELIEF_TEAM_MANAGEMENT, {
                state: {
                    preselectTeamId: formData.teamId ? Number(formData.teamId) : null,
                    fromIssueId: issueId,
                    fromIssueCode: formData.code,
                },
            });
        } catch (e) {
            console.error('[IssueCreatePage] Error approving issue:', e);
            const errorMessage = e?.response?.data?.message || e?.message || 'Kh├┤ng thß╗â duyß╗çt phiß║┐u xuß║Ñt. Vui l├▓ng thß╗¡ lß║íi.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-slate-500">─Éang tß║úi dß╗» liß╗çu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="mb-2 text-xs text-slate-500">
                    Quß║ún l├╜ / Kho cß╗⌐u trß╗ú / Phiß║┐u xuß║Ñt kho
                </nav>
                <h1 className="text-2xl font-bold text-slate-900">Phiß║┐u xuß║Ñt kho cß╗⌐u trß╗ú</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Ph├ón phß╗æi h├áng h├│a tß╗½ kho trung t├óm ─æß║┐n c├íc khu vß╗▒c cß╗⌐u trß╗ú khß║⌐n cß║Ñp.
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
                    {/* Th├┤ng tin phiß║┐u xuß║Ñt */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Th├┤ng tin phiß║┐u xuß║Ñt</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">M├ú phiß║┐u xuß║Ñt *</label>
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
                                        {generatingCode ? '─Éang tß║ío...' : 'Tß║ío m├ú tß╗▒ ─æß╗Öng'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Phiß║┐u cß╗⌐u trß╗ú li├¬n quan</label>
                                <div className="mt-1 relative">
                                    {formData.reliefRequestCode ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                                            <span className="flex-1 text-sm font-medium text-blue-900">
                                                #{formData.reliefRequestCode} - {formData.reliefRequestArea}
                                            </span>
                                            <span className="text-xs text-blue-700">
                                                TRß║áNG TH├üI: ─ÉANG CHß╗£ Xß╗¼ L├¥
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                            Kh├┤ng c├│ y├¬u cß║ºu cß╗⌐u trß╗ú ─æß╗â tß║ío phiß║┐u xuß║Ñt. Vui l├▓ng quay lß║íi H├áng ─æß╗úi y├¬u cß║ºu.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedReliefDetail && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Chi tiß║┐t y├¬u cß║ºu cß╗⌐u trß╗ú
                                    </div>
                                    <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                                        <div>
                                            <span className="font-semibold">M├ú:</span> {selectedReliefDetail.code || selectedReliefDetail.id}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Trß║íng th├íi:</span> {selectedReliefDetail.status || 'DRAFT'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Ng╞░ß╗¥i gß╗¡i:</span> {selectedReliefDetail.createdByName || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">S─ÉT:</span> {selectedReliefDetail.createdByPhone || 'N/A'}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="font-semibold">─Éß╗ïa chß╗ë:</span> {selectedReliefDetail.citizenAddressText || selectedReliefDetail.targetArea || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Sß╗æ ng╞░ß╗¥i:</span> {parseNoteField(selectedReliefDetail.note, 'Sß╗æ ng╞░ß╗¥i cß║ºn hß╗ù trß╗ú') || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">╞»u ti├¬n:</span> {parseNoteField(selectedReliefDetail.note, 'Mß╗⌐c ─æß╗Ö ╞░u ti├¬n') || 'MEDIUM'}
                                        </div>
                                        {(selectedReliefDetail.lines || []).length > 0 && (
                                            <div className="sm:col-span-2">
                                                <span className="font-semibold">Danh s├ích h├áng:</span>{' '}
                                                {(selectedReliefDetail.lines || [])
                                                    .map((line) => `${line.itemName || line.itemCode || `#${line.itemCategoryId}`}: ${line.qty} ${line.unit || ''}`.trim())
                                                    .join(' | ')}
                                            </div>
                                        )}
                                        {selectedReliefDetail.note && (
                                            <div className="sm:col-span-2">
                                                <span className="font-semibold">Ghi ch├║:</span> {selectedReliefDetail.note}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-medium text-slate-600">─Éß╗Öi vß║¡n chuyß╗ân</label>
                                <select
                                    value={formData.teamId}
                                    onChange={(e) => handleFormChange('teamId', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Chß╗ìn ─æß╗Öi vß║¡n chuyß╗ân</option>
                                    {teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name || team.teamName || `─Éß╗Öi ${team.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(selectedReliefDetail || selectedTeam) && (
                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            So s├ính vß╗ï tr├¡ y├¬u cß║ºu v├á ─æß╗Öi vß║¡n chuyß╗ân
                                        </div>
                                        {Number.isFinite(distanceKm) && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                                C├ích nhau ~ {distanceKm.toFixed(2)} km
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-2">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                            <div className="mb-1 text-xs font-semibold text-slate-700">
                                                Vß╗ï tr├¡ y├¬u cß║ºu cß╗⌐u trß╗ú
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
                                                    : 'Ch╞░a c├│ tß╗ìa ─æß╗Ö y├¬u cß║ºu cß╗⌐u trß╗ú'}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                            <div className="mb-1 text-xs font-semibold text-slate-700">
                                                Vß╗ï tr├¡ ─æß╗Öi vß║¡n chuyß╗ân ─æ├ú chß╗ìn
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
                                                    : '─Éß╗Öi n├áy ch╞░a cß║¡p nhß║¡t tß╗ìa ─æß╗Ö hiß╗çn tß║íi'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-medium text-slate-600">Ph╞░╞íng tiß╗çn</label>
                                <select
                                    value={formData.assetId}
                                    onChange={(e) => handleFormChange('assetId', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Chß╗ìn ph╞░╞íng tiß╗çn</option>
                                    {assets.map((asset) => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.code || asset.assetCode || `PT-${asset.id}`} - {asset.type || asset.name || 'Ph╞░╞íng tiß╗çn'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Ghi ch├║</label>
                                <textarea
                                    rows={3}
                                    value={formData.note}
                                    onChange={(e) => handleFormChange('note', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Nhß║¡p ghi ch├║ chi tiß║┐t vß╗ü l├┤ h├áng xuß║Ñt..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Danh s├ích h├áng xuß║Ñt */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <List className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900">Danh s├ích h├áng xuß║Ñt</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Th├¬m h├áng xuß║Ñt
                            </button>
                        </div>

                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left">LOß║áI H├ÇNG</th>
                                        <th className="px-4 py-3 text-right">Sß╗É L╞»ß╗óNG</th>
                                        <th className="px-4 py-3 text-left">─É╞áN Vß╗è</th>
                                        <th className="px-4 py-3 text-right">Tß╗ÆN KHO</th>
                                        <th className="px-4 py-3 text-right">H├ÇNH ─Éß╗ÿNG</th>
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
                                                        placeholder="T├¼m theo m├ú h├áng hoß║╖c ph├ón loß║íi..."
                                                    />
                                                        <button
                                                            type="button"
                                                            onClick={() => setItemPickerOpenRow(item.id)}
                                                            className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                                        >
                                                            T├¼m
                                                        </button>
                                                    </div>
                                                    {itemPickerOpenRow === item.id && (
                                                        <div className="mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                                                            {filterCategoriesByQuery(itemQueryByRow[item.id]).length === 0 ? (
                                                                <div className="px-3 py-2 text-xs text-slate-500">Kh├┤ng c├│ loß║íi h├áng c├▓n tß╗ôn kho ph├╣ hß╗úp</div>
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
                                                                            {cat.classificationCode || 'N/A'} - {cat.classificationName || 'Ch╞░a ph├ón loß║íi'} ΓÇó Tß╗ôn kho: {getStockQtyForCategory(cat.id).toLocaleString('vi-VN')}
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
                                                        D├▓ng {index + 1}: Sß╗æ l╞░ß╗úng xuß║Ñt ({qtyNumber}) v╞░ß╗út qu├í tß╗ôn kho ({stockNumber})
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => handleChangeItem(item.id, 'unit', e.target.value)}
                                                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Th├╣ng..."
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
                                Danh s├ích h├áng hiß╗çn c├│ trong kho
                            </div>
                            <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white">
                                {availableItemCategories.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-slate-500">Hiß╗çn kh├┤ng c├│ h├áng tß╗ôn kho khß║ú dß╗Ñng.</div>
                                ) : (
                                    availableItemCategories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs last:border-b-0">
                                            <div>
                                                <div className="font-semibold text-slate-900">{cat.code} - {cat.name || cat.categoryName}</div>
                                                <div className="text-slate-500">
                                                    {cat.classificationCode || 'N/A'} - {cat.classificationName || 'Ch╞░a ph├ón loß║íi'} | ─É╞ín vß╗ï: {cat.unit || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                                                    Tß╗ôn: {getStockQtyForCategory(cat.id).toLocaleString('vi-VN')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickSelectStockItem(cat)}
                                                    className="rounded border border-blue-200 bg-blue-50 px-2 py-1 font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    Chß╗ìn
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
                            <h2 className="text-base font-semibold text-slate-900">T├│m tß║»t phiß║┐u</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600">Trß║íng th├íi</label>
                                <div className="mt-1">
                                    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                        Bß║óN NH├üP
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Kho xuß║Ñt</label>
                                <p className="mt-1 text-sm text-slate-900">{summary.warehouse}</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Tß╗òng sß╗æ d├▓ng h├áng</label>
                                <p className="mt-1 text-sm text-slate-900">{String(summary.totalLines).padStart(2, '0')} d├▓ng</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Tß╗òng loß║íi vß║¡t phß║⌐m</label>
                                <p className="mt-1 text-sm text-slate-900">{String(summary.totalTypes).padStart(2, '0')} loß║íi</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">Ng╞░ß╗¥i tß║ío</label>
                                <p className="mt-1 text-sm text-slate-900">{summary.creator}</p>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <p className="text-xs text-blue-800">
                                        Sau khi 'Duyß╗çt phiß║┐u xuß║Ñt', sß╗æ l╞░ß╗úng tß╗ôn kho thß╗▒c tß║┐ sß║╜ ─æ╞░ß╗úc trß╗½ ─æi v├á kh├┤ng thß╗â sß╗¡a ─æß╗òi th├┤ng tin h├áng h├│a.
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
                            <span>ΓÇó</span>
                            <span>Tß╗▒ ─æß╗Öng l╞░u l├║c {autoSaveTime}</span>
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
                        Hß╗ºy phiß║┐u
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                    >
                        L╞░u nh├íp
                    </button>
                    <button
                        type="button"
                        onClick={handleApprove}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Check className="h-4 w-4" />
                        Duyß╗çt phiß║┐u xuß║Ñt
                    </button>
                </div>
            </div>
        </div>
    );
}
