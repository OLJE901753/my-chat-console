import { authService } from './auth'
import { securityUtils } from './security'

// API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
}

// Request interceptor for adding auth headers
const addAuthHeaders = (headers: Headers): void => {
  const token = authService.getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  // Add CSRF token
  const csrfToken = localStorage.getItem('csrf_token')
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken)
  }
  
  // Add security headers
  headers.set('X-Requested-With', 'XMLHttpRequest')
  headers.set('Content-Type', 'application/json')
}

// Response interceptor for handling errors
const handleResponse = async <T>(response: Response): Promise<T | string> => {
  if (!response.ok) {
    let errorMessage = 'An error occurred'
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage
    }
    
    // Handle specific HTTP status codes
    switch (response.status) {
      case 401: {
        // Unauthorized - try to refresh token
        const newToken = await authService.refreshAccessToken()
        if (!newToken) {
          // Refresh failed, redirect to login
          authService.logout()
          window.location.href = '/'
        }
        throw new Error('Authentication required. Please try again.')
      }
        
      case 403:
        throw new Error('Access denied. You do not have permission to perform this action.')
        
      case 404:
        throw new Error('Resource not found.')
        
      case 429:
        throw new Error('Too many requests. Please try again later.')
        
      case 500:
        throw new Error('Server error. Please try again later.')
        
      default:
        throw new Error(errorMessage)
    }
  }
  
  // Check if response has content
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T
  }
  
  return response.text()
}

// Retry mechanism for failed requests
const retryRequest = async (
  requestFn: () => Promise<Response>,
  attempts: number = API_CONFIG.retryAttempts,
  delay: number = API_CONFIG.retryDelay
): Promise<Response> => {
  try {
    return await requestFn()
  } catch (error) {
    if (attempts <= 1) throw error
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Retry with exponential backoff
    return retryRequest(requestFn, attempts - 1, delay * 2)
  }
}

// Main API client class
class SecureAPIClient {
  private baseURL: string
  private timeout: number
  
  constructor() {
    this.baseURL = API_CONFIG.baseURL
    this.timeout = API_CONFIG.timeout
  }
  
  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | string> {
    const url = `${this.baseURL}${endpoint}`
    
    // Set default options
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: new Headers(),
      ...options
    }
    
    // Add auth headers
    addAuthHeaders(requestOptions.headers as Headers)
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    
    try {
      const response = await retryRequest(() =>
        fetch(url, {
          ...requestOptions,
          signal: controller.signal
        })
      )
      
      clearTimeout(timeoutId)
      return handleResponse<T>(response)
      
    } catch (error: unknown) {
      clearTimeout(timeoutId)
      
      const name = (error as { name?: unknown }).name
      if (typeof name === 'string' && name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      throw error
    }
  }
  
  // GET request
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params ? new URLSearchParams(params).toString() : ''
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request<T>(url, { method: 'GET' }) as Promise<T>
  }
  
  // POST request
  async post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }) as Promise<T>
  }
  
  // PUT request
  async put<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }) as Promise<T>
  }
  
  // PATCH request
  async patch<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }) as Promise<T>
  }
  
  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }) as Promise<T>
  }
  
  // File upload with security validation
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, unknown>
  ): Promise<T> {
    // Validate file security
    const validation = securityUtils.validateFileUpload(file)
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed')
    }
    
    const formData = new FormData()
    formData.append('file', file)
    
    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }
    
    // Create headers without Content-Type for FormData
    const headers = new Headers()
    addAuthHeaders(headers)
    headers.delete('Content-Type') // Let browser set this for FormData
    
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData
    }) as Promise<T>
  }
  
  // Batch request for multiple operations
  async batch<T>(requests: Array<{ method: string; endpoint: string; data?: unknown }>): Promise<T[]> {
    const promises = requests.map(({ method, endpoint, data }) => {
      switch (method.toUpperCase()) {
        case 'GET':
          return this.get<T>(endpoint)
        case 'POST':
          return this.post<T>(endpoint, data)
        case 'PUT':
          return this.put<T>(endpoint, data)
        case 'PATCH':
          return this.patch<T>(endpoint, data)
        case 'DELETE':
          return this.delete<T>(endpoint)
        default:
          throw new Error(`Unsupported method: ${method}`)
      }
    })
    
    return Promise.all(promises)
  }
  
  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health')
  }
  
  // Get API version
  async getVersion(): Promise<{ version: string; environment: string }> {
    return this.get('/version')
  }
}

// Export singleton instance
export const apiClient = new SecureAPIClient()

// Export utility functions
export const createAPIEndpoint = (basePath: string) => ({
  list: <T>(params?: Record<string, unknown>) => apiClient.get<T>(`${basePath}`, params),
  get: <T>(id: string) => apiClient.get<T>(`${basePath}/${id}`),
  create: <T, D = unknown>(data: D) => apiClient.post<T, D>(`${basePath}`, data),
  update: <T, D = unknown>(id: string, data: D) => apiClient.put<T, D>(`${basePath}/${id}`, data),
  patch: <T, D = unknown>(id: string, data: D) => apiClient.patch<T, D>(`${basePath}/${id}`, data),
  delete: <T>(id: string) => apiClient.delete<T>(`${basePath}/${id}`),
  upload: <T>(file: File, additionalData?: Record<string, unknown>) => 
    apiClient.uploadFile<T>(`${basePath}/upload`, file, additionalData)
})

// Pre-configured endpoints for common resources
export const farmZonesAPI = createAPIEndpoint('/farm-zones')
export const sensorsAPI = createAPIEndpoint('/sensors')
export const dronesAPI = createAPIEndpoint('/drones')
export const weatherAPI = createAPIEndpoint('/weather')
export const irrigationAPI = createAPIEndpoint('/irrigation')
export const usersAPI = createAPIEndpoint('/users')

// Export types
export interface APIResponse<T = unknown> {
  data: T
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface APIError {
  message: string
  code: string
  details?: unknown
  timestamp: string
}
