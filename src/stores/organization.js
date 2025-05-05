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
  const isLoading = ref(false)
  const error = ref(null)
  
  // Computed values for commonly needed data
  const currentOrganizationCode = computed(() => {
    if (currentOrganization.value?.code) {
      return currentOrganization.value.code;
    }
    
    // If we have an organization name but no code, try to derive one
    if (currentOrganization.value?.name) {
      return organizationService.deriveOrganizationCode(currentOrganization.value.name);
    }
    
    return 'org'; // Default fallback
  });
  
  /**
   * Set the current organization
   * @param {Object} organization - Organization data
   */
  function setCurrentOrganization(organization) {
    currentOrganization.value = organization
    
    // Log organization details to help with debugging
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Organization set:', {
        id: organization?.id,
        name: organization?.name,
        code: organization?.code || currentOrganizationCode.value
      });
    }
  }
  
  /**
   * Set user's organizations
   * @param {Array} organizations - User's organizations
   */
  function setUserOrganizations(organizations) {
    userOrganizations.value = organizations
  }
  
  /**
   * Ensure the current organization has a code
   * If not, tries to fetch it or derive it
   */
  async function ensureOrganizationCode() {
    // Skip if we already have a code
    if (currentOrganization.value?.code) {
      return currentOrganizationCode.value;
    }
    
    try {
      isLoading.value = true;
      
      // If we have an organization ID but no code, fetch the full organization data
      if (currentOrganization.value?.id) {
        const response = await organizationService.getById(currentOrganization.value.id);
        if (response?.data) {
          // Update the organization with the full data
          setCurrentOrganization(response.data);
          return currentOrganizationCode.value;
        }
      }
      
      // If we still don't have a code, try to derive one from the name
      return currentOrganizationCode.value;
    } catch (err) {
      console.error('Error ensuring organization code:', err);
      error.value = 'Failed to fetch organization details';
      return currentOrganizationCode.value;
    } finally {
      isLoading.value = false;
    }
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
      isLoading.value = true;
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
    } finally {
      isLoading.value = false;
    }
    
    return null
  }
  
  /**
   * Find organization by code
   * @param {string} code - Organization code
   * @returns {Promise<Object>} - Organization or null
   */
  async function findOrganizationByCode(code) {
    // First try to find it in the local list
    const localOrg = userOrganizations.value.find(org => org.code === code)
    if (localOrg) {
      return localOrg
    }
    
    // If not found in local list, try to fetch it from the server
    try {
      isLoading.value = true;
      const response = await organizationService.getByCode(code)
      if (response && response.data) {
        // Add to the local list if not already there
        if (!userOrganizations.value.some(org => org.id === response.data.id)) {
          userOrganizations.value.push(response.data)
        }
        return response.data
      }
    } catch (error) {
      console.error(`Failed to fetch organization with code ${code}:`, error)
    } finally {
      isLoading.value = false;
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
  
  /**
   * Load current organization details if they're incomplete
   * Useful when only the ID is available but code is needed
   */
  async function loadCurrentOrganizationDetails() {
    if (!currentOrganization.value?.id) return null;
    
    // Skip if we already have complete data
    if (currentOrganization.value?.code) return currentOrganization.value;
    
    try {
      isLoading.value = true;
      const response = await organizationService.getById(currentOrganization.value.id);
      
      if (response && response.data) {
        setCurrentOrganization(response.data);
        return response.data;
      }
    } catch (err) {
      console.error('Error loading organization details:', err);
      error.value = 'Failed to load organization details';
    } finally {
      isLoading.value = false;
    }
    
    return currentOrganization.value;
  }
  
  return {
    // State
    currentOrganization,
    userOrganizations,
    isLoading,
    error,
    
    // Computed
    currentOrganizationCode,
    
    // Actions
    setCurrentOrganization,
    setUserOrganizations,
    userBelongsToOrganization,
    findOrganizationById,
    findOrganizationByCode,
    clearCachesAndReload,
    loadCurrentOrganizationDetails,
    ensureOrganizationCode
  }
})
