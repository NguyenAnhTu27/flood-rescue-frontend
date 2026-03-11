/**
 * Environment configuration
 * Access via: import { API_BASE_URL, FILE_BASE_URL } from '@/app/config/env.js'
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Hệ thống Cứu hộ';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Mapbox configuration — token phải đặt trong file .env (VITE_MAPBOX_ACCESS_TOKEN=...)
export const MAPBOX_ACCESS_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

export const MAPBOX_STYLE_URL =
  import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/streets-v12';

// Tuỳ chọn: endpoint BE dùng Mapbox để reverse geocode, nếu có
export const MAPBOX_REVERSE_GEOCODE_URL =
  import.meta.env.VITE_MAPBOX_REVERSE_GEOCODE_URL || '';

// Check if we're in development mode
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

// Base URL cho file/ảnh upload (không có /api)
export const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL || 'http://localhost:8080';
