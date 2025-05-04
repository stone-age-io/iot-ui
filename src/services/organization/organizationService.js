// src/services/organization/organizationService.js
import { BaseService } from '../base/BaseService'
import { COLLECTIONS, collectionEndpoint } from '../pocketbase-config'
import { apiHelpers } from '../api'
import configService from '../config/configService'

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
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with organizations data
   */
  getUserOrganizations(params = {}) {
    return this.getList({
      filter: 'user_organizations',
      ...params
    })
  }
  
  /**
   * Set current organization for user
   * @param {string} organizationId - Organization ID
   * @returns {Promise} - Axios promise
   */
  setCurrentOrganization(organizationId) {
    return apiHelpers.axiosInstance.post('/pb/api/users/me/switch-organization', {
      organization_id: organizationId
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
}

// Create instance
export const organizationService = new OrganizationService()
