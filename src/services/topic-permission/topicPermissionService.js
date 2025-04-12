// src/services/topic-permission/topicPermissionService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint,
  transformResponse
} from '../pocketbase-config'
import { apiHelpers } from '../api'

/**
 * Service for Topic Permission entity operations
 * 
 * Topic Permissions Schema Documentation
 * 
 * This service interacts with the 'topic_permissions' collection in PocketBase.
 * The schema consists of:
 * - id: Unique identifier (auto-generated)
 * - name: Name of the permission role
 * - publish_permissions: JSON array of topic strings for publishing
 * - subscribe_permissions: JSON array of topic strings for subscribing
 * - created: Creation timestamp (auto-generated)
 * - updated: Update timestamp (auto-generated)
 */
export class TopicPermissionService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.TOPIC_PERMISSIONS, 
      collectionEndpoint,
      {
        jsonFields: [],
        expandFields: []
      }
    )
  }
  
  /**
   * Get clients using a specific topic permission role
   * @param {string} permissionId - Topic permission ID
   * @returns {Promise} - Axios promise with clients data
   */
  getClientsByPermission(permissionId) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS)
    const filter = `role_id="${permissionId}"`
    
    return apiHelpers.getList(endpoint, { 
      filter,
      sort: 'username'
    })
    .then(response => {
      return { data: transformResponse(response.data) }
    })
  }
  
  /**
   * Add a topic to a permission's publish or subscribe list
   * @param {string} id - Topic permission ID
   * @param {string} topic - Topic to add
   * @param {string} type - Either 'publish' or 'subscribe'
   * @returns {Promise} - Axios promise with updated topic permission
   */
  addTopic(id, topic, type) {
    if (type !== 'publish' && type !== 'subscribe') {
      return Promise.reject(new Error('Type must be either publish or subscribe'))
    }
    
    return this.getById(id)
      .then(response => {
        const permission = response.data
        const field = `${type}_permissions`
        
        // Add topic if it doesn't exist
        if (!permission[field].includes(topic)) {
          permission[field].push(topic)
          return this.update(id, { [field]: permission[field] })
        }
        
        return Promise.resolve({ data: permission })
      })
  }
  
  /**
   * Remove a topic from a permission's publish or subscribe list
   * @param {string} id - Topic permission ID
   * @param {string} topic - Topic to remove
   * @param {string} type - Either 'publish' or 'subscribe'
   * @returns {Promise} - Axios promise with updated topic permission
   */
  removeTopic(id, topic, type) {
    if (type !== 'publish' && type !== 'subscribe') {
      return Promise.reject(new Error('Type must be either publish or subscribe'))
    }
    
    return this.getById(id)
      .then(response => {
        const permission = response.data
        const field = `${type}_permissions`
        
        // Remove topic if it exists
        if (permission[field].includes(topic)) {
          permission[field] = permission[field].filter(t => t !== topic)
          return this.update(id, { [field]: permission[field] })
        }
        
        return Promise.resolve({ data: permission })
      })
  }
}

// Create instance
export const topicPermissionService = new TopicPermissionService()

/**
 * Validate NATS topic format
 * @param {string} topic - Topic to validate
 * @returns {boolean} - True if valid
 */
export const validateTopic = (topic) => {
  if (!topic) return false;
  
  // Basic NATS topic validation rules:
  // - Uses dot notation: acme.device.temp
  // - Valid characters are alphanumeric, dot, underscore, dash
  // - Single-level wildcard is * (matches exactly one token)
  // - Multi-level wildcard is > (must be the last token)
  
  // Check for invalid characters
  const validCharsRegex = /^[a-zA-Z0-9_.>*-]+$/;
  if (!validCharsRegex.test(topic)) {
    return false;
  }
  
  // Split into tokens
  const tokens = topic.split('.');
  
  // Check if > wildcard is used correctly (only as the last token)
  const hasMultiLevelWildcard = tokens.includes('>');
  if (hasMultiLevelWildcard && tokens[tokens.length - 1] !== '>') {
    return false;
  }
  
  // Check that each token:
  // - Isn't empty
  // - Only contains * as a standalone token, not part of another word
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Empty tokens not allowed
    if (token.length === 0) {
      return false;
    }
    
    // * must be a standalone token, not within a token like "prefix*suffix"
    if (token.includes('*') && token !== '*') {
      return false;
    }
    
    // > must be a standalone token, not within a token like "prefix>suffix"
    if (token.includes('>') && token !== '>') {
      return false;
    }
  }
  
  return true;
}
