import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the api module's request logic
describe('http service', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function loadApi() {
    // Re-import to get fresh module with mocked fetch
    const mod = await import('@/core/services/http');
    return mod.api;
  }

  it('should make GET requests with credentials: include', async () => {
    const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ id: 1 }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const api = await loadApi();
    const result = await api.get('/api/documents');

    expect(fetch).toHaveBeenCalledWith(
      '/api/documents',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result).toEqual({ id: 1 });
  });

  it('should make POST requests with body', async () => {
    const mockResponse = { ok: true, status: 201, json: () => Promise.resolve({ id: 'new' }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const api = await loadApi();
    const result = await api.post('/api/documents', { title: 'Test' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/documents',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
        credentials: 'include',
      }),
    );
    expect(result).toEqual({ id: 'new' });
  });

  it('should return undefined for 204 responses', async () => {
    const mockResponse = { ok: true, status: 204 };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const api = await loadApi();
    const result = await api.delete('/api/documents/1');

    expect(result).toBeUndefined();
  });

  it('should throw on non-ok responses', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Bad Request' }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const api = await loadApi();
    await expect(api.get('/api/bad')).rejects.toThrow('Bad Request');
  });

  it('should redirect to /login on 401', async () => {
    const mockResponse = { ok: false, status: 401 };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '', pathname: '/documents' },
    });

    const api = await loadApi();
    await expect(api.get('/api/protected')).rejects.toThrow('Non authentifié');
    expect(window.location.href).toBe('/login');

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('should not redirect on 401 when already on /login', async () => {
    const mockResponse = { ok: false, status: 401 };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '/login', pathname: '/login' },
    });

    const api = await loadApi();
    await expect(api.get('/api/auth/me')).rejects.toThrow('Non authentifié');
    expect(window.location.href).toBe('/login');

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('should fall back to status code when json parsing fails on error', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const api = await loadApi();
    await expect(api.get('/api/broken')).rejects.toThrow('Erreur 500');
  });

  it('should make PUT requests', async () => {
    const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ updated: true }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const api = await loadApi();
    const result = await api.put('/api/items/1', { name: 'updated' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'updated' }),
      }),
    );
    expect(result).toEqual({ updated: true });
  });

  it('should make PATCH requests', async () => {
    const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ patched: true }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const api = await loadApi();
    const result = await api.patch('/api/items/1', { status: 'done' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'done' }),
      }),
    );
    expect(result).toEqual({ patched: true });
  });
});
