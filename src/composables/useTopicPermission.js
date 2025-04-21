// src/composables/useTopicPermission.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  topicPermissionService, 
  validateTopic
} from '../services'
import { useApiOperation } from './useApiOperation'
import { useReactiveData } from './useReactiveData'

/**
 * Composable for topic permission-related functionality
 * Centralizes topic permission operations, formatting helpers, and navigation
 * Enhanced to use the reactive data cache system
 */
export function useTopicPermission() {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performCreate, performUpdate, performDelete } = useApiOperation()
  
  // Common state
  const loading = ref(false)
  const error = ref(null)
  
  // Set up reactive data from the cache store
  const permissionsData = useReactiveData({
    collection: 'topic_permissions',
    operation: 'list',
    fetchFunction: fetchPermissionsRaw,
    processData: data => data?.items || []
  })
  
  // Expose permissions as a computed property that returns from reactive cache
  const permissions = computed(() => permissionsData.data.value || [])
  
  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return dayjs(dateString).format('MMM D, YYYY HH:mm')
  }
  
  /**
   * Get total topic count for a permission
   * @param {Object} permission - Permission object
   * @returns {number} - Total topic count
   */
  const getTopicsCount = (permission) => {
    if (!permission) return 0
    const pubCount = Array.isArray(permission.publish_permissions) ? permission.publish_permissions.length : 0
    const subCount = Array.isArray(permission.subscribe_permissions) ? permission.subscribe_permissions.length : 0
    return pubCount + subCount
  }
  
  /**
   * Get count of topics in an array
   * @param {Array} topics - Array of topics
   * @returns {number} - Count of topics
   */
  const getTopicCount = (topics) => {
    if (!topics) return 0
    return Array.isArray(topics) ? topics.length : 0
  }
  
  /**
   * Get sample of topics for display
   * @param {Array} topics - Array of topics
   * @returns {string} - Sample text
   */
  const getTopicSample = (topics) => {
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return 'No topics'
    }
    
    if (topics.length === 1) {
      return topics[0]
    }
    
    return `${topics[0]} and ${topics.length - 1} more`
  }
  
  /**
   * Validate topic format
   * @param {string} topic - Topic string to validate
   * @returns {boolean} - True if valid
   */
  const isValidTopic = (topic) => {
    return topic && validateTopic(topic)
  }
  
  /**
   * Copy text to clipboard with success/error feedback
   * @param {string} text - Text to copy
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.add({
          severity: 'info',
          summary: 'Copied',
          detail: 'Text copied to clipboard',
          life: 2000
        })
      })
      .catch(err => {
        console.error('Failed to copy text: ', err)
        toast.add({
          severity: 'error',
          summary: 'Copy Failed',
          detail: 'Failed to copy text to clipboard',
          life: 3000
        })
      })
  }
  
  /**
   * Raw function to fetch permissions - used internally by useReactiveData
   * @param {Object} options - Fetch options including skipCache flag
   * @returns {Promise<Object>} - Response from API
   */
  async function fetchPermissionsRaw(options = {}) {
    return await topicPermissionService.getList({
      sort: '-created',
      ...options,
      skipCache: options?.skipCache
    })
  }
  
  /**
   * Fetch all permissions with optional filtering
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of permissions
   */
  const fetchPermissions = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // If user explicitly wants fresh data or provides filters
      const skipCache = params.skipCache || Object.keys(params).length > 0
      
      if (skipCache || Object.keys(params).length > 0) {
        // For filtered queries, use direct API call
        const response = await topicPermissionService.getList({
          sort: '-created',
          ...params,
          skipCache
        })
        
        // Update the cache with this response
        if (response && response.data) {
          permissionsData.updateData(response)
          return response.data.items || []
        }
        return []
      } else {
        // Use the reactive data system for standard fetches
        await permissionsData.refreshData(skipCache)
        return permissions.value
      }
    } catch (err) {
      console.error('Error in fetchPermissions:', err)
      error.value = 'Failed to load permissions'
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch a single permission by ID
   * @param {string} id - Permission ID
   * @returns {Promise<Object>} - Permission data
   */
  const fetchPermission = async (id) => {
    if (!id) {
      error.value = 'Invalid permission ID'
      return null
    }
    
    return performOperation(
      () => topicPermissionService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load permission details',
        collection: 'topic_permissions', // Specify collection for cache updates
        onSuccess: (response) => {
          // Ensure arrays
          const permission = response.data
          if (!Array.isArray(permission.publish_permissions)) {
            permission.publish_permissions = []
          }
          if (!Array.isArray(permission.subscribe_permissions)) {
            permission.subscribe_permissions = []
          }
          
          return permission
        }
      }
    )
  }
  
  /**
   * Fetch clients using a permission role
   * @param {string} permissionId - Permission ID
   * @returns {Promise<Array>} - Clients using the permission
   */
  const fetchClientsByPermission = async (permissionId) => {
    if (!permissionId) return []
    
    return performOperation(
      () => topicPermissionService.getClientsByPermission(permissionId),
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: 'Failed to load clients using this role',
        onSuccess: (response) => response.data.items || []
      }
    )
  }
  
  /**
   * Create a new permission role
   * @param {Object} permissionData - Permission data
   * @returns {Promise<Object>} - Created permission
   */
  const createPermission = async (permissionData) => {
    return performCreate(
      () => topicPermissionService.create(permissionData),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to create permission',
        entityName: 'Permission role',
        entityIdentifier: `'${permissionData.name}'`,
        collection: 'topic_permissions', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Update an existing permission
   * @param {string} id - Permission ID
   * @param {Object} permissionData - Updated permission data
   * @returns {Promise<Object>} - Updated permission
   */
  const updatePermission = async (id, permissionData) => {
    return performUpdate(
      () => topicPermissionService.update(id, permissionData),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to update permission',
        entityName: 'Permission role',
        entityIdentifier: `'${permissionData.name}'`,
        collection: 'topic_permissions', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Delete a permission
   * @param {string} id - Permission ID
   * @param {string} name - Permission name for display
   * @returns {Promise<boolean>} - Success status
   */
  const deletePermission = async (id, name) => {
    return performDelete(
      () => topicPermissionService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to delete permission',
        entityName: 'Permission role',
        entityIdentifier: `'${name}'`,
        collection: 'topic_permissions' // Specify collection for cache updates
      }
    )
  }
  
  // Navigation methods
  const navigateToPermissionList = () => router.push({ name: 'topic-permissions' })
  const navigateToPermissionDetail = (id) => router.push({ name: 'topic-permission-detail', params: { id } })
  const navigateToPermissionEdit = (id) => router.push({ name: 'edit-topic-permission', params: { id } })
  const navigateToPermissionCreate = () => router.push({ name: 'create-topic-permission' })
  const navigateToCreateClient = (roleId) => router.push({ name: 'create-client', query: { role_id: roleId } })
  
  return {
    // State
    permissions,
    loading,
    error,
    
    // Helpers
    formatDate,
    getTopicsCount,
    getTopicCount,
    getTopicSample,
    isValidTopic,
    copyToClipboard,
    validateTopic,
    
    // Operations
    fetchPermissions,
    fetchPermission,
    fetchClientsByPermission,
    createPermission,
    updatePermission,
    deletePermission,
    
    // Navigation
    navigateToPermissionList,
    navigateToPermissionDetail,
    navigateToPermissionEdit,
    navigateToPermissionCreate,
    navigateToCreateClient
  }
}
