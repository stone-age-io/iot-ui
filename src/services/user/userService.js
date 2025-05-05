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
   * Ensuring organizations are properly expanded
   * @returns {Promise} - Axios promise with user data
   */
  getCurrentUser() {
    // Use proper path construction from config service
    const endpoint = configService.getPocketBaseUrl(configService.endpoints.AUTH.REFRESH)
    
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
   * Standard update method for the user entity
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Axios promise with updated user
   */
  update(id, userData) {
    return super.update(id, userData)
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
