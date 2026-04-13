/**
 * Centralized configuration for the chatbot frontend.
 * All environment-dependent values should be read from here.
 */

export const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export const API_URL = `${BACKEND_URL}/api`;
