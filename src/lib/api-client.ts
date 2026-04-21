/**
 * FeedSolve API Client
 *
 * Usage:
 * const client = new FeedSolveClient({
 *   apiKey: 'fsk_your_api_key_here',
 *   baseUrl: 'https://api.feedsolve.com'
 * });
 *
 * // Create submission
 * const submission = await client.submissions.create({
 *   boardId: 'board_123',
 *   subject: 'Bug report',
 *   description: 'Login is broken'
 * });
 */

interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
}

interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, any>;
}

class APIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.feedsolve.com';
  }

  private async request(
    method: string,
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (options?.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options?.headers,
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.error || `HTTP ${response.status}`,
        response.status,
        error
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  private get(path: string, options?: RequestOptions): Promise<any> {
    return this.request('GET', path, undefined, options);
  }

  private post(path: string, data: any, options?: RequestOptions): Promise<any> {
    return this.request('POST', path, data, options);
  }

  private patch(path: string, data: any, options?: RequestOptions): Promise<any> {
    return this.request('PATCH', path, data, options);
  }

  private delete(path: string, options?: RequestOptions): Promise<any> {
    return this.request('DELETE', path, undefined, options);
  }

  // Submissions API
  submissions = {
    create: (data: {
      boardId: string;
      category?: string;
      subject: string;
      description: string;
      email?: string;
      isAnonymous?: boolean;
    }): Promise<any> => {
      return this.post('/api/submissions', data);
    },

    get: (id: string): Promise<any> => {
      return this.get(`/api/submissions/${id}`);
    },

    list: (options?: {
      status?: string;
      boardId?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    }): Promise<any> => {
      return this.get('/api/company/submissions', { query: options });
    },

    update: (
      id: string,
      data: {
        status?: string;
        priority?: string;
        assignedTo?: string;
        publicReply?: string;
        internalNotes?: string;
      }
    ): Promise<any> => {
      return this.patch(`/api/submissions/${id}`, data);
    },

    delete: (id: string): Promise<any> => {
      return this.delete(`/api/submissions/${id}`);
    },
  };

  // Boards API
  boards = {
    create: (data: {
      name: string;
      description?: string;
      categories?: string[];
      isAnonymousAllowed?: boolean;
    }): Promise<any> => {
      return this.post('/api/boards', data);
    },

    get: (id: string): Promise<any> => {
      return this.get(`/api/boards/${id}`);
    },

    list: (): Promise<any> => {
      return this.get('/api/company/boards');
    },

    update: (
      id: string,
      data: {
        name?: string;
        description?: string;
        categories?: string[];
        isAnonymousAllowed?: boolean;
      }
    ): Promise<any> => {
      return this.patch(`/api/boards/${id}`, data);
    },

    delete: (id: string): Promise<any> => {
      return this.delete(`/api/boards/${id}`);
    },
  };

  // Analytics API
  analytics = {
    getCompanyStats: (): Promise<any> => {
      return this.get('/api/company/stats');
    },

    getBoardStats: (boardId: string): Promise<any> => {
      return this.get(`/api/boards/${boardId}/stats`);
    },
  };

  // API Keys API
  apiKeys = {
    create: (data: {
      name: string;
      permissions: string[];
      expiresAt?: string;
      ipWhitelist?: string[];
    }): Promise<any> => {
      return this.post('/api/auth/api-keys', data);
    },

    list: (): Promise<any> => {
      return this.get('/api/auth/api-keys');
    },

    delete: (keyId: string): Promise<any> => {
      return this.delete(`/api/auth/api-keys/${keyId}`);
    },
  };

  // Account API
  account = {
    getCurrentUser: (): Promise<any> => {
      return this.get('/api/auth/me');
    },

    getCompanyInfo: (): Promise<any> => {
      return this.get('/api/company');
    },
  };
}

class APIError extends Error {
  statusCode: number;
  response: any;

  constructor(message: string, statusCode: number, response: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export { APIClient, APIError };
export type { ClientConfig };
