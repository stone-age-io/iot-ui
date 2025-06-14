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
 * This service interacts with the 'users' collection in PocketBase.
 * The schema consists of:
 * - id: Unique identifier (auto-generated)
 * - email: User's email address (used as username)
 * - first_name: User's first name
 * - last_name: User's last name
 * - avatar: User's profile picture (file)
 * - verified: Whether the email is verified
 * - created: Creation timestamp (auto-generated)
 * - updated: Update timestamp (auto-generated)
 * - organizations: Relation to organizations (multiple)
 * - org_roles: JSON mapping organization IDs to roles (admin or member)
 * - current_organization_id: Relation to current organization (single)
 * - is_org_admin: Boolean flag for users who can create/manage organizations globally
 */
export class UserService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.USERS,
      collectionEndpoint,
      {
        jsonFields: ['org_roles'],
        expandFields: ['current_organization_id', 'organizations']
      }
    )
  }
  
  /**
   * Get current user profile with organizations data
   * Uses ConfigService for proper endpoint construction
   * @returns {Promise} - Axios promise with user data
   */
  getCurrentUser() {
    // Use ConfigService to build the auth refresh endpoint
    const endpoint = configService.getAuthEndpoint(configService.endpoints.AUTH.REFRESH)
    
    // Add expansions for organization data
    const params = {
      expand: 'organizations,current_organization_id'
    }
    
    // Use POST method with auth token for refresh endpoint and append expansions
    return apiHelpers.axiosInstance.post(`${endpoint}?${new URLSearchParams(params).toString()}`)
      .then(response => {
        // Parse any potential JSON fields
        if (response.data && response.data.record) {
          // Parse org_roles from string to object if needed
          if (response.data.record.org_roles && typeof response.data.record.org_roles === 'string') {
            try {
              response.data.record.org_roles = JSON.parse(response.data.record.org_roles)
            } catch (e) {
              console.warn('Failed to parse org_roles', e)
              response.data.record.org_roles = {}
            }
          }
          
          // Extract expanded organization data
          const userData = this.parseJsonFields(response.data.record)
          
          // Extract the organization from the expand object if available
          if (response.data.record.expand?.current_organization_id) {
            userData.organization = response.data.record.expand.current_organization_id
          }
          
          // Extract all organizations from the expand object if available
          if (response.data.record.expand?.organizations) {
            userData.organizations = response.data.record.expand.organizations
          }
          
          return { data: userData }
        }
        return response
      })
      .catch(error => {
        console.error('Error fetching user profile:', error)
        throw error
      })
  }
  
  /**
   * Update user profile using BaseService pattern
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Axios promise with updated user
   */
  updateProfile(id, userData) {
    // Use BaseService update method for consistency
    return this.update(id, userData)
  }
  
  /**
   * Standard update method for the user entity
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Axios promise with updated user
   */
  update(id, userData) {
    return super.update(id, userData)
  }
  
  /**
   * Change user password using proper endpoint construction
   * @param {string} id - User ID
   * @param {Object} passwordData - Password change data
   * @returns {Promise} - Axios promise
   */
  changePassword(id, passwordData) {
    // Use ConfigService to build the endpoint
    const endpoint = configService.getCollectionEndpoint(COLLECTIONS.USERS, id)
    
    // Append the password change path to the endpoint
    return apiHelpers.axiosInstance.patch(`${endpoint}/change-password`, passwordData)
  }
  
  /**
   * Upload user avatar file
   * @param {string} id - User ID
   * @param {FormData} formData - FormData containing the avatar file
   * @returns {Promise} - Axios promise with updated user
   */
  uploadAvatar(id, formData) {
    const endpoint = configService.getCollectionEndpoint(COLLECTIONS.USERS, id)
    
    // Use apiHelpers for consistency, with multipart form data headers
    return apiHelpers.axiosInstance.patch(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  
  /**
   * Get user avatar URL using ConfigService
   * @param {Object} user - User object with avatar field
   * @returns {string|null} - URL of the avatar image or null
   */
  getAvatarUrl(user) {
    if (!user || !user.avatar) {
      return null
    }
    
    // Use ConfigService for consistent file URL construction
    return configService.getFileUrl(COLLECTIONS.USERS, user.id, user.avatar)
  }
  
  /**
   * Get user avatar thumbnail URL using ConfigService
   * @param {Object} user - User object with avatar field
   * @param {string} size - Thumbnail size (e.g., '100x100')
   * @returns {string|null} - URL of the avatar thumbnail or null
   */
  getAvatarThumbnailUrl(user, size = '100x100') {
    if (!user || !user.avatar) {
      return null
    }
    
    // Use ConfigService with thumbnail parameters
    return configService.getFileUrl(COLLECTIONS.USERS, user.id, user.avatar, {
      thumb: size
    })
  }
}

// Create instance
export const userService = new UserService()
