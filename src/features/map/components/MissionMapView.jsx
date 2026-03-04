import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../../../app/config/env.js';

/**
 * Mission Map View - Read-only map for displaying mission location
 * @param {Object} props
 * @param {Object} props.center - Center position { lat, lng }
 * @param {Object} props.markerPosition - Marker position { lat, lng }
 * @param {number} props.zoom - Map zoom level (default: 15)
 */
export default function MissionMapView({
    center = { lat: 10.8231, lng: 106.6297 },
    markerPosition,
    zoom = 15
}) {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load Google Maps script
    useEffect(() => {
        if (window.google && window.google.maps) {
            setIsLoaded(true);
            return;
        }

        const apiKey = GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

        if (!apiKey) {
            console.warn('Google Maps API key not found');
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&language=vi&region=VN`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setIsLoaded(true);
        };

        script.onerror = () => {
            console.error('Failed to load Google Maps script');
        };

        document.head.appendChild(script);
    }, []);

    // Initialize map
    useEffect(() => {
        if (!isLoaded || !window.google || !mapRef.current) return;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: markerPosition || center,
            zoom: zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
            draggable: false,
            scrollwheel: false,
            disableDoubleClickZoom: true,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        setMap(mapInstance);

        // Create marker (not draggable, read-only)
        const position = markerPosition || center;
        const markerInstance = new window.google.maps.Marker({
            position: position,
            map: mapInstance,
            draggable: false,
            animation: window.google.maps.Animation.DROP,
            title: 'Vị trí nhiệm vụ'
        });

        setMarker(markerInstance);

    }, [isLoaded, center, markerPosition, zoom]);

    // Update marker position when prop changes
    useEffect(() => {
        if (!map || !marker || !markerPosition) return;

        const position = new window.google.maps.LatLng(markerPosition.lat, markerPosition.lng);
        marker.setPosition(position);
        map.panTo(position);
    }, [markerPosition, map, marker]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <div className="text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent"></div>
                        <p className="mt-1 text-[10px] text-slate-600">Đang tải...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
