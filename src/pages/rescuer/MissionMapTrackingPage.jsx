import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Navigation,
    Phone,
    MessageCircle,
    Battery,
    Wifi,
    WifiOff,
    MapPin,
    Truck,
    Flag,
    Wrench,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL } from '../../app/config/env.js';
import { RESCUER_ROUTES } from '../../app/routes/route.constants.js';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const STATUS_STEPS = [
    { key: 'DEPARTED', label: 'Đã xuất phát', icon: Truck, color: 'text-blue-600 bg-blue-50' },
    { key: 'ARRIVED', label: 'Đã đến nơi', icon: Flag, color: 'text-green-600 bg-green-50' },
    { key: 'WORKING', label: 'Đang xử lý', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
    { key: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
];

const MOCK_TIMELINE = [
    { id: 't1', time: '08:00', label: 'Nhận nhiệm vụ', detail: 'Hệ thống phân công' },
    { id: 't2', time: '08:05', label: 'Đã xuất phát', detail: 'GPS: 10.8231, 106.6297' },
    { id: 't3', time: '08:25', label: 'Đã đến nơi', detail: 'Cách điểm đích ~50m' },
];

export default function MissionMapTrackingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const gpsMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentStep, setCurrentStep] = useState('DEPARTED');
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Mission data from navigation state or defaults
    const missionCode = state?.code || `MS-${id}`;
    const destLat = state?.latitude ?? 10.78;
    const destLng = state?.longitude ?? 106.69;
    const gpsLat = state?.gpsLat ?? 10.8231;
    const gpsLng = state?.gpsLng ?? 106.6297;

    // Online/offline listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: MAPBOX_STYLE_URL,
            center: [gpsLng, gpsLat],
            zoom: 14,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // GPS marker (current position - blue)
        const gpsEl = document.createElement('div');
        gpsEl.className = 'w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg';
        const gpsMarker = new mapboxgl.Marker({ element: gpsEl })
            .setLngLat([gpsLng, gpsLat])
            .addTo(map);

        // Destination marker (red)
        const destEl = document.createElement('div');
        destEl.className = 'w-5 h-5 bg-red-600 border-2 border-white rounded-full shadow-lg';
        const destMarker = new mapboxgl.Marker({ element: destEl })
            .setLngLat([destLng, destLat])
            .addTo(map);

        // Draw dashed route line between GPS and destination
        map.on('load', () => {
            setIsLoaded(true);
            map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [gpsLng, gpsLat],
                            [destLng, destLat],
                        ],
                    },
                },
            });
            map.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                paint: {
                    'line-color': '#3B82F6',
                    'line-width': 3,
                    'line-dasharray': [2, 2],
                },
            });

            // Fit bounds to show both markers
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend([gpsLng, gpsLat]);
            bounds.extend([destLng, destLat]);
            map.fitBounds(bounds, { padding: 60 });
        });

        mapRef.current = map;
        gpsMarkerRef.current = gpsMarker;
        destMarkerRef.current = destMarker;

        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-bold text-slate-900">Bản đồ theo dõi</h1>
                            <Badge size="sm" className="bg-blue-50 text-blue-700">
                                {missionCode}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500">Nhiệm vụ #{id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isOnline && (
                        <Badge size="sm" className="bg-amber-100 text-amber-700">
                            <WifiOff className="h-3 w-3" />
                            Offline
                        </Badge>
                    )}
                    <Badge size="sm" className="bg-slate-100 text-slate-600">
                        <Battery className="h-3 w-3" />
                        85%
                    </Badge>
                    <Badge size="sm" className="bg-green-100 text-green-700">
                        <Navigation className="h-3 w-3" />
                        GPS
                    </Badge>
                </div>
            </div>

            {/* Main content: Map + Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Map */}
                <div className="relative flex-1">
                    <div ref={containerRef} className="h-full w-full" />
                    {!isLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                            <div className="text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                                <p className="mt-2 text-sm text-slate-600">Đang tải bản đồ...</p>
                            </div>
                        </div>
                    )}

                    {/* Map legend */}
                    <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-white/90 px-3 py-2 text-xs shadow-md backdrop-blur">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-3 w-3 rounded-full bg-blue-600 border border-white" />
                                Vị trí bạn
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-3 w-3 rounded-full bg-red-600 border border-white" />
                                Điểm đích
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="hidden w-80 flex-col border-l border-slate-200 bg-white lg:flex">
                    {/* Mission info */}
                    <div className="border-b border-slate-200 px-4 py-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">{missionCode}</span>
                            <Badge size="sm" className="bg-amber-100 text-amber-700">
                                Đang thực hiện
                            </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            <MapPin className="mr-1 inline h-3 w-3" />
                            {state?.address || 'Quận 1, TP.HCM'}
                        </p>
                    </div>

                    {/* Status steps */}
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Trạng thái nhiệm vụ
                        </h3>
                        <div className="space-y-2">
                            {STATUS_STEPS.map((step, idx) => {
                                const Icon = step.icon;
                                const isActive = step.key === currentStep;
                                const stepIdx = STATUS_STEPS.findIndex((s) => s.key === currentStep);
                                const isDone = idx < stepIdx;

                                return (
                                    <button
                                        key={step.key}
                                        onClick={() => setCurrentStep(step.key)}
                                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                                            isActive
                                                ? 'border-blue-200 bg-blue-50/60 shadow-sm'
                                                : isDone
                                                ? 'border-green-200 bg-green-50/40'
                                                : 'border-slate-200 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${step.color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-900">{step.label}</div>
                                            {isDone && (
                                                <span className="text-[10px] text-green-600">Hoàn thành</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Timeline */}
                        <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Lịch sử hoạt động
                        </h3>
                        <div className="space-y-3">
                            {MOCK_TIMELINE.map((entry) => (
                                <div key={entry.id} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <div className="w-px flex-1 bg-slate-200" />
                                    </div>
                                    <div className="pb-3">
                                        <div className="text-xs font-semibold text-slate-800">{entry.label}</div>
                                        <div className="text-[10px] text-slate-500">
                                            <Clock className="mr-1 inline h-3 w-3" />
                                            {entry.time} — {entry.detail}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="border-t border-slate-200 px-4 py-3 space-y-2">
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="flex-1">
                                <MessageCircle className="h-4 w-4" />
                                Nhắn tin
                            </Button>
                            <Button variant="secondary" size="sm" className="flex-1">
                                <Phone className="h-4 w-4" />
                                Gọi đội
                            </Button>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                                {isOnline ? (
                                    <Wifi className="h-3 w-3 text-green-500" />
                                ) : (
                                    <WifiOff className="h-3 w-3 text-amber-500" />
                                )}
                                {isOnline ? 'Kết nối' : 'Mất kết nối'}
                            </span>
                            <span>•</span>
                            <span>GPS: Bật</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
