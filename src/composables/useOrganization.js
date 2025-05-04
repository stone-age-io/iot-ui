// src/composables/useOrganization.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { organizationService } from '../services/organization/organizationService'
import { useApiOperation } from './useApiOperation'
import { useAuthStore } from '../stores/auth'
import { useOrganizationStore } from '../stores/organization'

/**
 * Composable for organization-related functionality
 * Centralizes organization operations, formatting helpers, and navigation
 */
export function useOrganization() {
  const router = useRouter()
  const toast = useToast()
  const authStore = useAuthStore()
  const organizationStore = useOrganizationStore()
  const { performOperation, performCreate, performUpdate, performDelete } = useApiOperation()
  
  // Common state
  const organizations = ref([])
  const userOrganizations = ref([])
  const loading = ref(false)
  const error = ref(null)
  
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
   * Fetch organizations the user belongs to
   * @returns {Promise<Array>} - User organizations
   */
  const fetchUserOrganizations = async () => {
    return performOperation(
      () => organizationService.getUserOrganizations(),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load organizations',
        onSuccess: (response) => {
          userOrganizations.value = response.data.items || []
          organizationStore.setUserOrganizations(userOrganizations.value)
          return userOrganizations.value
        }
      }
    )
  }
  
  /**
   * Fetch all organizations (admin only)
   * @returns {Promise<Array>} - All organizations
   */
  const fetchOrganizations = async () => {
    return performOperation(
      () => organizationService.getList(),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load all organizations',
        onSuccess: (response) => {
          organizations.value = response.data.items || []
          return organizations.value
        }
      }
    )
  }
  
  /**
   * Switch to a different organization
   * @param {string} organizationId - Organization ID to switch to
   * @returns {Promise<boolean>} - Success status
   */
  const switchOrganization = async (organizationId) => {
    return performOperation(
      () => organizationService.setCurrentOrganization(organizationId),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to switch organization',
        onSuccess: async (response) => {
          // Update auth store with new organization info
          await authStore.refreshUserData()
          
          // Update organization store
          const org = organizationStore.findOrganizationById(organizationId)
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
        collection: 'organizations',
        onSuccess: (response) => {
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
        collection: 'organizations',
        onSuccess: (response) => {
          // If this is the current organization, update it in the store
          if (currentOrganization.value?.id === id) {
            organizationStore.setCurrentOrganization(response.data)
          }
          
          // Update the organization in the list
          const index = userOrganizations.value.findIndex(o => o.id === id)
          if (index !== -1) {
            userOrganizations.value[index] = response.data
            organizationStore.setUserOrganizations(userOrganizations.value)
          }
          
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
        collection: 'organizations',
        onSuccess: async () => {
          // If this was the current organization, switch to another one
          if (currentOrganization.value?.id === id) {
            // Find another organization to switch to
            const otherOrg = userOrganizations.value.find(o => o.id !== id)
            if (otherOrg) {
              await switchOrganization(otherOrg.id)
            }
          }
          
          // Update the organizations list
          await fetchUserOrganizations()
          
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
