/**
 * API configuration for Siraat.
 * 
 * In development: Vite dev proxy forwards `/api` → localhost:5041
 * In Capacitor (native): Uses the production Render backend URL directly
 * In Vercel production: Uses VITE_API_BASE_URL env var or falls back to `/api` (Vercel rewrites)
 */

/** 
 * The production backend URL on Render.
 * Update this after deploying the backend.
 */
const RENDER_BACKEND_URL = import.meta.env.VITE_API_BASE_URL_PRODUCTION || "";

/**
 * Detect if running inside a Capacitor native shell.
 * When loaded via `capacitor://localhost` or `https://localhost`, 
 * window.location.hostname will be "localhost" but the protocol
 * won't be "http:".
 */
function isCapacitorNative(): boolean {
  try {
    // Capacitor injects this global
    return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

/**
 * Resolve the API base URL based on the runtime environment.
 */
export function getApiBaseUrl(): string {
  // 1. Capacitor native → always use Render backend
  if (isCapacitorNative() && RENDER_BACKEND_URL) {
    return RENDER_BACKEND_URL;
  }

  // 2. Explicit env var (Vercel sets this, or local .env)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 3. Fallback: relative path (works with Vite dev proxy and Vercel rewrites)
  return "/api";
}

export const API_BASE_URL = getApiBaseUrl();
