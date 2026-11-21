import { ApiResponse } from '../types/api';

const DEFAULT_TIMEOUT_MS = 15000;
const TOKEN_KEY = 'mastro_auth_token';

export class ApiError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public errors?: Record<string, string>;

  constructor(message: string, statusCode: number, errorCode?: string, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

const PRODUCTION_API_HOSTS = ['mastrotickets.co', 'mastrotickets.ae'];
const OFFLINE_BACKOFF_MS = 30000;

function resolveApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  // Only default to the hosted production PHP API when running on an official MastroTickets domain
  if (typeof window !== 'undefined') {
    const hostname = (window.location.hostname || '').toLowerCase();
    const isProductionDomain = PRODUCTION_API_HOSTS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
    if (isProductionDomain) {
      return 'https://api.mastrotickets.co/api/v1';
    }
  }

  // In local dev / preview without VITE_API_BASE_URL configured, stay offline-safe
  return '';
}

class ApiClient {
  private baseUrl: string;
  private memoryToken: string | null = null;
  private offlineUntil = 0;

  constructor() {
    this.baseUrl = resolveApiBaseUrl();
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public isRemoteConfigured(): boolean {
    if (!this.baseUrl) return false;
    if (Date.now() < this.offlineUntil) return false;
    return true;
  }

  public getToken(): string | null {
    if (this.memoryToken) return this.memoryToken;
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setToken(token: string): void {
    this.memoryToken = token;
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable
    }
  }

  public clearToken(): void {
    this.memoryToken = null;
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // storage unavailable
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 1
  ): Promise<ApiResponse<T>> {
    if (!this.isRemoteConfigured()) {
      throw new ApiError(
        'Remote API is not configured for this preview environment.',
        0,
        'API_UNCONFIGURED'
      );
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.offlineUntil = 0;

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        const errorMessage = data?.message || `Request failed with status ${response.status}`;
        throw new ApiError(errorMessage, response.status, data?.code, data?.errors);
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      // Trip temporary offline backoff so repeated background polls don't spam network errors
      this.offlineUntil = Date.now() + OFFLINE_BACKOFF_MS;

      // Handle network / abort retry for safe GET operations only when not already offline
      const isGet = !options.method || options.method.toUpperCase() === 'GET';
      if (retries > 0 && isGet && err?.name === 'AbortError') {
        this.offlineUntil = 0;
        return this.request<T>(endpoint, options, retries - 1);
      }

      if (err?.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your network connection.', 408);
      }

      throw new ApiError(err?.message || 'Unable to communicate with MastroTickets API.', 0, 'NETWORK_UNREACHABLE');
    }
  }

  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
