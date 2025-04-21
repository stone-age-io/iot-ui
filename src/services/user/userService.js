// src/services/user/userService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint
} from '../pocketbase-config'
import { apiHelpers } from '../api'
import configService from '../config/configService'

/**
 * Service for User operations
 * 
 * User Schema Documentation
 * 
 * This service interacts with the '_superusers' collection in PocketBase.
 * The schema consists of:
 * - id: Unique identifier (auto-generated)
 * - email: User's email address (used as username)
 * - first_name: User's first name
 * - last_name: User's last name
 * - avatar: User's profile picture (file)
 * - verified: Whether the email is verified
 * - created: Creation timestamp (auto-generated)
 * - updated: Update timestamp (auto-generated)
 */
export class UserService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.USERS,
      collectionEndpoint,
      {
        jsonFields: [],
        expandFields: []
      }
    )
  }
  
  /**
   * Get current user profile
   * @returns {Promise} - Axios promise with user data
   */
  getCurrentUser() {
    // Use proper path construction from config service
    const endpoint = configService.getPocketBaseUrl(configService.endpoints.AUTH.REFRESH)
    
    // Use POST method with auth token for refresh endpoint
    return apiHelpers.axiosInstance.post(endpoint)
      .then(response => {
        // Parse any potential JSON fields
        if (response.data && response.data.record) {
          response.data.record = this.parseJsonFields(response.data.record)
          return { data: response.data.record }
        }
        return response
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        throw error;
      });
  }
  
  /**
   * Update user profile
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Axios promise with updated user
   */
  updateProfile(id, userData) {
    const endpoint = this.collectionEndpoint(COLLECTIONS.USERS, id)
    return apiHelpers.update(endpoint, null, userData)
  }
  
  /**
   * Change user password
   * @param {string} id - User ID
   * @param {Object} passwordData - Password change data
   * @returns {Promise} - Axios promise
   */
  changePassword(id, passwordData) {
    const endpoint = this.collectionEndpoint(COLLECTIONS.USERS, id)
    return apiHelpers.axiosInstance.patch(`${endpoint}/change-password`, passwordData)
  }
}

// Create instance
export const userService = new UserService()
