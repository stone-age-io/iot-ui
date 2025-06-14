// src/services/config/configService.js

/**
 * Centralized configuration service
 * 
 * This service provides a single point of access for application configuration
 * including environment variables, API endpoints, cache settings, and feature flags.
 * 
 * IMPORTANT: VITE_API_URL should now include the full base path including /pb/
 * Example: VITE_API_URL=http://localhost:8080/pb
 */
class ConfigService {
  constructor() {
    // Store environment variables
    this.env = {
      // API configuration - should include full base path with /pb/
      API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/pb',
      API_TIMEOUT: 30000,
      
      // App configuration
      APP_TITLE: import.meta.env.VITE_APP_TITLE || 'IoT Platform',
      
      // External integrations
      GRAFANA_URL: import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000',
      
      // NATS/MQTT/WebSocket configuration
      MQTT_HOST: import.meta.env.VITE_MQTT_HOST || 'mqtt://localhost:1883',
      MQTT_PORT: import.meta.env.VITE_MQTT_PORT || '1883',
      NATS_HOST: import.meta.env.VITE_NATS_HOST || 'nats://localhost:4222',
      NATS_PORT: import.meta.env.VITE_NATS_PORT || '4222',
      WS_HOST: import.meta.env.VITE_WS_HOST || 'ws://localhost:8080',
      WS_PORT: import.meta.env.VITE_WS_PORT || '8080'
    }
    
    // API endpoints - relative paths only, no hardcoded prefixes
    this.endpoints = {
      AUTH: {
        LOGIN: '/collections/users/auth-with-password',
        REFRESH: '/collections/users/auth-refresh',
        PROFILE: '/collections/users/auth-refresh'
      },
      
      // External service endpoints (these can remain absolute)
      HASH_PASSWORD: 'http://100.98.139.111:9000/sec/api/hash-password'
    }
    
    // Collection names
    this.collections = {
      EDGES: 'edges',
      LOCATIONS: 'locations',
      THINGS: 'things',
      CLIENTS: 'clients',
      TOPIC_PERMISSIONS: 'topic_permissions',
      USERS: 'users',
      ORGANIZATIONS: 'organizations'
    }
    
    // Default pagination settings
    this.pagination = {
      DEFAULT_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100
    }
    
    // Cache configuration
    this.cache = {
      enabled: true, // Global cache enable/disable flag
    }
  }
  
  /**
   * Get API base URL - now just returns the configured URL
   * @returns {string} - API base URL including /pb/ prefix
   */
  getApiBaseUrl() {
    return this.env.API_URL
  }
  
  /**
   * Get PocketBase API endpoint URL - no longer adds /pb/ prefix
   * @param {string} path - API path (should start with / for absolute paths)
   * @returns {string} - Full PocketBase API URL
   */
  getPocketBaseUrl(path) {
    // Ensure path starts with / for absolute paths
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${this.env.API_URL}/api${cleanPath}`
  }
  
  /**
   * Generate a PocketBase collection endpoint URL - no longer adds /pb/ prefix
   * @param {string} collection - Collection name
   * @param {string} [recordId] - Optional record ID for single-record operations
   * @returns {string} - API endpoint URL
   */
  getCollectionEndpoint(collection, recordId = null) {
    const base = `/api/collections/${collection}/records`
    return recordId ? `${base}/${recordId}` : base
  }
  
  /**
   * Get authentication endpoint URL
   * @param {string} endpoint - Auth endpoint (login, refresh, etc.)
   * @returns {string} - Full authentication endpoint URL
   */
  getAuthEndpoint(endpoint) {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
    return `${this.env.API_URL}/api/${cleanEndpoint}`
  }
  
  /**
   * Get custom PocketBase API endpoint (non-collection endpoints)
   * @param {string} path - Custom API path
   * @returns {string} - Full custom endpoint URL
   */
  getCustomEndpoint(path) {
    // Ensure path starts with / for absolute paths
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${this.env.API_URL}/api${cleanPath}`
  }
  
  /**
   * Get Grafana dashboard URL
   * @param {string} dashboard - Dashboard name
   * @param {Object} params - Dashboard parameters
   * @returns {string} - Grafana dashboard URL
   */
  getGrafanaDashboardUrl(dashboard, params = {}) {
    const baseUrl = this.env.GRAFANA_URL
    const queryParams = Object.entries(params)
      .map(([key, value]) => `var-${key}=${encodeURIComponent(value)}`)
      .join('&')
    
    return `${baseUrl}/d/${dashboard}/${dashboard}${queryParams ? '?' + queryParams : ''}`
  }
  
  /**
   * Get file URL for PocketBase file attachment with enhanced validation
   * @param {string} collection - Collection name
   * @param {string} recordId - Record ID
   * @param {string} filename - File name
   * @param {Object} params - Optional query parameters (e.g., thumb, download)
   * @returns {string} - File URL
   */
  getFileUrl(collection, recordId, filename, params = {}) {
    // Validate required parameters
    if (!collection || !recordId || !filename) {
      console.warn('getFileUrl: Missing required parameters', { collection, recordId, filename })
      return null
    }
    
    // Build base file URL
    let fileUrl = `${this.env.API_URL}/api/files/${collection}/${recordId}/${filename}`
    
    // Add query parameters if provided
    const queryParams = new URLSearchParams(params)
    if (queryParams.toString()) {
      fileUrl += `?${queryParams.toString()}`
    }
    
    return fileUrl
  }
  
  /**
   * Get external service endpoint URL (non-PocketBase services)
   * @param {string} service - Service identifier (e.g., 'HASH_PASSWORD')
   * @returns {string} - External service URL
   */
  getExternalServiceUrl(service) {
    return this.endpoints[service] || null
  }
  
  /**
   * Check if cache is enabled
   * @returns {boolean} - Whether cache is enabled
   */
  isCacheEnabled() {
    return this.cache.enabled
  }
  
  /**
   * Enable or disable caching
   * @param {boolean} enabled - Whether to enable caching
   */
  setCacheEnabled(enabled) {
    this.cache.enabled = !!enabled
  }
  
  /**
   * Get app title
   * @returns {string} - Application title
   */
  getAppTitle() {
    return this.env.APP_TITLE
  }
  
  /**
   * Validate configuration on startup
   * @returns {Object} - Validation result with any warnings/errors
   */
  validateConfiguration() {
    const warnings = []
    const errors = []
    
    // Check if API_URL includes the expected /pb/ prefix
    if (!this.env.API_URL.includes('/pb')) {
      warnings.push('API_URL should include /pb/ prefix for PocketBase compatibility')
    }
    
    // Check if API_URL ends with trailing slash
    if (this.env.API_URL.endsWith('/')) {
      warnings.push('API_URL should not end with trailing slash')
    }
    
    // Validate required environment variables
    if (!this.env.API_URL) {
      errors.push('VITE_API_URL is required')
    }
    
    return { warnings, errors, isValid: errors.length === 0 }
  }
}

// Create singleton instance
export const configService = new ConfigService()

// Validate configuration on module load
const validation = configService.validateConfiguration()
if (validation.warnings.length > 0) {
  console.warn('ConfigService warnings:', validation.warnings)
}
if (validation.errors.length > 0) {
  console.error('ConfigService errors:', validation.errors)
}

// Export for use in other services
export default configService
