// src/composables/useOrganization.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { organizationService } from '../services/organization/organizationService'
import { useApiOperation } from './useApiOperation'
import { useAuthStore } from '../stores/auth'
import { useOrganizationStore } from '../stores/organization'
import { useReactiveData } from './useReactiveData'

/**
 * Composable for organization-related functionality
 * Centralizes organization operations, formatting helpers, and navigation
 * Enhanced to use the reactive data cache system
 */
export function useOrganization() {
  const router = useRouter()
  const toast = useToast()
  const authStore = useAuthStore()
  const organizationStore = useOrganizationStore()
  const { performOperation, performCreate, performUpdate, performDelete } = useApiOperation()
  
  // Common state
  const loading = ref(false)
  const error = ref(null)
  
  // Set up reactive data from the cache store for all organizations
  const organizationsData = useReactiveData({
    collection: 'organizations',
    operation: 'list',
    fetchFunction: fetchOrganizationsRaw,
    processData: data => data?.items || []
  })
  
  // Set up reactive data for user organizations
  const userOrganizationsData = useReactiveData({
    collection: 'user_organizations',
    operation: 'list',
    fetchFunction: fetchUserOrganizationsRaw,
    processData: data => data?.items || []
  })
  
  // Expose organizations as computed properties that return from reactive cache
  const organizations = computed(() => organizationsData.data.value || [])
  const userOrganizations = computed(() => userOrganizationsData.data.value || [])
  
  // Computed properties
  const currentOrganization = computed(() => organizationStore.currentOrganization)
  const userRole = computed(() => {
    if (!authStore.user || !currentOrganization.value) return null
    return organizationService.getUserRole(
      currentOrganization.value.id, 
      authStore.user
    )
  })
  const isAdmin = computed(() => userRole.value === 'admin')
  const canManageOrganizations = computed(() => authStore.user?.is_org_admin === true)
  
  /**
   * Raw function to fetch all organizations - used internally by useReactiveData
   * @param {Object} options - Fetch options including skipCache flag
   * @returns {Promise<Object>} - Response from API
   */
  async function fetchOrganizationsRaw(options = {}) {
    return await organizationService.getList({
      sort: 'name',
      ...options,
      skipCache: options?.skipCache
    })
  }
  
  /**
   * Raw function to fetch user organizations - used internally by useReactiveData
   * @param {Object} options - Fetch options including skipCache flag
   * @returns {Promise<Object>} - Response from API
   */
  async function fetchUserOrganizationsRaw(options = {}) {
    return await organizationService.getUserOrganizations({
      ...options,
      skipCache: options?.skipCache
    })
  }

  /**
   * Fetch organizations the user belongs to
   * @param {Object} params - Optional query parameters
   * @returns {Promise<Array>} - User organizations
   */
  const fetchUserOrganizations = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // If user explicitly wants fresh data or provides filters
      const skipCache = params.skipCache || Object.keys(params).length > 0
      
      // Use the reactive data system
      await userOrganizationsData.refreshData(skipCache)
      
      // Update the organization store
      organizationStore.setUserOrganizations(userOrganizations.value)
      
      return userOrganizations.value
    } catch (err) {
      console.error('Error in fetchUserOrganizations:', err)
      error.value = 'Failed to load user organizations'
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch a single organization by ID
   * @param {string} id - Organization ID
   * @returns {Promise<Object>} - Organization data
   */
  const fetchOrganization = async (id) => {
    return performOperation(
      () => organizationService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load organization details',
        collection: 'organizations', // Specify collection for cache updates
        onSuccess: (response) => {
          return response.data
        }
      }
    )
  }
  
  /**
   * Fetch all organizations (admin only)
   * @param {Object} params - Optional query parameters
   * @returns {Promise<Array>} - All organizations
   */
  const fetchOrganizations = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // If user explicitly wants fresh data or provides filters
      const skipCache = params.skipCache || Object.keys(params).length > 0
      
      // Use the reactive data system
      await organizationsData.refreshData(skipCache)
      
      return organizations.value
    } catch (err) {
      console.error('Error in fetchOrganizations:', err)
      error.value = 'Failed to load all organizations'
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Switch to a different organization
   * @param {string} organizationId - Organization ID to switch to
   * @returns {Promise<boolean>} - Success status
   */
  const switchOrganization = async (organizationId) => {
    // Ensure we don't switch to the same organization
    if (organizationId === currentOrganization.value?.id) {
      return true;
    }
    
    return performOperation(
      () => organizationService.setCurrentOrganization(organizationId),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to switch organization',
        collection: 'organizations', // Specify collection for cache updates
        onSuccess: async (response) => {
          try {
            // Update auth store with new organization info
            await authStore.refreshUserData()
            
            // Try to find the organization in the user's organizations
            const org = await organizationStore.findOrganizationById(organizationId)
            
            if (!org) {
              // If org still not found, fetch it directly
              const fetchedOrg = await fetchOrganization(organizationId)
              if (fetchedOrg) {
                // Update organization store with fetched org
                await organizationStore.setCurrentOrganization(fetchedOrg)
                
                // Show success message
                toast.add({
                  severity: 'success',
                  summary: 'Organization Switched',
                  detail: `Switched to ${fetchedOrg.name}`,
                  life: 3000
                })
                
                // Clear all caches and reload needed data
                organizationStore.clearCachesAndReload()
                
                return true
              } else {
                throw new Error(`Organization with ID ${organizationId} not found`)
              }
            } else {
              // Update organization store
              await organizationStore.setCurrentOrganization(org)
              
              // Show success message
              toast.add({
                severity: 'success',
                summary: 'Organization Switched',
                detail: `Switched to ${org.name}`,
                life: 3000
              })
              
              // Clear all caches and reload needed data
              organizationStore.clearCachesAndReload()
              
              return true
            }
          } catch (err) {
            console.error('Error switching organization:', err)
            
            // Show error toast
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to complete organization switch. Please refresh and try again.',
              life: 5000
            })
            
            return false
          }
        }
      }
    )
  }
  
  /**
   * Create a new organization
   * @param {Object} data - Organization data
   * @returns {Promise<Object>} - Created organization
   */
  const createOrganization = async (data) => {
    return performCreate(
      () => organizationService.create(data),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to create organization',
        entityName: 'Organization',
        entityIdentifier: data.name,
        collection: 'organizations', // Specify collection for cache updates
        onSuccess: (response) => {
          // Force refresh of user organizations
          userOrganizationsData.refreshData(true)
          
          // Add to locally tracked user organizations
          userOrganizations.value.push(response.data)
          organizationStore.setUserOrganizations(userOrganizations.value)
          
          // Switch to the new organization after creation
          switchOrganization(response.data.id)
          return response.data
        }
      }
    )
  }
  
  /**
   * Update an organization
   * @param {string} id - Organization ID
   * @param {Object} data - Updated organization data
   * @returns {Promise<Object>} - Updated organization
   */
  const updateOrganization = async (id, data) => {
    return performUpdate(
      () => organizationService.update(id, data),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to update organization',
        entityName: 'Organization',
        entityIdentifier: data.name,
        collection: 'organizations', // Specify collection for cache updates
        onSuccess: (response) => {
          // If this is the current organization, update it in the store
          if (currentOrganization.value?.id === id) {
            organizationStore.setCurrentOrganization(response.data)
          }
          
          // Update cached data
          organizationsData.refreshData(true)
          userOrganizationsData.refreshData(true)
          
          return response.data
        }
      }
    )
  }
  
  /**
   * Delete an organization
   * @param {string} id - Organization ID
   * @param {string} name - Organization name for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteOrganization = async (id, name) => {
    return performDelete(
      () => organizationService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to delete organization',
        entityName: 'Organization',
        entityIdentifier: name,
        collection: 'organizations', // Specify collection for cache updates
        onSuccess: async () => {
          // If this was the current organization, switch to another one
          if (currentOrganization.value?.id === id) {
            // Find another organization to switch to
            // Force refresh user organizations first
            await fetchUserOrganizations({ skipCache: true })
            
            const otherOrg = userOrganizations.value.find(o => o.id !== id)
            if (otherOrg) {
              await switchOrganization(otherOrg.id)
            }
          }
          
          // Force refresh cached data
          organizationsData.refreshData(true)
          userOrganizationsData.refreshData(true)
          
          return true
        }
      }
    )
  }
  
  /**
   * Check if user has a specific role in current organization
   * @param {string} role - Role to check ('admin' or 'member')
   * @returns {boolean} - Whether user has the role
   */
  const hasRole = (role) => {
    return userRole.value === role
  }
  
  // Navigation methods
  const navigateToOrganizations = () => router.push({ name: 'organizations' })
  const navigateToOrganizationDetail = (id) => router.push({ name: 'organization-detail', params: { id } })
  const navigateToCreateOrganization = () => router.push({ name: 'create-organization' })
  const navigateToEditOrganization = (id) => router.push({ name: 'edit-organization', params: { id } })
  
  return {
    // State
    organizations,
    userOrganizations,
    loading,
    error,
    
    // Computed
    currentOrganization,
    userRole,
    isAdmin,
    canManageOrganizations,
    
    // Operations
    fetchUserOrganizations,
    fetchOrganization,
    fetchOrganizations,
    switchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    hasRole,
    
    // Navigation
    navigateToOrganizations,
    navigateToOrganizationDetail,
    navigateToCreateOrganization,
    navigateToEditOrganization
  }
}
