// src/services/pocketbase-config.js
import configService from './config/configService'

/**
 * PocketBase API configuration
 * Maps entity types to their corresponding PocketBase collections
 */

// Collections - Re-export from configService
export const COLLECTIONS = configService.collections

// API Endpoints - Re-export from configService
export const ENDPOINTS = configService.endpoints.AUTH

/**
 * Generate a PocketBase collection endpoint URL with proper /pb/ prefix
 * @param {string} collection - Collection name
 * @param {string} [recordId] - Optional record ID for single-record operations
 * @returns {string} - API endpoint URL
 */
export function collectionEndpoint(collection, recordId = null) {
  return configService.getCollectionEndpoint(collection, recordId)
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
