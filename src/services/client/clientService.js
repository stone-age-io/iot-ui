// src/services/client/clientService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint 
} from '../pocketbase-config'
import configService from '../config/configService'
import { apiHelpers } from '../api'

/**
 * Service for Client entity operations
 * 
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
export class ClientService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.CLIENTS, 
      collectionEndpoint,
      {
        jsonFields: [],
        expandFields: ['role_id']
      }
    )
  }
  
  /**
   * Hash a password using bcrypt (via external server API)
   * Now uses ConfigService for external service URL handling
   * @param {string} password - Plain text password to hash
   * @returns {Promise<string>} - Hashed password
   */
  hashPassword(password) {
    // Use ConfigService to get the external service URL
    const hashPasswordUrl = configService.getExternalServiceUrl('HASH_PASSWORD')
    
    if (!hashPasswordUrl) {
      throw new Error('Hash password service URL not configured')
    }
    
    return apiHelpers.axiosInstance.post(hashPasswordUrl, { 
      password 
    })
    .then(response => {
      if (!response.data?.hash) {
        throw new Error('Invalid response format: missing hash property')
      }
      return response.data.hash
    })
    .catch(error => {
      console.error('Error hashing password:', error)
      throw new Error('Failed to hash password: ' + (error.message || 'Unknown error'))
    })
  }
  
  /**
   * Validate client credentials by attempting authentication
   * @param {string} username - Client username
   * @param {string} password - Client password (plain text)
   * @returns {Promise<boolean>} - True if credentials are valid
   */
  async validateCredentials(username, password) {
    try {
      // This would typically call a validation endpoint
      // For now, we'll implement basic validation
      const response = await this.getList({
        filter: `username="${username}" && active=true`
      })
      
      if (response.data.items.length === 0) {
        return false
      }
      
      // In a real implementation, you'd validate the password hash
      // This is a simplified version
      return true
    } catch (error) {
      console.error('Error validating credentials:', error)
      return false
    }
  }
  
  /**
   * Get clients by role/permission ID
   * @param {string} roleId - Role/permission ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Axios promise with clients data
   */
  getClientsByRole(roleId, params = {}) {
    return this.getList({
      ...params,
      role_id: roleId,
      sort: 'username'
    })
  }
  
  /**
   * Get active clients only
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Axios promise with active clients data
   */
  getActiveClients(params = {}) {
    return this.getList({
      ...params,
      filter: 'active=true',
      sort: 'username'
    })
  }
  
  /**
   * Toggle client active status
   * @param {string} id - Client ID
   * @param {boolean} active - New active status
   * @returns {Promise} - Axios promise with updated client
   */
  toggleActiveStatus(id, active) {
    return this.update(id, { active })
  }
  
  /**
   * Update client password with hashing
   * @param {string} id - Client ID
   * @param {string} newPassword - New plain text password
   * @returns {Promise} - Axios promise with updated client
   */
  async updatePassword(id, newPassword) {
    try {
      // Hash the password using the external service
      const hashedPassword = await this.hashPassword(newPassword)
      
      // Update the client with the hashed password
      return this.update(id, { password: hashedPassword })
    } catch (error) {
      console.error('Error updating client password:', error)
      throw error
    }
  }
  
  /**
   * Create a new client with hashed password
   * @param {Object} clientData - Client data including plain text password
   * @returns {Promise} - Axios promise with created client
   */
  async createClient(clientData) {
    try {
      // Extract password and hash it
      const { password, ...otherData } = clientData
      
      if (!password) {
        throw new Error('Password is required for new clients')
      }
      
      // Hash the password
      const hashedPassword = await this.hashPassword(password)
      
      // Create the client with hashed password
      return this.create({
        ...otherData,
        password: hashedPassword
      })
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  }
  
  /**
   * Custom parameter transformation for client specific filters
   * @override
   */
  transformParams(transformedParams, originalParams) {
    // Add filter for role_id if provided
    if (originalParams.role_id) {
      const filter = `role_id="${originalParams.role_id}"`
      transformedParams.filter = transformedParams.filter 
        ? `${transformedParams.filter} && ${filter}`
        : filter
    }
    
    // Add active filter if specified
    if (originalParams.active !== undefined) {
      const filter = `active=${originalParams.active}`
      transformedParams.filter = transformedParams.filter 
        ? `${transformedParams.filter} && ${filter}`
        : filter
    }
  }
}

// Create instance
export const clientService = new ClientService()

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

/**
 * Validate client username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid
 */
export const validateClientUsername = (username) => {
  if (!username) return false
  
  // Username should be alphanumeric with underscores, 3-50 characters
  const pattern = /^[a-zA-Z0-9_]{3,50}$/
  return pattern.test(username)
}

/**
 * Client types for dropdown options
 */
export const clientTypes = [
  { label: 'Device', value: 'device', description: 'IoT devices and sensors' },
  { label: 'Service', value: 'service', description: 'Backend services and applications' },
  { label: 'User', value: 'user', description: 'Individual user accounts' },
  { label: 'Integration', value: 'integration', description: 'Third-party integrations' },
  { label: 'System', value: 'system', description: 'System-level services' }
]
