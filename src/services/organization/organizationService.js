// src/services/organization/organizationService.js
import { BaseService } from '../base/BaseService'
import { COLLECTIONS, collectionEndpoint } from '../pocketbase-config'
import { apiHelpers } from '../api'
import configService from '../config/configService'
import { userService } from '../user/userService'

/**
 * Service for Organization operations
 * 
 * Handles CRUD operations for organizations and organization membership
 */
export class OrganizationService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.ORGANIZATIONS,
      collectionEndpoint,
      {
        jsonFields: ['settings'],
        expandFields: []
      }
    )
  }
  
  /**
   * Get organizations for the current user
   * With expanded fields to ensure we have full organization data
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with organizations data
   */
  getUserOrganizations(params = {}) {
    return this.getList({
      ...params,
      expand: 'user_organization_roles',
      sort: 'name'
    })
  }
  
  /**
   * Set current organization for user
   * Using standard user update pattern rather than custom endpoint
   * @param {string} organizationId - Organization ID
   * @returns {Promise} - Axios promise
   */
  setCurrentOrganization(organizationId) {
    // Get current user from auth store via localStorage
    const authData = JSON.parse(localStorage.getItem('auth') || '{}')
    const userId = authData.user?.id
    
    if (!userId) {
      return Promise.reject(new Error('User not authenticated'))
    }
    
    // Update user record with new current_organization_id
    return userService.update(userId, {
      current_organization_id: organizationId
    })
  }
  
  /**
   * Get organization by code 
   * This is useful when we have the organization code but not the ID
   * @param {string} code - Organization code
   * @returns {Promise} - Axios promise with organization data
   */
  getByCode(code) {
    if (!code) {
      return Promise.reject(new Error('Organization code is required'))
    }
    
    return this.getList({
      filter: `code="${code}"`,
      limit: 1
    }).then(response => {
      if (response.data && response.data.items && response.data.items.length > 0) {
        return {
          ...response,
          data: response.data.items[0]
        }
      }
      
      // Organization not found
      return Promise.reject(new Error(`Organization with code ${code} not found`))
    })
  }
  
  /**
   * Get user's role in an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object with org_roles
   * @returns {string} - Role ('admin', 'member', or null)
   */
  getUserRole(organizationId, user) {
    if (!user || !user.org_roles) return null
    
    const roles = typeof user.org_roles === 'string' 
      ? JSON.parse(user.org_roles) 
      : user.org_roles
      
    return roles[organizationId] || null
  }
  
  /**
   * Add a user to an organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @param {string} role - Role ('admin' or 'member')
   * @returns {Promise} - Axios promise
   */
  addUserToOrganization(organizationId, userId, role = 'member') {
    return apiHelpers.axiosInstance.post(`/pb/api/organizations/${organizationId}/users`, {
      user_id: userId,
      role: role
    })
  }
  
  /**
   * Remove a user from an organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise} - Axios promise
   */
  removeUserFromOrganization(organizationId, userId) {
    return apiHelpers.axiosInstance.delete(`/pb/api/organizations/${organizationId}/users/${userId}`)
  }
  
  /**
   * Update a user's role in an organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @param {string} role - New role ('admin' or 'member')
   * @returns {Promise} - Axios promise
   */
  updateUserRole(organizationId, userId, role) {
    return apiHelpers.axiosInstance.patch(`/pb/api/organizations/${organizationId}/users/${userId}`, {
      role: role
    })
  }
  
  /**
   * Derive an organization code from a name
   * Useful for creating new organizations or fallback when code isn't available
   * @param {string} name - Organization name
   * @returns {string} - Derived organization code
   */
  deriveOrganizationCode(name) {
    if (!name) return 'org';
    
    // Remove non-alphanumeric characters, convert to lowercase, and take first 4 letters
    let code = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 4);
    
    // Ensure code is at least 2 characters
    if (code.length < 2) {
      code = code.padEnd(2, 'o');
    }
    
    return code;
  }
  
  /**
   * Get the current organization code from the current user's organization
   * This is a utility method that can be called from anywhere to get the current org code
   * @returns {Promise<string>} - Current organization code or default value
   */
  async getCurrentOrganizationCode() {
    try {
      // Get current user data
      const userData = JSON.parse(localStorage.getItem('auth') || '{}')
      const currentOrgId = userData.user?.current_organization_id
      
      if (!currentOrgId) return 'org'
      
      // Fetch the organization by ID
      const response = await this.getById(currentOrgId)
      
      if (response && response.data && response.data.code) {
        return response.data.code
      }
      
      return 'org'
    } catch (error) {
      console.warn('Error getting current organization code:', error)
      return 'org'
    }
  }
}

// Create instance
export const organizationService = new OrganizationService()
