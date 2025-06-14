// src/services/pocketbase-config.js
import configService from './config/configService'

/**
 * PocketBase API configuration
 * Maps entity types to their corresponding PocketBase collections
 * Now uses ConfigService exclusively for all URL construction
 */

// Collections - Re-export from configService
export const COLLECTIONS = configService.collections

// API Endpoints - Re-export from configService
export const ENDPOINTS = configService.endpoints.AUTH

/**
 * Generate a PocketBase collection endpoint URL using ConfigService
 * No longer hardcodes any prefixes - delegates to ConfigService
 * @param {string} collection - Collection name
 * @param {string} [recordId] - Optional record ID for single-record operations
 * @returns {string} - API endpoint URL
 */
export function collectionEndpoint(collection, recordId = null) {
  return configService.getCollectionEndpoint(collection, recordId)
}

/**
 * Generate a PocketBase auth endpoint URL using ConfigService
 * @param {string} endpoint - Auth endpoint path
 * @returns {string} - Full auth endpoint URL
 */
export function authEndpoint(endpoint) {
  return configService.getAuthEndpoint(endpoint)
}

/**
 * Generate a PocketBase custom endpoint URL using ConfigService
 * @param {string} path - Custom endpoint path
 * @returns {string} - Full custom endpoint URL
 */
export function customEndpoint(path) {
  return configService.getCustomEndpoint(path)
}

/**
 * Generate a PocketBase file URL using ConfigService
 * @param {string} collection - Collection name
 * @param {string} recordId - Record ID
 * @param {string} filename - File name
 * @param {Object} params - Optional query parameters
 * @returns {string} - File URL
 */
export function fileEndpoint(collection, recordId, filename, params = {}) {
  return configService.getFileUrl(collection, recordId, filename, params)
}

/**
 * Transform PocketBase response to our expected format
 * @param {Object} response - PocketBase response
 * @returns {Object} - Transformed data
 */
export function transformResponse(response) {
  // For list endpoints
  if (response.items) {
    return { 
      items: response.items,
      page: response.page,
      perPage: response.perPage,
      totalItems: response.totalItems,
      totalPages: response.totalPages
    }
  }
  
  // For single item endpoints
  return response
}

/**
 * Transform pagination parameters for PocketBase
 * @param {Object} params - Original parameters
 * @returns {Object} - PocketBase compatible parameters
 */
export function transformPaginationParams(params = {}) {
  const result = { ...params }
  
  // Map our pagination params to PocketBase's expected format
  if (params.page !== undefined) {
    result.page = params.page
  }
  
  if (params.rows !== undefined) {
    result.perPage = params.rows
    delete result.rows
  }
  
  return result
}

/**
 * Build PocketBase filter string from object
 * @param {Object} filters - Filter object
 * @returns {string} - PocketBase filter string
 */
export function buildFilterString(filters) {
  if (!filters || typeof filters !== 'object') {
    return ''
  }
  
  const filterParts = []
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (typeof value === 'string') {
        filterParts.push(`${key}="${value}"`)
      } else if (typeof value === 'boolean') {
        filterParts.push(`${key}=${value}`)
      } else if (typeof value === 'number') {
        filterParts.push(`${key}=${value}`)
      } else if (Array.isArray(value)) {
        // Handle array filters (e.g., for "in" operations)
        const arrayValues = value.map(v => `"${v}"`).join(',')
        filterParts.push(`${key} in (${arrayValues})`)
      }
    }
  })
  
  return filterParts.join(' && ')
}

/**
 * Build PocketBase sort string from array
 * @param {Array|string} sort - Sort specification
 * @returns {string} - PocketBase sort string
 */
export function buildSortString(sort) {
  if (!sort) return ''
  
  if (typeof sort === 'string') {
    return sort
  }
  
  if (Array.isArray(sort)) {
    return sort.join(',')
  }
  
  return ''
}

/**
 * Validate PocketBase record ID format
 * @param {string} id - Record ID to validate
 * @returns {boolean} - True if valid PocketBase ID format
 */
export function isValidRecordId(id) {
  if (!id || typeof id !== 'string') {
    return false
  }
  
  // PocketBase uses 15-character alphanumeric IDs
  const pocketbaseIdPattern = /^[a-zA-Z0-9]{15}$/
  
  // Also accept UUIDv7 format since we're using those
  const uuidv7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  return pocketbaseIdPattern.test(id) || uuidv7Pattern.test(id)
}

/**
 * Extract collection name from endpoint URL
 * @param {string} endpoint - Endpoint URL
 * @returns {string|null} - Collection name or null
 */
export function extractCollectionFromEndpoint(endpoint) {
  if (!endpoint) return null
  
  // Match pattern: /api/collections/{collection}/records
  const match = endpoint.match(/\/api\/collections\/([^\/]+)\/records/)
  return match ? match[1] : null
}

/**
 * Check if endpoint is a PocketBase collection endpoint
 * @param {string} endpoint - Endpoint URL
 * @returns {boolean} - True if collection endpoint
 */
export function isCollectionEndpoint(endpoint) {
  if (!endpoint) return false
  return endpoint.includes('/api/collections/') && endpoint.includes('/records')
}

/**
 * Check if endpoint is a PocketBase auth endpoint
 * @param {string} endpoint - Endpoint URL
 * @returns {boolean} - True if auth endpoint
 */
export function isAuthEndpoint(endpoint) {
  if (!endpoint) return false
  return endpoint.includes('/api/collections/users/auth')
}

/**
 * Check if endpoint is a PocketBase file endpoint
 * @param {string} endpoint - Endpoint URL
 * @returns {boolean} - True if file endpoint
 */
export function isFileEndpoint(endpoint) {
  if (!endpoint) return false
  return endpoint.includes('/api/files/')
}
