// src/services/api.js
import axios from 'axios'

// Create axios instance with default config
const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Add request interceptor to include auth token
apiService.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
apiService.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const originalRequest = error.config
    
    // If the error is due to an expired token and we're not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Here you would typically refresh the token
      // For now, we'll just redirect to login
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
      return Promise.reject(error)
    }
    
    // For network errors
    if (!error.response) {
      console.error('Network error:', error)
      return Promise.reject({ 
        message: 'Network error. Please check your connection and try again.'
      })
    }
    
    // Handle specific error status codes
    switch (error.response.status) {
      case 400:
        console.error('Bad request:', error.response)
        break
      case 403:
        console.error('Forbidden:', error.response)
        break
      case 404:
        console.error('Not found:', error.response)
        break
      case 500:
        console.error('Server error:', error.response)
        break
      default:
        console.error('API error:', error.response)
    }
    
    return Promise.reject(error)
  }
)

// Helper methods for common patterns
export const apiHelpers = {
  /**
   * Fetch a paginated list of resources
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise
   */
  getList: (endpoint, params = {}) => {
    return apiService.get(endpoint, { params })
  },
  
  /**
   * Fetch a single resource by ID
   * @param {string} endpoint - API endpoint (with ID already included)
   * @returns {Promise} - Axios promise
   */
  getById: (endpoint) => {
    return apiService.get(endpoint)
  },
  
  /**
   * Create a new resource
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Resource data
   * @returns {Promise} - Axios promise
   */
  create: (endpoint, data) => {
    return apiService.post(endpoint, data)
  },
  
  /**
   * Update an existing resource
   * @param {string} endpoint - API endpoint (with ID already included)
   * @param {string|number} id - Resource ID (unused, kept for compatibility)
   * @param {Object} data - Resource data
   * @returns {Promise} - Axios promise
   */
  update: (endpoint, id, data) => {
    return apiService.patch(endpoint, data)
  },
  
  /**
   * Delete a resource
   * @param {string} endpoint - API endpoint (with ID already included)
   * @returns {Promise} - Axios promise
   */
  delete: (endpoint) => {
    return apiService.delete(endpoint)
  }
}

export default apiService
