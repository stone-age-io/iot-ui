// src/services/base/BaseService.js
import { apiHelpers } from '../api'
import { clearCollectionCache } from '../../utils/cacheUtils'
import configService from '../config/configService'
import {
  transformResponse,
  transformPaginationParams
} from '../pocketbase-config'

export class BaseService {
  /**
   * Create a new service instance
   * @param {string} collectionName - PocketBase collection name
   * @param {Function} collectionEndpoint - Function to generate endpoints
   * @param {Object} options - Service options
   * @param {Array<string>} options.jsonFields - Fields to be parsed/stringified as JSON
   * @param {Array<string>} options.expandFields - Fields to expand in queries
   * @param {Object} options.fieldMappings - Field mappings between API and client fields
   */
  constructor(collectionName, collectionEndpoint, options = {}) {
    this.collectionName = collectionName
    this.collectionEndpoint = collectionEndpoint
    this.options = {
      // Default options
      jsonFields: [], // Fields to be parsed/stringified as JSON
      expandFields: [], // Fields to expand in queries
      fieldMappings: {}, // Field mappings between API and client fields
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
   * @param {Function} updateCallback - Optional callback for stale-while-revalidate updates
   * @returns {Promise} - Axios promise with data
   */
  getList(params = {}, updateCallback = null) {
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
      id: null,
      userId: this.getCurrentUserId(), // Add user ID for cache segmentation
      skipCache: params.skipCache === true || skipCacheFromURL,
      updateCallback: updateCallback ? (freshData) => {
        // Process the fresh data before passing to callback
        const processedData = this.processResponseData(freshData);
        updateCallback(processedData);
      } : null
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
    
    // Process JSON fields and field mappings in list items
    if (transformedData.items && transformedData.items.length > 0) {
      transformedData.items = transformedData.items.map(item => {
        const parsedItem = this.parseJsonFields(item);
        return this.mapApiToClientFields(parsedItem);
      });
    }
    
    return transformedData;
  }

  /**
   * Get a single entity by ID
   * @param {string} id - Entity ID
   * @param {Function} updateCallback - Optional callback for stale-while-revalidate updates
   * @returns {Promise} - Axios promise with entity data
   */
  getById(id, updateCallback = null) {
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
      id: id,
      userId: this.getCurrentUserId(), // Add user ID for cache segmentation
      skipCache: skipCacheFromURL,
      updateCallback: updateCallback ? (freshData) => {
        // Parse and map fields before calling the callback
        const parsedData = this.parseJsonFields(freshData);
        const mappedData = this.mapApiToClientFields(parsedData);
        updateCallback(mappedData);
      } : null
    } : null;
    
    return apiHelpers.getById(url, cacheOptions)
      .then(response => {
        if (response.data) {
          // Apply JSON field parsing and field mappings
          const parsedData = this.parseJsonFields(response.data);
          response.data = this.mapApiToClientFields(parsedData);
        }
        return response;
      });
  }

  /**
   * Create a new entity
   * @param {Object} entity - Entity data
   * @returns {Promise} - Axios promise with created entity
   */
  create(entity) {
    const endpoint = this.collectionEndpoint(this.collectionName)
    
    // Map client fields to API fields
    const mappedEntity = this.mapClientToApiFields(entity)
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(mappedEntity)
    
    return apiHelpers.create(endpoint, processedData)
      .then(response => {
        // Clear collection cache when a new entity is created
        // Include user ID for proper segmentation
        if (configService.isCacheEnabled()) {
          clearCollectionCache(this.collectionName, this.getCurrentUserId());
        }
        
        if (response.data) {
          // Apply JSON field parsing and field mappings to response
          const parsedData = this.parseJsonFields(response.data)
          response.data = this.mapApiToClientFields(parsedData)
        }
        return response
      })
  }

  /**
   * Update an existing entity
   * @param {string} id - Entity ID
   * @param {Object} entity - Updated entity data
   * @returns {Promise} - Axios promise with updated entity
   */
  update(id, entity) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    
    // Map client fields to API fields
    const mappedEntity = this.mapClientToApiFields(entity)
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(mappedEntity)
    
    return apiHelpers.update(endpoint, null, processedData)
      .then(response => {
        // Clear specific cache entries when entity is updated
        // Include user ID for proper segmentation
        if (configService.isCacheEnabled()) {
          clearCollectionCache(this.collectionName, this.getCurrentUserId());
        }
        
        if (response.data) {
          // Apply JSON field parsing and field mappings to response
          const parsedData = this.parseJsonFields(response.data)
          response.data = this.mapApiToClientFields(parsedData)
        }
        return response
      })
  }

  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise} - Axios promise
   */
  delete(id) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    return apiHelpers.delete(endpoint)
      .then(response => {
        // Clear collection cache when an entity is deleted
        // Include user ID for proper segmentation
        if (configService.isCacheEnabled()) {
          clearCollectionCache(this.collectionName, this.getCurrentUserId());
        }
        return response;
      })
  }

  /**
   * Parse JSON fields in an entity
   * @param {Object} entity - Entity object
   * @returns {Object} - Entity with parsed JSON fields
   */
  parseJsonFields(entity) {
    const result = { ...entity }
    
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
    
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'object') {
        result[field] = JSON.stringify(result[field])
      }
    })
    
    return result
  }

  /**
   * Map API field names to client field names
   * @param {Object} apiData - Data with API field names
   * @returns {Object} - Data with client field names
   */
  mapApiToClientFields(apiData) {
    const result = { ...apiData }
    const mappings = this.options.fieldMappings
    
    // Skip if no mappings defined
    if (!mappings || Object.keys(mappings).length === 0) {
      return result
    }
    
    // Apply mappings: API field name -> client field name
    Object.entries(mappings).forEach(([apiField, clientField]) => {
      if (apiData[apiField] !== undefined) {
        result[clientField] = apiData[apiField]
        
        // Remove the original field if it's different from the client field
        if (apiField !== clientField) {
          delete result[apiField]
        }
      }
    })
    
    return result
  }

  /**
   * Map client field names to API field names
   * @param {Object} clientData - Data with client field names
   * @returns {Object} - Data with API field names
   */
  mapClientToApiFields(clientData) {
    const result = { ...clientData }
    const mappings = this.options.fieldMappings
    
    // Skip if no mappings defined
    if (!mappings || Object.keys(mappings).length === 0) {
      return result
    }
    
    // Create reverse mappings: client field name -> API field name
    const reverseMappings = {}
    Object.entries(mappings).forEach(([apiField, clientField]) => {
      reverseMappings[clientField] = apiField
    })
    
    // Apply reverse mappings
    Object.entries(reverseMappings).forEach(([clientField, apiField]) => {
      if (clientData[clientField] !== undefined) {
        result[apiField] = clientData[clientField]
        
        // Remove the original field if it's different from the API field
        if (apiField !== clientField) {
          delete result[clientField]
        }
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
