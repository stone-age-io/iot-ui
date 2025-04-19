// Updated src/services/api.js with stale-while-revalidate caching
import axios from 'axios'
import configService from './config/configService'
import { generateCacheKey, getCache, setCache, getCacheTimestamp } from '../utils/cacheUtils'

// Create axios instance with default config
const apiService = axios.create({
  baseURL: configService.getApiBaseUrl(),
  timeout: configService.env.API_TIMEOUT,
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

/**
 * Wrapper for API calls with stale-while-revalidate caching
 * @param {Function} apiCall - Function that performs the API call
 * @param {Object} cacheOptions - Cache configuration
 * @returns {Promise} - Promise that resolves with the API response
 */
export const withCache = (apiCall, cacheOptions) => {
  return async () => {
    const {
      collectionName,
      operation,
      id = null,
      params = null,
      skipCache = false,
      updateCallback = null // New callback for UI updates
    } = cacheOptions;
    
    // Skip caching if disabled globally or for this specific call
    if (!configService.isCacheEnabled() || skipCache) {
      return apiCall();
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(collectionName, operation, id, params);
    
    // Try to get from cache first
    const cachedData = getCache(cacheKey);
    const cachedTimestamp = getCacheTimestamp(cacheKey);
    
    if (cachedData) {
      // Start background refresh immediately
      setTimeout(() => {
        apiCall()
          .then(freshResponse => {
            // Always update cache with fresh data
            setCache(cacheKey, freshResponse.data);
            
            // Update UI with fresh data if callback provided
            if (updateCallback) {
              updateCallback(freshResponse.data);
            }
          })
          .catch(error => {
            // Log error but don't affect user experience
            console.warn('Background cache refresh failed:', error);
          });
      }, 10);
      
      // Return cached data right away with a flag indicating it's from cache
      return Promise.resolve({
        data: cachedData,
        fromCache: true,
        timestamp: cachedTimestamp
      });
    }
    
    // No cache hit, perform actual API call
    try {
      const response = await apiCall();
      
      // Cache the successful response
      setCache(cacheKey, response.data);
      
      // Return response with current timestamp
      return {
        ...response,
        timestamp: Date.now(),
        fromCache: false
      };
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  };
};

// Helper methods for common patterns
export const apiHelpers = {
  /**
   * Expose the Axios instance for custom requests
   */
  axiosInstance: apiService,
  
  /**
   * Fetch a paginated list of resources with caching
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} cacheOptions - Optional caching options
   * @returns {Promise} - Axios promise
   */
  getList: (endpoint, params = {}, cacheOptions = null) => {
    const apiCall = () => apiService.get(endpoint, { params });
    
    if (cacheOptions) {
      return withCache(() => apiCall(), {
        ...cacheOptions,
        params,
        operation: 'list'
      })();
    }
    
    return apiCall();
  },
  
  /**
   * Fetch a single resource by ID with caching
   * @param {string} endpoint - API endpoint (with ID already included)
   * @param {Object} cacheOptions - Optional caching options
   * @returns {Promise} - Axios promise
   */
  getById: (endpoint, cacheOptions = null) => {
    const apiCall = () => apiService.get(endpoint);
    
    if (cacheOptions) {
      return withCache(() => apiCall(), {
        ...cacheOptions,
        operation: 'detail'
      })();
    }
    
    return apiCall();
  },
  
  /**
   * Create a new resource
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Resource data
   * @returns {Promise} - Axios promise
   */
  create: (endpoint, data) => {
    return apiService.post(endpoint, data);
  },
  
  /**
   * Update an existing resource
   * @param {string} endpoint - API endpoint (with ID already included)
   * @param {string|number} id - Resource ID (unused, kept for compatibility)
   * @param {Object} data - Resource data
   * @returns {Promise} - Axios promise
   */
  update: (endpoint, id, data) => {
    return apiService.patch(endpoint, data);
  },
  
  /**
   * Delete a resource
   * @param {string} endpoint - API endpoint (with ID already included)
   * @returns {Promise} - Axios promise
   */
  delete: (endpoint) => {
    return apiService.delete(endpoint);
  }
}

export default apiService
