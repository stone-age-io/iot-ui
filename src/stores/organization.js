// src/stores/organization.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { clearAllCache } from '../utils/cacheUtils'
import { useTypesStore } from './types'
import { organizationService } from '../services/organization/organizationService'

/**
 * Centralized Pinia store for organization data and operations
 * Provides a single source of truth for organization state
 * Enhanced with persistence and better initialization
 */
export const useOrganizationStore = defineStore('organization', () => {
  // State
  const currentOrganization = ref(null)
  const userOrganizations = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  
  // Initialize from localStorage if available
  initFromLocalStorage()
  
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
  
  // Watch for changes to currentOrganization and persist to localStorage
  watch(currentOrganization, (newOrg) => {
    if (newOrg) {
      localStorage.setItem('currentOrganization', JSON.stringify(newOrg));
    } else {
      localStorage.removeItem('currentOrganization');
    }
  }, { deep: true });
  
  // Watch for changes to userOrganizations and persist to localStorage
  watch(userOrganizations, (newOrgs) => {
    if (newOrgs && newOrgs.length > 0) {
      localStorage.setItem('userOrganizations', JSON.stringify(newOrgs));
    } else {
      localStorage.removeItem('userOrganizations');
    }
  }, { deep: true });
  
  /**
   * Initialize from localStorage on store creation/page reload
   */
  function initFromLocalStorage() {
    try {
      // Try to restore currentOrganization from localStorage
      const storedOrg = localStorage.getItem('currentOrganization');
      if (storedOrg) {
        currentOrganization.value = JSON.parse(storedOrg);
        console.debug('Restored currentOrganization from localStorage:', currentOrganization.value.name);
      }
      
      // Try to restore userOrganizations from localStorage
      const storedUserOrgs = localStorage.getItem('userOrganizations');
      if (storedUserOrgs) {
        userOrganizations.value = JSON.parse(storedUserOrgs);
        console.debug('Restored userOrganizations from localStorage:', userOrganizations.value.length);
      }
    } catch (error) {
      console.warn('Failed to initialize organization data from localStorage:', error);
    }
  }
  
  /**
   * Set the current organization
   * @param {Object} organization - Organization data
   */
  function setCurrentOrganization(organization) {
    currentOrganization.value = organization
    
    // Update auth data for cache segmentation and API context
    try {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      authData.currentOrgId = organization?.id || null;
      localStorage.setItem('auth', JSON.stringify(authData));
      
      console.debug('Updated auth.currentOrgId in localStorage:', organization?.id);
    } catch (e) {
      console.warn('Failed to update organization ID in auth data:', e);
    }
    
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
  
  /**
   * Initialize organization data from all possible sources
   * Used for recovery after page refresh or when the primary method fails
   */
  async function initFromAllSources() {
    console.debug('Attempting to initialize organization data from all sources');
    
    // If we already have data, we're good
    if (currentOrganization.value) {
      console.debug('Organization already initialized:', currentOrganization.value.code);
      return true;
    }
    
    try {
      // 1. Try localStorage first (already done in constructor, but check again)
      const storedOrg = localStorage.getItem('currentOrganization');
      if (storedOrg) {
        try {
          const parsedOrg = JSON.parse(storedOrg);
          if (parsedOrg && parsedOrg.id) {
            setCurrentOrganization(parsedOrg);
            console.debug('Initialized organization from localStorage:', parsedOrg.code);
            return true;
          }
        } catch (e) {
          console.warn('Failed to parse stored organization:', e);
        }
      }
      
      // 2. Try to get from auth data in localStorage
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      let orgId = null;
      
      if (authData.currentOrgId) {
        orgId = authData.currentOrgId;
        console.debug('Found organization ID in auth.currentOrgId:', orgId);
      } else if (authData.user?.current_organization_id) {
        orgId = authData.user.current_organization_id;
        console.debug('Found organization ID in auth.user.current_organization_id:', orgId);
      }
      
      if (orgId) {
        const org = await findOrganizationById(orgId);
        if (org) {
          setCurrentOrganization(org);
          console.debug('Initialized organization from auth data:', org.code);
          return true;
        }
      }
      
      // 3. Try JWT token payload as last resort
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length >= 2) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.current_organization_id) {
              const org = await findOrganizationById(payload.current_organization_id);
              if (org) {
                setCurrentOrganization(org);
                console.debug('Initialized organization from JWT payload:', org.code);
                return true;
              }
            }
          }
        } catch (e) {
          console.warn('Failed to extract organization from token:', e);
        }
      }
      
      // 4. Last resort: Use first available organization if we have any
      if (userOrganizations.value.length > 0) {
        setCurrentOrganization(userOrganizations.value[0]);
        console.debug('Set fallback organization (first available):', userOrganizations.value[0].code);
        return true;
      }
      
      console.warn('Failed to initialize organization data from any source');
      return false;
    } catch (error) {
      console.error('Error during organization initialization:', error);
      return false;
    }
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
    ensureOrganizationCode,
    initFromAllSources
  }
})
