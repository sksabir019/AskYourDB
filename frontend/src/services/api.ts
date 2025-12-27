import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from Zustand persist storage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error('Failed to parse auth storage:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear Zustand auth storage
      localStorage.removeItem('auth-storage');
      globalThis.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface QueryRequest {
  question: string;
  context?: Record<string, any>;
}

export interface QueryResponse {
  success: boolean;
  answer: string;
  data: any[];
  meta: {
    plan: any;
    rowCount: number;
    executionTime: string;
    sql?: string;
    query?: string;
    cached?: boolean;
    cacheAge?: number;
  };
  clarify?: string;
  requiresClarification?: boolean;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  database?: {
    connected: boolean;
    type: string;
  };
  services?: {
    llm: boolean;
  };
}

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  queriesPerPage: number;
  autoSave: boolean;
  notifications: boolean;
}

// Query Template
export interface QueryTemplate {
  id: string;
  name: string;
  query: string;
  category?: string;
  isFavorite: boolean;
  createdAt: number;
}

// Query History
export interface QueryHistoryRecord {
  id: string;
  question: string;
  success: boolean;
  executionTime: number;
  rowCount: number;
  timestamp: number;
}

// API Key
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: number;
  lastUsed?: number;
}

// Analytics
export interface Analytics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  successRate: number;
  todayQueries: number;
  avgExecutionTime: number;
  recentQueries: Array<{
    question: string;
    timestamp: number;
    success: boolean;
  }>;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
  };
}

export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  async register(userData: { email: string; password: string; name?: string }): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/register', userData);
    return data;
  },
};

export const queryAPI = {
  async execute(request: QueryRequest): Promise<QueryResponse> {
    const { data } = await api.post<QueryResponse>('/query', request);
    return data;
  },

  async executeStream(
    request: QueryRequest, 
    onChunk: (chunk: string) => void,
    onMeta?: (meta: { rowCount: number; executionTime: string }) => void,
    onComplete?: (data: any[], plan: any) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    // Get token from Zustand persist storage
    let token = '';
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        token = state?.token || '';
      } catch (error) {
        console.error('Failed to parse auth storage:', error);
      }
    }

    const response = await fetch('/api/v1/query/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content') {
              onChunk(parsed.content);
            } else if (parsed.type === 'meta' && onMeta) {
              onMeta({ rowCount: parsed.rowCount, executionTime: parsed.executionTime });
            } else if (parsed.type === 'complete' && onComplete) {
              onComplete(parsed.data, parsed.plan);
            } else if (parsed.type === 'error' && onError) {
              onError(parsed.message);
            } else if (parsed.type === 'clarify' && onError) {
              onError(`Clarification needed: ${parsed.content}`);
            }
          } catch (e) {
            // Ignore parse errors for malformed chunks
          }
        }
      }
    }
  },

  async checkHealth(): Promise<HealthStatus> {
    const { data } = await axios.get<HealthStatus>('/health');
    return data;
  },
};

export const preferencesAPI = {
  async get(): Promise<UserPreferences> {
    const { data } = await api.get<UserPreferences>('/preferences');
    return data;
  },

  async update(preferences: Partial<UserPreferences>): Promise<{ success: boolean; data: UserPreferences }> {
    const { data } = await api.put('/preferences', preferences);
    return data;
  },
};

export const templatesAPI = {
  async getAll(): Promise<QueryTemplate[]> {
    const { data } = await api.get<QueryTemplate[]>('/templates');
    return data;
  },

  async create(template: Omit<QueryTemplate, 'id' | 'createdAt'>): Promise<{ success: boolean; data: QueryTemplate }> {
    const { data } = await api.post('/templates', template);
    return data;
  },

  async update(id: string, updates: Partial<QueryTemplate>): Promise<{ success: boolean; data: QueryTemplate }> {
    const { data } = await api.put(`/templates/${id}`, updates);
    return data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete(`/templates/${id}`);
    return data;
  },
};

export const historyAPI = {
  async getAll(limit = 50): Promise<QueryHistoryRecord[]> {
    const { data } = await api.get<QueryHistoryRecord[]>(`/history?limit=${limit}`);
    return data;
  },

  async save(record: Omit<QueryHistoryRecord, 'id' | 'timestamp'>): Promise<{ success: boolean; data: QueryHistoryRecord }> {
    const { data } = await api.post('/history', record);
    return data;
  },

  async getAnalytics(): Promise<Analytics> {
    const { data } = await api.get<Analytics>('/history/analytics');
    return data;
  },

  async clear(): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete('/history');
    return data;
  },
};

export const apiKeysAPI = {
  async getAll(): Promise<ApiKey[]> {
    const { data } = await api.get<ApiKey[]>('/api-keys');
    return data;
  },

  async generate(name: string): Promise<{ success: boolean; data: ApiKey }> {
    const { data } = await api.post('/api-keys', { name });
    return data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete(`/api-keys/${id}`);
    return data;
  },
};

export default api;
