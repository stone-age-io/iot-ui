// src/services/topicPermission.js
import { apiHelpers } from './api'
import { 
  COLLECTIONS, 
  collectionEndpoint, 
  transformResponse,
  transformPaginationParams 
} from './pocketbase-config'

// Topic permissions service with CRUD operations
export const topicPermissionService = {
  /**
   * Get a paginated list of topic permissions
   * @param {Object} params - Query parameters for pagination, sorting, filtering
   * @returns {Promise} - Axios promise with topic permissions data
   */
  getTopicPermissions(params = {}) {
    const endpoint = collectionEndpoint(COLLECTIONS.TOPIC_PERMISSIONS)
    const transformedParams = transformPaginationParams(params)
    
    // Add expand parameter to include client data if not already specified
    if (!transformedParams.expand) {
      transformedParams.expand = 'client'
    }
    
    // Add filter for client_id if provided
    if (params.client_id) {
      transformedParams.filter = `client_id="${params.client_id}"`
    }
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        return { data: transformResponse(response.data) }
      })
  },

  /**
   * Get a single topic permission by ID
   * @param {string} id - Topic permission ID
   * @returns {Promise} - Axios promise with topic permission data
   */
  getTopicPermission(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.TOPIC_PERMISSIONS, id)
    // Add expand parameter to include client data
    return apiHelpers.getList(`${endpoint}?expand=client`)
  },

  /**
   * Create a new topic permission
   * @param {Object} permission - Topic permission data
   * @returns {Promise} - Axios promise with created topic permission
   */
  createTopicPermission(permission) {
    const endpoint = collectionEndpoint(COLLECTIONS.TOPIC_PERMISSIONS)
    return apiHelpers.create(endpoint, permission)
  },

  /**
   * Update an existing topic permission
   * @param {string} id - Topic permission ID
   * @param {Object} permission - Updated topic permission data
   * @returns {Promise} - Axios promise with updated topic permission
   */
  updateTopicPermission(id, permission) {
    const endpoint = collectionEndpoint(COLLECTIONS.TOPIC_PERMISSIONS, id)
    return apiHelpers.update(endpoint, null, permission)
  },

  /**
   * Delete a topic permission
   * @param {string} id - Topic permission ID
   * @returns {Promise} - Axios promise
   */
  deleteTopicPermission(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.TOPIC_PERMISSIONS, id)
    return apiHelpers.delete(endpoint)
  },

  /**
   * Get all topic permissions for a specific client
   * @param {string} clientId - Client ID
   * @returns {Promise} - Axios promise with topic permissions data
   */
  getPermissionsByClient(clientId) {
    const endpoint = collectionEndpoint(COLLECTIONS.TOPIC_PERMISSIONS)
    const filter = `client_id="${clientId}"`
    
    return apiHelpers.getList(endpoint, { 
      filter,
      expand: 'client',
      sort: 'created'
    })
    .then(response => {
      return { data: transformResponse(response.data) }
    })
  }
}

/**
 * Permission types for dropdown options
 */
export const permissionTypes = [
  { label: 'Read', value: 'read' },
  { label: 'Write', value: 'write' },
  { label: 'Read/Write', value: 'readwrite' }
]

/**
 * Pattern types for dropdown options
 */
export const patternTypes = [
  { label: 'Exact Match', value: 'exact' },
  { label: 'Prefix Match', value: 'prefix' },
  { label: 'Pattern Match', value: 'pattern' }
]

/**
 * Validate MQTT topic format
 * @param {string} topic - Topic to validate
 * @returns {boolean} - True if valid
 */
export const validateTopic = (topic) => {
  if (!topic) return false
  
  // Basic MQTT topic validation
  // Allow alphanumeric, /, #, +, -, _
  const validChars = /^[a-zA-Z0-9\/#+\-_]+$/
  
  // Check if topic contains only valid characters
  if (!validChars.test(topic)) {
    return false
  }
  
  // Check if # is only used as the last character in a topic level
  const levels = topic.split('/')
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]
    
    // Check if # is used and not as a single character
    if (level.includes('#') && level !== '#') {
      return false
    }
    
    // Check if # is used in a level other than the last one
    if (level === '#' && i !== levels.length - 1) {
      return false
    }
    
    // Check if + is used as part of another string
    if (level.includes('+') && level !== '+') {
      return false
    }
  }
  
  return true
}

/**
 * Format access control string based on permission type
 * @param {string} permissionType - Permission type 
 * @returns {string} - Formatted string for display
 */
export const formatPermissionType = (permissionType) => {
  switch (permissionType) {
    case 'read': return 'Subscribe'
    case 'write': return 'Publish'
    case 'readwrite': return 'Publish & Subscribe'
    default: return permissionType
  }
}

/**
 * Format pattern type for display
 * @param {string} patternType - Pattern type
 * @returns {string} - Formatted string for display
 */
export const formatPatternType = (patternType) => {
  switch (patternType) {
    case 'exact': return 'Exact Match'
    case 'prefix': return 'Prefix Match'
    case 'pattern': return 'Pattern Match'
    default: return patternType
  }
}
