const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

// Base URL with /api guarantee
export const API_BASE_URL = configuredApiBaseUrl
  ? (configuredApiBaseUrl.endsWith('/api') ? configuredApiBaseUrl : `${configuredApiBaseUrl}/api`)
  : '/api';

export function apiUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '').replace(/^api\/+/, '');
  return `${API_BASE_URL}/${cleanPath}`;
}