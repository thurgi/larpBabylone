const API_BASE = '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Non authentifié');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Erreur ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),

  put: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),

  patch: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),

  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
