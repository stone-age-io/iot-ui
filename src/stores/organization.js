// src/stores/organization.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clearAllCache } from '../utils/cacheUtils'
import { useTypesStore } from './types'

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
   * @returns {Object} - Organization or null
   */
  function findOrganizationById(organizationId) {
    return userOrganizations.value.find(org => org.id === organizationId) || null
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
