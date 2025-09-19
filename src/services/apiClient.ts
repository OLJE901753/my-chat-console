import { useToast } from '@/hooks/use-toast';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  public status?: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = response.status.toString();
      let errorDetails: unknown = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorCode = errorData.code || errorCode;
        errorDetails = errorData.details || errorData;
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new ApiClientError(errorMessage, response.status, errorCode, errorDetails);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    try {
      return await response.json();
    } catch {
      throw new ApiClientError('Failed to parse response', response.status, 'PARSE_ERROR');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && (error as TypeError).message.includes('fetch')) {
        throw new ApiClientError(
          'Network error: Unable to connect to server',
          0,
          'NETWORK_ERROR'
        );
      }

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiClientError(
          'Request timeout: The server took too long to respond',
          408,
          'TIMEOUT_ERROR'
        );
      }

      // Generic error fallback
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      throw new ApiClientError(message, 0, 'UNKNOWN_ERROR');
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Method to set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Method to remove authentication token
  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  // Method to set custom headers
  setHeader(key: string, value: string) {
    this.defaultHeaders[key] = value;
  }

  // Method to remove custom headers
  removeHeader(key: string) {
    delete this.defaultHeaders[key];
  }
}

// Create a default instance
export const apiClient = new ApiClient();

// Hook for handling API errors with toast notifications
export const useApiErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (error: unknown, customMessage?: string) => {
    let message = customMessage || 'An error occurred';
    let title = 'Error';

    if (error instanceof ApiClientError) {
      switch (error.status) {
        case 400:
          title = 'Bad Request';
          message = error.message || 'Invalid request data';
          break;
        case 401:
          title = 'Unauthorized';
          message = 'Please log in to continue';
          break;
        case 403:
          title = 'Forbidden';
          message = 'You do not have permission to perform this action';
          break;
        case 404:
          title = 'Not Found';
          message = 'The requested resource was not found';
          break;
        case 408:
          title = 'Timeout';
          message = 'The request timed out. Please try again.';
          break;
        case 429:
          title = 'Too Many Requests';
          message = 'Please wait a moment before trying again';
          break;
        case 500:
          title = 'Server Error';
          message = 'A server error occurred. Please try again later.';
          break;
        case 502:
        case 503:
        case 504:
          title = 'Service Unavailable';
          message = 'The service is temporarily unavailable. Please try again later.';
          break;
        default:
          if (error.code === 'NETWORK_ERROR') {
            title = 'Connection Error';
            message = 'Unable to connect to the server. Please check your internet connection.';
          } else {
            message = error.message || message;
          }
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    toast({
      title,
      description: message,
      variant: 'destructive',
    });
  };

  return { handleError };
};
