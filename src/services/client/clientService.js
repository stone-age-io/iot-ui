// src/services/client/clientService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint 
} from '../pocketbase-config'

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
