// src/services/client.js
import { apiHelpers } from './api'
import axios from 'axios'
import { 
  COLLECTIONS, 
  collectionEndpoint, 
  transformResponse,
  transformPaginationParams 
} from './pocketbase-config'

/**
 * Client Schema Documentation
 * 
 * This service interacts with the 'clients' collection in PocketBase.
 * The schema consists of:
 * - id: Unique identifier (auto-generated)
 * - username: Authentication username for NATS
 * - password: Bcrypt hashed password for NATS authentication
 * - role_id: Relation field pointing to a single record in topic_permissions
 * - active: Boolean indicating if the client is enabled
 */

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
    
    // Add expand parameter to include role data if not already specified
    if (!transformedParams.expand) {
      transformedParams.expand = 'role_id'
    }
    
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
    
    // Add expand parameter to include role data
    return apiHelpers.getList(`${endpoint}?expand=role_id`)
  },

  /**
   * Create a new client
   * @param {Object} client - Client data
   * @returns {Promise} - Axios promise with created client
   */
  createClient(client) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS)
    
    // Extract only the fields that match the PocketBase schema
    const clientData = {
      username: client.username,
      password: client.password, // Should be already hashed
      role_id: client.role_id,
      active: client.active
    }
    
    return apiHelpers.create(endpoint, clientData)
  },

  /**
   * Update an existing client
   * @param {string} id - Client ID
   * @param {Object} client - Updated client data
   * @returns {Promise} - Axios promise with updated client
   */
  updateClient(id, client) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS, id)
    
    // Extract only the fields that match the PocketBase schema
    const clientData = {}
    
    // Only include fields that were provided in the update
    if (client.username !== undefined) clientData.username = client.username
    if (client.password !== undefined) clientData.password = client.password
    if (client.role_id !== undefined) clientData.role_id = client.role_id
    if (client.active !== undefined) clientData.active = client.active
    
    return apiHelpers.update(endpoint, null, clientData)
  },

  /**
   * Delete a client
   * @param {string} id - Client ID
   * @returns {Promise} - Axios promise
   */
  deleteClient(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.CLIENTS, id)
    return apiHelpers.delete(endpoint)
  },

  /**
   * Hash a password using bcrypt (via server API)
   * @param {string} password - Plain text password to hash
   * @returns {Promise<string>} - Hashed password
   */
  hashPassword(password) {
    return fetch('http://100.98.139.111:9000/sec/api/hash-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Hash password request failed with status: ${response.status}`);
      }
      return response.json();
    })
    .then(responseData => {
      if (!responseData.hash) {
        throw new Error('Invalid response format: missing hash property');
      }
      return responseData.hash;
    })
    .catch(error => {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password: ' + error.message);
    });
  }
}

/**
 * Generate a client username based on client type and name
 * This is a helper for the UI only and doesn't reflect database fields
 * 
 * @param {string} clientType - Type of client (UI categorization)
 * @param {string} name - Descriptive name (UI only)
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
