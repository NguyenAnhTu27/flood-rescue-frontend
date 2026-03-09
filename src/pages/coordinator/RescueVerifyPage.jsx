import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    MapPin,
    Clock,
    Users,
    AlertCircle,
    Image as ImageIcon,
    Plus,
    Minus,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react';

import GoogleMap from '../../features/map/components/GoogleMap.jsx';
import Button from '../../shared/ui/Button.jsx';
import Card from '../../shared/ui/Card.jsx';
import Input from '../../shared/ui/Input.jsx';
import Textarea from '../../shared/ui/Textarea.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import PriorityBadge from '../../features/rescue/components/PriorityBadge.jsx';
import {
    getCoordinatorRescueRequest,
    verifyRescueRequest,
    changeRescueRequestStatus,
} from '../../features/coordinator/api.js';
import { FILE_BASE_URL } from '../../app/config/env.js';

export default function RescueVerifyPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Request được truyền từ hàng đợi (CoordinatorDashboard) qua location.state
    const rawRequest = location.state?.request || null;

    const toValidNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    };

    const getCoordinate = (obj, type) => {
        if (!obj) return null;

        const latKeys = ['latitude', 'lat', 'gpsLat', 'locationLat'];
        const lngKeys = ['longitude', 'lng', 'lon', 'gpsLng', 'gpsLon', 'locationLng', 'locationLon'];
        const keys = type === 'lat' ? latKeys : lngKeys;

        // flat keys
        for (const key of keys) {
            const value = toValidNumber(obj[key]);
            if (value !== null) return value;
        }

        // nested keys
        const nestedSources = [obj.location, obj.coordinates, obj.geo, obj.position, obj.coordinate];
        for (const source of nestedSources) {
            if (!source) continue;
            for (const key of keys) {
                const value = toValidNumber(source[key]);
                if (value !== null) return value;
            }
        }

        return null;
    };

    const initialRequest = rawRequest
        ? {
            id: rawRequest.id,
            code: rawRequest.code,
            status: rawRequest.status || 'PENDING',
            priority: rawRequest.priority || 'MEDIUM',
            peopleCount: rawRequest.peopleCount ?? 1,
            addressText: rawRequest.addressText || rawRequest.address || 'Chưa có địa chỉ chi tiết',
            latitude: getCoordinate(rawRequest, 'lat'),
            longitude: getCoordinate(rawRequest, 'lng'),
            description: rawRequest.description || '',
            createdAt: rawRequest.timeAgo || rawRequest.createdAt || '',
            attachments: rawRequest.attachments || rawRequest.images || rawRequest.evidences || [],
        }
        : {
            id: 'RRQ-1024',
            code: 'RRQ-1024',
            status: 'PENDING',
            priority: 'HIGH',
            peopleCount: 4,
            addressText: '123 Đường Trần Hưng Đạo, Phường 2, Quận 5, TP.HCM',
            latitude: 10.768579,
            longitude: 106.697389,
            description:
                'Gia đình có 2 người già và 2 trẻ nhỏ. Nước đang dâng cao khoảng 1m, đã ngắt điện. Cần được đội cứu nạn tiếp cận và thu dọn nước.',
            createdAt: '10 phút trước',
            attachments: [],
        };

    const [status, setStatus] = useState(initialRequest.status || 'PENDING');
    const [priority, setPriority] = useState(initialRequest.priority || 'MEDIUM');
    const [peopleCount, setPeopleCount] = useState(initialRequest.peopleCount || 1);
    const [address, setAddress] = useState(initialRequest.addressText || '');
    const [longitude, setLongitude] = useState(initialRequest.longitude ?? '');
    const [latitude, setLatitude] = useState(initialRequest.latitude ?? '');

    const DEFAULT_COORDINATES = {
        lat: 10.768579,
        lng: 106.697389,
    };
    const [note, setNote] = useState(initialRequest.description || '');
    const [attachments, setAttachments] = useState(initialRequest.attachments || []);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // Fetch full request details from BE to get all saved data
    useEffect(() => {
        const fetchDetail = async () => {
            if (!rawRequest?.id) return;

            try {
                setLoadingDetail(true);
                const resp = await getCoordinatorRescueRequest(rawRequest.id);

                // Handle different response formats
                let detail = resp;
                if (resp?.data) detail = resp.data;
                else if (resp?.content) detail = resp.content;
                else if (resp?.item) detail = resp.item;

                if (!detail) return;

                // Update all form fields với dữ liệu mới nhất từ DB
                if (detail.status) setStatus(detail.status);
                if (detail.priority) setPriority(detail.priority);
                if (detail.affectedPeopleCount !== undefined || detail.peopleCount !== undefined) {
                    setPeopleCount(detail.affectedPeopleCount ?? detail.peopleCount ?? 1);
                }
                if (detail.addressText || detail.address) {
                    setAddress(detail.addressText || detail.address || '');
                }
                const detailLongitude = getCoordinate(detail, 'lng');
                const detailLatitude = getCoordinate(detail, 'lat');

                if (detailLongitude !== null) {
                    setLongitude(String(detailLongitude));
                }
                if (detailLatitude !== null) {
                    setLatitude(String(detailLatitude));
                }
                if (detail.description) {
                    setNote(detail.description);
                }
                if (detail.attachments || detail.images || detail.evidences) {
                    const beAttachments = detail.attachments || detail.images || detail.evidences || [];
                    setAttachments(Array.isArray(beAttachments) ? beAttachments : []);
                }
            } catch (err) {
                console.error('[RescueVerifyPage] Error loading detail from BE:', err);
                // Silently fail - use initialRequest data as fallback
            } finally {
                setLoadingDetail(false);
            }
        };

        fetchDetail();
    }, [rawRequest?.id]);

    const parsedLatitude = toValidNumber(latitude);
    const parsedLongitude = toValidNumber(longitude);

    const mapCenter = {
        lat: parsedLatitude ?? DEFAULT_COORDINATES.lat,
        lng: parsedLongitude ?? DEFAULT_COORDINATES.lng,
    };

    const handleChangePeople = (delta) => {
        setPeopleCount((prev) => {
            const next = prev + delta;
            if (next < 1) return 1;
            if (next > 50) return 50;
            return next;
        });
    };

    const getStatusChip = (value) => {
        const map = {
            PENDING: { label: 'Chờ xác minh', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            VERIFIED: { label: 'Đã xác minh', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ESCALATED: { label: 'Ưu tiên cao', color: 'bg-rose-50 text-rose-700 border-rose-200' },
        };
        return map[value] || map.PENDING;
    };

    const statusChip = getStatusChip(status);

    const handleVerifyRequest = async () => {
        if (!initialRequest.id) return;

        try {
            setVerifying(true);

            // 1. Gửi request xác minh vị trí + ghi chú xuống BE
            await verifyRescueRequest(initialRequest.id, {
                locationVerified: true,
                note,
            });

            // 2. Sau khi xác minh thành công, luôn đảm bảo request đã sang VERIFIED (hoặc trạng thái cao hơn do người dùng chọn)
            const normalizedStatus = String(status || '').toUpperCase();
            const targetStatus = normalizedStatus && normalizedStatus !== 'PENDING' ? normalizedStatus : 'VERIFIED';
            const baselineStatus = String(initialRequest.status || '').toUpperCase();
            if (baselineStatus !== targetStatus) {
                await changeRescueRequestStatus(initialRequest.id, targetStatus, note);
            }
            setStatus(targetStatus);

            window.alert('Xác minh yêu cầu thành công. Thông tin đã được lưu xuống hệ thống.');
            navigate(-1);
        } catch (error) {
            console.error('[RescueVerifyPage] Lỗi khi xác minh yêu cầu:', error);
            window.alert('Có lỗi xảy ra khi xác minh yêu cầu. Vui lòng thử lại sau.');
        } finally {
            setVerifying(false);
        }
    };

    const handleAddMoreImagesClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFilesSelected = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        const localAttachments = files.map((file) => ({
            id: `local-${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            fileUrl: URL.createObjectURL(file),
            fileName: file.name,
            isLocal: true,
        }));

        setAttachments((prev) => [...localAttachments, ...(prev || [])]);

        // reset input để có thể chọn lại cùng 1 file nếu cần
        event.target.value = '';
    };

    return (
        <div className="flex flex-col gap-4 pb-10 lg:min-h-[calc(100vh-8rem)] lg:flex-row">
            {/* Left: Thông tin chi tiết */}
            <div className="flex w-full flex-col gap-3 lg:flex-[1.15]">
                {/* Top bar */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="mr-1 hidden rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 lg:inline-flex"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                    Xác minh &amp; thẩm định yêu cầu
                                </h1>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                    ID: {initialRequest.code}
                                </span>
                                <Badge outline size="sm" className={statusChip.color}>
                                    {statusChip.label}
                                </Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Điều phối viên kiểm tra lại thông tin trước khi chuyển sang bước điều phối đội cứu hộ.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge level={priority} size="sm" />
                        <Button variant="outline" size="sm">
                            Lưu nháp
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleVerifyRequest}
                            disabled={verifying}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {verifying ? 'Đang xác minh...' : 'Xác minh yêu cầu'}
                        </Button>
                    </div>
                </div>

                {/* Alert trạng thái */}
                <Card
                    variant="outlined"
                    className="border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-transparent"
                >
                    <div className="flex flex-col gap-2 px-3 py-2 text-xs text-amber-800 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <div className="font-semibold">Kiểm tra thông tin trước khi xác minh</div>
                                <p>
                                    Đối chiếu vị trí trên bản đồ, số người cần cứu hộ và mô tả tình huống. Bạn có thể
                                    chỉnh sửa lại cho chính xác.
                                </p>
                            </div>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 sm:mt-0">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Mới: {initialRequest.createdAt || '—'}</span>
                        </div>
                    </div>
                </Card>

                {/* Loading indicator */}
                {loadingDetail && (
                    <Card variant="outlined" className="border-blue-200 bg-blue-50/80">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-blue-800">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            <span>Đang tải dữ liệu từ database...</span>
                        </div>
                    </Card>
                )}

                {/* Form chi tiết */}
                <Card className="space-y-6 p-5">
                    {/* Hàng 1: trạng thái + số người */}
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-700">Trạng thái thẩm định</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="PENDING">Chờ xác minh</option>
                                <option value="VERIFIED">Đã xác minh</option>
                                <option value="ESCALATED">Ưu tiên cao</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-700">Số người cần cứu hộ</label>
                            <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => handleChangePeople(-1)}
                                    className="inline-flex items-center justify-center border-r border-slate-200 px-3 text-slate-600 transition hover:bg-slate-50"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <div className="flex flex-1 items-center justify-center gap-1 px-3 text-sm font-semibold text-slate-900">
                                    <Users className="h-4 w-4 text-slate-500" />
                                    <span>{peopleCount}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleChangePeople(1)}
                                    className="inline-flex items-center justify-center border-l border-slate-200 px-3 text-slate-600 transition hover:bg-slate-50"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Hàng 2: địa chỉ */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Địa chỉ chi tiết</label>
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                className="pl-9"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Nhập địa chỉ cụ thể (số nhà, tên đường, phường/xã...)"
                            />
                        </div>
                    </div>

                    {/* Hàng 3: toạ độ */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-700">Kinh độ (Longitude)</label>
                            <Input
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                className="bg-slate-50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-700">Vĩ độ (Latitude)</label>
                            <Input
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                className="bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Hàng 4: mô tả */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Mô tả tình huống (có thể chỉnh sửa)</label>
                        <Textarea
                            rows={4}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ghi rõ mức nước, tình trạng người gặp nạn, chướng ngại vật, đường tiếp cận..."
                        />
                    </div>

                    {/* Hàng 5: ảnh minh chứng */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {attachments &&
                            attachments.length > 0 &&
                            attachments.slice(0, 3).map((att, index) => {
                                const rawUrl = att.fileUrl || att.url || att.path || att.imageUrl;
                                if (!rawUrl) return null;

                                // Nếu là blob (local preview) hoặc http(s) thì dùng trực tiếp
                                // Nếu BE trả về "/uploads/..." thì ghép với FILE_BASE_URL
                                const finalUrl =
                                    rawUrl.startsWith('http') || rawUrl.startsWith('blob:')
                                        ? rawUrl
                                        : `${FILE_BASE_URL}${rawUrl}`;

                                return (
                                    <div
                                        key={att.id || att.fileUrl || index}
                                        className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                    >
                                        <img src={finalUrl} alt="Ảnh minh chứng" />
                                    </div>
                                );
                            })}

                        {/* input ẩn để chọn file */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFilesSelected}
                        />

                        {/* nút thêm ảnh */}
                        <button
                            type="button"
                            className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 md:h-28"
                            onClick={handleAddMoreImagesClick}
                        >
                            <ImageIcon className="h-5 w-5" />
                            <span>Thêm ảnh khác</span>
                        </button>
                    </div>

                    {/* Footer actions */}
                    <div className="mt-2 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="danger" size="sm">
                                Đánh dấu trùng lặp
                            </Button>
                            <Button type="button" variant="outline" size="sm">
                                Hủy bỏ
                            </Button>
                        </div>
                        <div className="flex w-full justify-end sm:w-auto">
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                    navigate('/dieu-phoi/phan-loai', {
                                        state: { request: rawRequest || initialRequest },
                                    })
                                }
                            >
                                Phân loại ưu tiên
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right: Bối cảnh khu vực + Map */}
            <div className="flex w-full flex-col gap-3 lg:flex-[0.9]">
                <Card className="flex min-h-[260px] flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Bối cảnh khu vực</h3>
                            <p className="text-[11px] text-slate-500">
                                Vòng tròn thể hiện bán kính ~500m quanh vị trí yêu cầu.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{initialRequest.createdAt || 'Thời gian không xác định'}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">Dữ liệu bản đồ chỉ mang tính tham khảo</span>
                        </div>
                    </div>

                    {/* Map + controls */}
                    <div className="relative flex-1">
                        <GoogleMap center={mapCenter} zoom={14} />

                        {/* Vùng bán kính (overlay minh hoạ) */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-40 w-40 rounded-full border-2 border-dashed border-blue-400 bg-blue-200/10 shadow-[0_0_0_1px_rgba(37,99,235,0.25)]" />
                        </div>

                        {/* Panel filter nhỏ bên trái */}
                        <div className="absolute left-3 top-3 w-52 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-600 shadow-md backdrop-blur">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-800">
                                LỚP THÔNG TIN
                            </p>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="scope" defaultChecked className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs">Yêu cầu cứu hộ liên quan</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="scope" className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs">Đội cứu hộ khả dụng</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="scope" className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs">Vùng nguy cơ ngập</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Danh sách yêu cầu gần đó */}
                    <div className="border-t border-slate-200 bg-slate-50/90 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">
                                Yêu cầu gần đó trong bán kính 500m
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">2 yêu cầu</span>
                        </div>
                        <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <div>
                                    <div className="text-[11px] font-semibold text-slate-900">
                                        RRQ-0896 · Cách 185m
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-slate-500">2 người cần hỗ trợ</div>
                                </div>
                                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    Chưa xử lý
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <div>
                                    <div className="text-[11px] font-semibold text-slate-900">
                                        RRQ-0915 · Cách 328m
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-slate-500">Đã điều đội</div>
                                </div>
                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    Đang xử lý
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
