// src/stores/organization.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clearAllCache } from '../utils/cacheUtils'
import { useTypesStore } from './types'
import { organizationService } from '../services/organization/organizationService'

/**
 * Centralized Pinia store for organization data and operations
 * Provides a single source of truth for organization state
 */
export const useOrganizationStore = defineStore('organization', () => {
  // State
  const currentOrganization = ref(null)
  const userOrganizations = ref([])
  
  /**
   * Set the current organization
   * @param {Object} organization - Organization data
   */
  function setCurrentOrganization(organization) {
    currentOrganization.value = organization
  }
  
  /**
   * Set user's organizations
   * @param {Array} organizations - User's organizations
   */
  function setUserOrganizations(organizations) {
    userOrganizations.value = organizations
  }
  
  /**
   * Check if user belongs to an organization
   * @param {string} organizationId - Organization ID
   * @returns {boolean} - Whether user belongs to organization
   */
  function userBelongsToOrganization(organizationId) {
    return userOrganizations.value.some(org => org.id === organizationId)
  }
  
  /**
   * Find organization by ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Organization or null
   */
  async function findOrganizationById(organizationId) {
    // First try to find it in the local list
    const localOrg = userOrganizations.value.find(org => org.id === organizationId)
    if (localOrg) {
      return localOrg
    }
    
    // If not found in local list, try to fetch it from the server
    try {
      const response = await organizationService.getById(organizationId)
      if (response && response.data) {
        // Add to the local list if not already there
        if (!userOrganizations.value.some(org => org.id === response.data.id)) {
          userOrganizations.value.push(response.data)
        }
        return response.data
      }
    } catch (error) {
      console.error(`Failed to fetch organization with ID ${organizationId}:`, error)
    }
    
    return null
  }
  
  /**
   * Clear all caches and reload essential data when switching organizations
   */
  async function clearCachesAndReload() {
    // Clear all localStorage caches
    clearAllCache()
    
    // Reset and reload types data
    const typesStore = useTypesStore()
    typesStore.resetTypes()
    await typesStore.loadAllTypes()
    
    // Other data reloads could be added here
  }
  
  return {
    // State
    currentOrganization,
    userOrganizations,
    
    // Actions
    setCurrentOrganization,
    setUserOrganizations,
    userBelongsToOrganization,
    findOrganizationById,
    clearCachesAndReload
  }
})
