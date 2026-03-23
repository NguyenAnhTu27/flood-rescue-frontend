import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '../../../app/config/env.js';
import { reverseGeocodeAddress } from '../lib/geocoding.js';

const FALLBACK_STYLE = {
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '? OpenStreetMap contributors',
        },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

function getMapStyle() {
    if (MAPBOX_ACCESS_TOKEN) {
        return 'mapbox://styles/mapbox/streets-v12';
    }
    return FALLBACK_STYLE;
}

export default function GoogleMap({
    center = { lat: 10.8231, lng: 106.6297 },
    onLocationSelect,
    markerPosition,
    additionalMarkers = [],
    zoom = 15,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const primaryMarkerRef = useRef(null);
    const extraMarkersRef = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const initialCenter = useMemo(() => markerPosition || center, [center, markerPosition]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN || '';

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: getMapStyle(),
            center: [Number(initialCenter.lng), Number(initialCenter.lat)],
            zoom: Number(zoom) || 15,
            attributionControl: true,
        });

        let didFallbackToRaster = false;
        const fallbackToRaster = () => {
            if (didFallbackToRaster) return;
            didFallbackToRaster = true;
            try {
                map.setStyle(FALLBACK_STYLE);
            } catch (error) {
                console.warn('[GoogleMap] fallback style error', error);
            }
        };

        if (MAPBOX_ACCESS_TOKEN) {
            map.once('error', () => fallbackToRaster());
        }

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.on('load', () => setIsLoaded(true));

        const primaryMarker = new mapboxgl.Marker({ draggable: true, color: '#ef4444' })
            .setLngLat([Number(initialCenter.lng), Number(initialCenter.lat)])
            .addTo(map);

        primaryMarker.on('dragend', async () => {
            const lngLat = primaryMarker.getLngLat();
            const address = await reverseGeocodeAddress(lngLat.lat, lngLat.lng);
            onLocationSelect?.({
                lat: lngLat.lat,
                lng: lngLat.lng,
                address,
            });
        });

        map.on('click', async (e) => {
            const next = { lat: e.lngLat.lat, lng: e.lngLat.lng };
            primaryMarker.setLngLat([next.lng, next.lat]);
            const address = await reverseGeocodeAddress(next.lat, next.lng);
            onLocationSelect?.({ ...next, address });
        });

        mapRef.current = map;
        primaryMarkerRef.current = primaryMarker;

        return () => {
            extraMarkersRef.current.forEach((m) => m.remove());
            extraMarkersRef.current = [];
            primaryMarker.remove();
            map.remove();
            mapRef.current = null;
            primaryMarkerRef.current = null;
            setIsLoaded(false);
        };
    }, [initialCenter, onLocationSelect, zoom]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !markerPosition || !Number.isFinite(Number(markerPosition.lat)) || !Number.isFinite(Number(markerPosition.lng))) return;
        const nextLng = Number(markerPosition.lng);
        const nextLat = Number(markerPosition.lat);
        primaryMarkerRef.current?.setLngLat([nextLng, nextLat]);
        map.easeTo({ center: [nextLng, nextLat], duration: 400 });
    }, [markerPosition]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        extraMarkersRef.current.forEach((m) => m.remove());
        extraMarkersRef.current = [];

        const valid = Array.isArray(additionalMarkers)
            ? additionalMarkers.filter((m) => Number.isFinite(Number(m?.lat)) && Number.isFinite(Number(m?.lng)))
            : [];

        valid.forEach((m) => {
            const el = document.createElement('div');
            el.className = 'h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow';
            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([Number(m.lng), Number(m.lat)])
                .addTo(map);
            extraMarkersRef.current.push(marker);
        });

        return () => {
            extraMarkersRef.current.forEach((m) => m.remove());
            extraMarkersRef.current = [];
        };
    }, [additionalMarkers]);

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full rounded-xl" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-100">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                        <p className="mt-2 text-sm text-slate-600">?ang t?i b?n ??...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
