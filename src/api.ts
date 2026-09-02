import { Item, Movement, User, DashboardStats, SystemLog, FullTestReport } from './types';

const TOKEN_KEY = 'almoxarifado_coord_token';
const USER_KEY = 'almoxarifado_coord_user';

async function sendRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = { error: 'Resposta inválida do servidor.' };
  }

  if (!response.ok) {
    if (response.status === 401 && endpoint.startsWith('/admin')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    throw new Error(data.error || `Erro na requisição (${response.status})`);
  }

  return data as T;
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setAuth(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // --- Public Methods ---
  async getPublicItems(params?: { search?: string; category?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);

    const qs = query.toString();
    return sendRequest<{ items: Item[]; categories: string[]; total: number }>(`/items${qs ? `?${qs}` : ''}`);
  },

  async withdrawItem(payload: { itemId: string; requesterName: string; quantity: number; observation?: string }) {
    return sendRequest<{ success: boolean; message: string; item: Item; movement: Movement }>('/items/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // --- Auth Methods ---
  async login(credentials: { username: string; password: string }) {
    const data = await sendRequest<{
      token?: string;
      user?: User;
      requirePasswordChange?: boolean;
      tempToken?: string;
      message?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (data.token && data.user && !data.requirePasswordChange) {
      this.setAuth(data.token, data.user);
    }
    return data;
  },

  async changePassword(payload: { tempToken?: string; newPassword: string; confirmPassword: string }) {
    const data = await sendRequest<{
      success: boolean;
      message: string;
      token: string;
      user: User;
    }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data.token && data.user) {
      this.setAuth(data.token, data.user);
    }
    return data;
  },

  async checkAuth() {
    return sendRequest<{ user: User }>('/auth/me');
  },

  // --- Coordinator Admin Methods ---
  async getDashboard() {
    return sendRequest<{ stats: DashboardStats }>('/admin/dashboard');
  },

  async getAdminItems(includeDeleted = false) {
    return sendRequest<{ items: Item[]; categories: string[] }>(`/admin/items?includeDeleted=${includeDeleted}`);
  },

  async createItem(payload: {
    name: string;
    code: string;
    category: string;
    quantity: number;
    minStock: number;
    unit: string;
    location: string;
    description: string;
    imageUrl?: string;
  }) {
    return sendRequest<{ success: boolean; message: string; item: Item }>('/admin/items', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateItem(id: string, payload: Partial<Item>) {
    return sendRequest<{ success: boolean; message: string; item: Item }>(`/admin/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async adjustStock(id: string, payload: { delta: number; reason: string }) {
    return sendRequest<{ success: boolean; message: string; item: Item }>(`/admin/items/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteItem(id: string) {
    return sendRequest<{ success: boolean; message: string }>(`/admin/items/${id}`, {
      method: 'DELETE'
    });
  },

  async restoreItem(id: string) {
    return sendRequest<{ success: boolean; message: string; item: Item }>(`/admin/items/${id}/restore`, {
      method: 'POST'
    });
  },

  async getMovements(filters?: {
    startDate?: string;
    endDate?: string;
    requesterName?: string;
    itemId?: string;
    itemCode?: string;
    category?: string;
    type?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) query.set(k, v);
      });
    }
    const qs = query.toString();
    return sendRequest<{ movements: Movement[]; total: number }>(`/admin/movements${qs ? `?${qs}` : ''}`);
  },

  async getLogs() {
    return sendRequest<{ logs: SystemLog[] }>('/admin/logs');
  },

  async resetDemo() {
    return sendRequest<{ success: boolean; message: string }>('/admin/reset-demo', {
      method: 'POST'
    });
  },

  async runTests() {
    return sendRequest<FullTestReport>('/admin/run-tests', {
      method: 'POST'
    });
  },

  // --- Google Sheets Sync & Proxy Methods ---
  async getSheetsInfo(token?: string, spreadsheetId?: string, gid?: string) {
    const qs = new URLSearchParams();
    if (spreadsheetId) qs.set('spreadsheetId', spreadsheetId);
    if (gid) qs.set('gid', gid);
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return sendRequest<{ success: boolean; metadata: any; defaultSpreadsheetId: string; defaultGid: string }>(`/sheets/info?${qs.toString()}`, {
      headers
    });
  },

  async syncFromSheets(token?: string, spreadsheetId?: string, gid?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return sendRequest<any>('/sheets/sync-from-sheets', {
      method: 'POST',
      headers,
      body: JSON.stringify({ spreadsheetId, gid, token })
    });
  },

  async syncToSheets(token?: string, spreadsheetId?: string, gid?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return sendRequest<any>('/sheets/sync-to-sheets', {
      method: 'POST',
      headers,
      body: JSON.stringify({ spreadsheetId, gid, token })
    });
  },

  async syncBidirectional(token?: string, spreadsheetId?: string, gid?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return sendRequest<any>('/sheets/sync-bidirectional', {
      method: 'POST',
      headers,
      body: JSON.stringify({ spreadsheetId, gid, token })
    });
  },

  // Dedicated backend proxy caller for Google Sheets API
  async proxyGoogleSheets(endpoint: string, options?: { method?: string; body?: any; params?: Record<string, any> }) {
    return sendRequest<any>('/proxy/sheets', {
      method: 'POST',
      body: JSON.stringify({
        endpoint,
        method: options?.method || 'GET',
        body: options?.body,
        params: options?.params
      })
    });
  }
};

