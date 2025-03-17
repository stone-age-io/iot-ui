// src/services/client.js
import { apiHelpers } from './api'
import { 
  COLLECTIONS, 
  collectionEndpoint, 
  transformResponse,
  transformPaginationParams 
} from './pocketbase-config'

// Client service with CRUD operations
export const clientService = {
  /**
   * Get a paginated list of messaging clients
   * @param {Object} params - Query parameters for pagination, sorting, filtering
   * @returns {Promise} - Axios promise with clients data
   */
  getClients(params = {}) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS)
    const transformedParams = transformPaginationParams(params)
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        return { data: transformResponse(response.data) }
      })
  },

  /**
   * Get a single client by ID
   * @param {string} id - Client ID
   * @returns {Promise} - Axios promise with client data
   */
  getClient(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS, id)
    return apiHelpers.getById(endpoint)
  },

  /**
   * Create a new client
   * @param {Object} client - Client data
   * @returns {Promise} - Axios promise with created client
   */
  createClient(client) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS)
    return apiHelpers.create(endpoint, client)
  },

  /**
   * Update an existing client
   * @param {string} id - Client ID
   * @param {Object} client - Updated client data
   * @returns {Promise} - Axios promise with updated client
   */
  updateClient(id, client) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS, id)
    return apiHelpers.update(endpoint, null, client)
  },

  /**
   * Delete a client
   * @param {string} id - Client ID
   * @returns {Promise} - Axios promise
   */
  deleteClient(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS, id)
    return apiHelpers.delete(endpoint)
  }
}

/**
 * Client types for dropdown options
 */
export const clientTypes = [
  { label: 'Device', value: 'device' },
  { label: 'Service', value: 'service' },
  { label: 'User', value: 'user' },
  { label: 'Integration', value: 'integration' },
  { label: 'System', value: 'system' }
]

/**
 * Access levels for dropdown options
 */
export const accessLevels = [
  { label: 'Read Only', value: 'read' },
  { label: 'Write Only', value: 'write' },
  { label: 'Read/Write', value: 'readwrite' },
  { label: 'Admin', value: 'admin' }
]

/**
 * Generate a client username based on clientType and name
 * @param {string} clientType - Type of client
 * @param {string} name - Client name or identifier
 * @returns {string} - Generated username
 */
export const generateClientUsername = (clientType, name) => {
  if (!clientType || !name) return ''
  
  // Convert name to lowercase and replace spaces with underscores
  const normalizedName = name.toLowerCase().replace(/\s+/g, '_')
  
  // Get prefix based on client type
  let prefix = ''
  switch (clientType) {
    case 'device': prefix = 'dev'; break;
    case 'service': prefix = 'svc'; break;
    case 'user': prefix = 'usr'; break;
    case 'integration': prefix = 'int'; break;
    case 'system': prefix = 'sys'; break;
    default: prefix = 'client';
  }
  
  return `${prefix}_${normalizedName}`
}

/**
 * Generate a random secure password
 * @param {number} length - Length of password
 * @returns {string} - Generated password
 */
export const generateSecurePassword = (length = 16) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?'
  let password = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset.charAt(randomIndex)
  }
  return password
}
