// src/services/base/BaseService.js
import { apiHelpers } from '../api'
import { clearCollectionCache } from '../../utils/cacheUtils'
import configService from '../config/configService'
import { generateUUIDv7 } from '../../utils/uuidUtils'
import {
  transformResponse,
  transformPaginationParams
} from '../pocketbase-config'

/**
 * Base service class for entity operations
 * Updated to integrate with the central cache store
 * Field mapping functionality has been removed for consistency across services
 */
export class BaseService {
  /**
   * Create a new service instance
   * @param {string} collectionName - PocketBase collection name
   * @param {Function} collectionEndpoint - Function to generate endpoints
   * @param {Object} options - Service options
   * @param {Array<string>} options.jsonFields - Fields to be parsed/stringified as JSON
   * @param {Array<string>} options.expandFields - Fields to expand in queries
   */
  constructor(collectionName, collectionEndpoint, options = {}) {
    this.collectionName = collectionName
    this.collectionEndpoint = collectionEndpoint
    this.options = {
      // Default options
      jsonFields: [], // Fields to be parsed/stringified as JSON
      expandFields: [], // Fields to expand in queries
      ...options
    }
  }

  /**
   * Get current user ID from localStorage for cache segmentation
   * @returns {string|null} - User ID or null
   */
  getCurrentUserId() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const authData = JSON.parse(localStorage.getItem('auth') || '{"user":null}');
      return authData.user?.id || 'anonymous';
    } catch (error) {
      console.warn('Failed to get current user ID for cache:', error);
      return 'anonymous';
    }
  }

  /**
   * Get a paginated list of entities
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with data
   */
  getList(params = {}) {
    const endpoint = this.collectionEndpoint(this.collectionName)
    const transformedParams = transformPaginationParams(params)
    
    // Add expand parameter if not already specified
    if (this.options.expandFields.length > 0 && !transformedParams.expand) {
      transformedParams.expand = this.options.expandFields.join(',')
    }
    
    // Apply custom parameter transformations
    this.transformParams(transformedParams, params)
    
    // Check for skipCache in URL query params
    const skipCacheFromURL = new URLSearchParams(window.location.search).get('skipCache') === 'true'
    
    // Setup caching options if enabled
    const cacheOptions = configService.isCacheEnabled() ? {
      collectionName: this.collectionName,
      operation: 'list',
      id: null,
      userId: this.getCurrentUserId(), // Add user ID for cache segmentation
      skipCache: params.skipCache === true || skipCacheFromURL
    } : null;
    
    return apiHelpers.getList(endpoint, transformedParams, cacheOptions)
      .then(response => {
        // Process the response data
        const processedData = this.processResponseData(response.data);
        
        return { 
          data: processedData, 
          fromCache: response.fromCache,
          timestamp: response.timestamp 
        };
      });
  }
  
  /**
   * Process and transform response data
   * @param {Object} data - Response data
   * @returns {Object} - Processed data
   */
  processResponseData(data) {
    // Transform the response format if needed
    const transformedData = data.items ? transformResponse(data) : data;
    
    // Process JSON fields in list items
    if (transformedData.items && transformedData.items.length > 0) {
      transformedData.items = transformedData.items.map(item => {
        return this.parseJsonFields(item);
      });
    }
    
    return transformedData;
  }

  /**
   * Get a single entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise} - Axios promise with entity data
   */
  getById(id) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    let url = endpoint
    
    // Add expand parameter if needed
    if (this.options.expandFields.length > 0) {
      url = `${endpoint}?expand=${this.options.expandFields.join(',')}`
    }
    
    // Check for skipCache in URL query params
    const skipCacheFromURL = new URLSearchParams(window.location.search).get('skipCache') === 'true'
    
    // Setup caching options if enabled
    const cacheOptions = configService.isCacheEnabled() ? {
      collectionName: this.collectionName,
      operation: 'detail',
      id: id,
      userId: this.getCurrentUserId(), // Add user ID for cache segmentation
      skipCache: skipCacheFromURL
    } : null;
    
    return apiHelpers.getById(url, cacheOptions)
      .then(response => {
        if (response.data) {
          // Apply JSON field parsing
          response.data = this.parseJsonFields(response.data);
        }
        return response;
      });
  }

  /**
   * Create a new entity with auto-generated UUIDv7
   * @param {Object} entity - Entity data
   * @returns {Promise} - Axios promise with created entity
   */
  async create(entity) {
    const endpoint = this.collectionEndpoint(this.collectionName)
    
    // Generate a UUIDv7 for the entity if ID is not already specified
    // Uses the uuidv7 library for robust, secure UUIDv7 generation
    const entityWithId = {
      ...entity,
      id: entity.id || generateUUIDv7()
    }
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(entityWithId)
    
    try {
      const response = await apiHelpers.create(endpoint, processedData);
      
      // Clear both localStorage and reactive cache store
      await this.clearCache();
      
      if (response.data) {
        // Apply JSON field parsing to response
        response.data = this.parseJsonFields(response.data);
      }
      
      return response;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing entity
   * @param {string} id - Entity ID
   * @param {Object} entity - Updated entity data
   * @returns {Promise} - Axios promise with updated entity
   */
  async update(id, entity) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(entity)
    
    try {
      const response = await apiHelpers.update(endpoint, null, processedData);
      
      // Clear both localStorage and reactive cache store
      await this.clearCache();
      
      if (response.data) {
        // Apply JSON field parsing to response
        response.data = this.parseJsonFields(response.data);
      }
      
      return response;
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise} - Axios promise
   */
  async delete(id) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    
    try {
      const response = await apiHelpers.delete(endpoint);
      
      // Clear both localStorage and reactive cache store
      await this.clearCache();
      
      return response;
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for this collection in both localStorage and reactive store
   */
  async clearCache() {
    const userId = this.getCurrentUserId();
    
    // Clear localStorage cache
    if (configService.isCacheEnabled()) {
      clearCollectionCache(this.collectionName, userId);
    }
    
    // Clear reactive store cache
    try {
      // Dynamically import the cache store to avoid circular dependencies
      const { useCacheStore } = await import('../../stores/cacheStore');
      const cacheStore = useCacheStore();
      
      // Clear collection data in the store
      cacheStore.clearCollectionData(this.collectionName);
      
      // Update timestamp to show data was refreshed
      cacheStore.updateTimestamp(this.collectionName);
    } catch (error) {
      console.warn('Failed to clear reactive cache store:', error);
    }
  }

  /**
   * Parse JSON fields in an entity
   * @param {Object} entity - Entity object
   * @returns {Object} - Entity with parsed JSON fields
   */
  parseJsonFields(entity) {
    const result = { ...entity }
    
    // Parse specified JSON fields
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field])
        } catch (e) {
          console.warn(`Failed to parse ${field} for ${this.collectionName}:`, result.id || result.code)
          result[field] = {}
        }
      }
    })
    
    return result
  }

  /**
   * Stringify JSON fields in an entity
   * @param {Object} entity - Entity object
   * @returns {Object} - Entity with stringified JSON fields
   */
  stringifyJsonFields(entity) {
    const result = { ...entity }
    
    // Stringify specified JSON fields
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'object') {
        result[field] = JSON.stringify(result[field])
      }
    })
    
    return result
  }

  /**
   * Custom parameter transformation hook
   * @param {Object} transformedParams - Transformed parameters
   * @param {Object} originalParams - Original parameters
   */
  transformParams(transformedParams, originalParams) {
    // Override in subclasses if needed
  }
}
