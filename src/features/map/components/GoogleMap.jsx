import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../../../app/config/env.js';

/**
 * Google Maps Component
 * @param {Object} props
 * @param {Object} props.center - Initial center { lat, lng }
 * @param {Function} props.onLocationSelect - Callback when location is selected { lat, lng, address }
 * @param {Object} props.markerPosition - Current marker position { lat, lng }
 * @param {number} props.zoom - Map zoom level (default: 15)
 */
export default function GoogleMap({
    center = { lat: 10.8231, lng: 106.6297 }, // Default: Ho Chi Minh City
    onLocationSelect,
    markerPosition,
    zoom = 15
}) {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [geocoder, setGeocoder] = useState(null);

    // Load Google Maps script
    useEffect(() => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
            setIsLoaded(true);
            return;
        }

        // Get API key from environment
        const apiKey = GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

        if (!apiKey) {
            console.warn('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in .env');
            console.warn('See GOOGLE_MAPS_SETUP.md for setup instructions');
        }

        // Create script element
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

        return () => {
            // Cleanup: remove script if component unmounts
            const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (existingScript) {
                // Don't remove if other components might be using it
            }
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (!isLoaded || !window.google || !mapRef.current) return;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        setMap(mapInstance);

        // Initialize geocoder
        const geocoderInstance = new window.google.maps.Geocoder();
        setGeocoder(geocoderInstance);

        // Create initial marker
        const markerInstance = new window.google.maps.Marker({
            position: center,
            map: mapInstance,
            draggable: true,
            animation: window.google.maps.Animation.DROP,
            title: 'Vị trí cứu hộ'
        });

        setMarker(markerInstance);

        // Handle marker drag end
        markerInstance.addListener('dragend', (e) => {
            const position = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };
            reverseGeocode(position, geocoderInstance);
        });

        // Handle map click
        mapInstance.addListener('click', (e) => {
            const position = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };
            markerInstance.setPosition(e.latLng);
            reverseGeocode(position, geocoderInstance);
        });

    }, [isLoaded, center, zoom]);

    // Update marker position when prop changes (from external source like GPS)
    useEffect(() => {
        if (!map || !marker || !markerPosition) return;

        const position = new window.google.maps.LatLng(markerPosition.lat, markerPosition.lng);
        const currentMarkerPos = marker.getPosition();

        // Only update if position actually changed (avoid unnecessary updates)
        if (currentMarkerPos &&
            Math.abs(currentMarkerPos.lat() - markerPosition.lat) < 0.0001 &&
            Math.abs(currentMarkerPos.lng() - markerPosition.lng) < 0.0001) {
            return; // Position hasn't changed significantly
        }

        marker.setPosition(position);
        map.panTo(position);

        // Note: Don't trigger reverse geocode here to avoid infinite loops
        // Reverse geocode will be handled by the parent component when needed
    }, [markerPosition, map, marker]);

    // Reverse geocoding: convert coordinates to address
    const reverseGeocode = (position, geocoderInstance) => {
        if (!geocoderInstance) return;

        geocoderInstance.geocode(
            {
                location: position,
                language: 'vi', // Vietnamese language
                region: 'vn' // Vietnam region
            },
            (results, status) => {
                if (status === 'OK' && results[0]) {
                    const address = results[0].formatted_address;
                    if (onLocationSelect) {
                        onLocationSelect({
                            lat: position.lat,
                            lng: position.lng,
                            address: address
                        });
                    }
                } else {
                    // If geocoding fails, still return coordinates
                    if (onLocationSelect) {
                        onLocationSelect({
                            lat: position.lat,
                            lng: position.lng,
                            address: null
                        });
                    }
                }
            }
        );
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full rounded-xl" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-slate-600">Đang tải bản đồ...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
