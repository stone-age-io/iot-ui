// src/services/type/typeService.js
import { BaseService } from '../base/BaseService'
import { collectionEndpoint } from '../pocketbase-config'

/**
 * Base service for type management (edge types, location types, etc.)
 * Provides common operations for all type entities
 */
export class TypeService extends BaseService {
  /**
   * Create a new type service instance
   * @param {string} collectionName - PocketBase collection name
   * @param {Object} options - Service options
   */
  constructor(collectionName, options = {}) {
    super(
      collectionName,
      collectionEndpoint,
      {
        jsonFields: [],
        expandFields: [],
        ...options
      }
    )
  }
  
  /**
   * Get a paginated list of types
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with data
   */
  getTypes(params = {}) {
    return this.getList(params)
  }
  
  /**
   * Get a single type by ID
   * @param {string} id - Type ID
   * @returns {Promise} - Axios promise with type data
   */
  getType(id) {
    return this.getById(id)
  }
  
  /**
   * Create a new type
   * @param {Object} type - Type data
   * @returns {Promise} - Axios promise with created type
   */
  createType(type) {
    return this.create(type)
  }
  
  /**
   * Update an existing type
   * @param {string} id - Type ID
   * @param {Object} type - Updated type data
   * @returns {Promise} - Axios promise with updated type
   */
  updateType(id, type) {
    return this.update(id, type)
  }
  
  /**
   * Delete a type
   * @param {string} id - Type ID
   * @returns {Promise} - Axios promise
   */
  deleteType(id) {
    return this.delete(id)
  }
  
  /**
   * Check if a type code is already in use
   * @param {string} code - Type code to check
   * @param {string} excludeId - Optional ID to exclude from check
   * @returns {Promise<boolean>} - True if code is in use
   */
  async isCodeInUse(code, excludeId = null) {
    try {
      // Create a filter to check for the code
      const filter = excludeId 
        ? `code="${code}" && id!="${excludeId}"`
        : `code="${code}"`
      
      const response = await this.getList({ filter })
      
      // If we have any results, the code is in use
      return response.data.items.length > 0
    } catch (error) {
      console.error('Error checking code uniqueness:', error)
      // Default to true to prevent potential duplicates
      return true
    }
  }
}
