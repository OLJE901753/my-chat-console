import { supabase } from './supabase'
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
const handleResponse = async (response: Response): Promise<any> => {
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
      case 401:
        // Unauthorized - try to refresh token
        const newToken = await authService.refreshAccessToken()
        if (!newToken) {
          // Refresh failed, redirect to login
          authService.logout()
          window.location.href = '/'
        }
        throw new Error('Authentication required. Please try again.')
        
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
    return response.json()
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
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
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
      return handleResponse(response)
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      throw error
    }
  }
  
  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? new URLSearchParams(params).toString() : ''
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, { method: 'GET' })
  }
  
  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }
  
  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }
  
  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }
  
  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'DELETE' })
  }
  
  // File upload with security validation
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
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
    
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: formData
    })
  }
  
  // Batch request for multiple operations
  async batch<T>(requests: Array<{ method: string; endpoint: string; data?: any }>): Promise<T[]> {
    const promises = requests.map(({ method, endpoint, data }) => {
      switch (method.toUpperCase()) {
        case 'GET':
          return this.get(endpoint)
        case 'POST':
          return this.post(endpoint, data)
        case 'PUT':
          return this.put(endpoint, data)
        case 'PATCH':
          return this.patch(endpoint, data)
        case 'DELETE':
          return this.delete(endpoint)
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
  list: (params?: Record<string, any>) => apiClient.get(`${basePath}`, params),
  get: (id: string) => apiClient.get(`${basePath}/${id}`),
  create: (data: any) => apiClient.post(`${basePath}`, data),
  update: (id: string, data: any) => apiClient.put(`${basePath}/${id}`, data),
  patch: (id: string, data: any) => apiClient.patch(`${basePath}/${id}`, data),
  delete: (id: string) => apiClient.delete(`${basePath}/${id}`),
  upload: (file: File, additionalData?: Record<string, any>) => 
    apiClient.uploadFile(`${basePath}/upload`, file, additionalData)
})

// Pre-configured endpoints for common resources
export const farmZonesAPI = createAPIEndpoint('/farm-zones')
export const sensorsAPI = createAPIEndpoint('/sensors')
export const dronesAPI = createAPIEndpoint('/drones')
export const weatherAPI = createAPIEndpoint('/weather')
export const irrigationAPI = createAPIEndpoint('/irrigation')
export const usersAPI = createAPIEndpoint('/users')

// Export types
export interface APIResponse<T = any> {
  data: T
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
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
  details?: any
  timestamp: string
}
