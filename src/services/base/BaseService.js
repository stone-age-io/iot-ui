// src/services/base/BaseService.js
import { apiHelpers } from '../api'
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
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        const data = transformResponse(response.data)
        
        // Process JSON fields in list items
        if (data.items && data.items.length > 0) {
          data.items = data.items.map(item => this.parseJsonFields(item))
        }
        
        return { data }
      })
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
    
    return apiHelpers.getById(url)
      .then(response => {
        if (response.data) {
          response.data = this.parseJsonFields(response.data)
        }
        return response
      })
  }

  /**
   * Create a new entity
   * @param {Object} entity - Entity data
   * @returns {Promise} - Axios promise with created entity
   */
  create(entity) {
    const endpoint = this.collectionEndpoint(this.collectionName)
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(entity)
    
    return apiHelpers.create(endpoint, processedData)
  }

  /**
   * Update an existing entity
   * @param {string} id - Entity ID
   * @param {Object} entity - Updated entity data
   * @returns {Promise} - Axios promise with updated entity
   */
  update(id, entity) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(entity)
    
    return apiHelpers.update(endpoint, null, processedData)
  }

  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise} - Axios promise
   */
  delete(id) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    return apiHelpers.delete(endpoint)
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
   * Custom parameter transformation hook
   * @param {Object} transformedParams - Transformed parameters
   * @param {Object} originalParams - Original parameters
   */
  transformParams(transformedParams, originalParams) {
    // Override in subclasses if needed
  }
}
