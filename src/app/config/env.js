/**
 * Environment configuration
 * Access via: import { API_BASE_URL, FILE_BASE_URL } from '@/app/config/env.js'
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Hệ thống Cứu hộ';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Check if we're in development mode
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

// Base URL cho file/ảnh upload (không có /api)
export const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL || 'http://localhost:8080';

// Mock mode
export const USE_MOCK_API = false;