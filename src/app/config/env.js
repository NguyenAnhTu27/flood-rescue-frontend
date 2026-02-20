/**
 * Environment configuration
 * Access via: import { API_BASE_URL } from '@/app/config/env.js'
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Hệ thống Cứu hộ';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Check if we're in development mode
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

// Mock mode - set to true to use mock API responses (for development without backend)
//export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || false;

export const USE_MOCK_API = false;
