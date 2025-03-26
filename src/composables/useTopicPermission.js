// src/composables/useTopicPermission.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  topicPermissionService, 
  validateTopic
} from '../services'

/**
 * Composable for topic permission-related functionality
 * Centralizes topic permission operations, formatting helpers, and navigation
 */
export function useTopicPermission() {
  const router = useRouter()
  const toast = useToast()
  
  // Common state
  const permissions = ref([])
  const loading = ref(false)
  const error = ref(null)
  
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
   * Fetch all permissions
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of permissions
   */
  const fetchPermissions = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await topicPermissionService.getTopicPermissions({
        sort: '-created',
        ...params
      })
      permissions.value = response.data.items || []
      return permissions.value
    } catch (err) {
      console.error('Error fetching permissions:', err)
      error.value = 'Failed to load permissions. Please try again.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load permissions',
        life: 3000
      })
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
    
    loading.value = true
    error.value = null
    
    try {
      const response = await topicPermissionService.getTopicPermission(id)
      
      // Ensure arrays
      const permission = response.data
      if (!Array.isArray(permission.publish_permissions)) {
        permission.publish_permissions = []
      }
      if (!Array.isArray(permission.subscribe_permissions)) {
        permission.subscribe_permissions = []
      }
      
      return permission
    } catch (err) {
      console.error('Error fetching permission:', err)
      error.value = 'Failed to load permission details. Please try again.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load permission details',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch clients using a permission role
   * @param {string} permissionId - Permission ID
   * @returns {Promise<Array>} - Clients using the permission
   */
  const fetchClientsByPermission = async (permissionId) => {
    if (!permissionId) return []
    
    loading.value = true
    
    try {
      const response = await topicPermissionService.getClientsByPermission(permissionId)
      return response.data.items || []
    } catch (err) {
      console.error('Error fetching clients by permission:', err)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load clients using this role',
        life: 3000
      })
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Create a new permission role
   * @param {Object} permissionData - Permission data
   * @returns {Promise<Object>} - Created permission
   */
  const createPermission = async (permissionData) => {
    loading.value = true
    
    try {
      const response = await topicPermissionService.createTopicPermission(permissionData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Permission role '${permissionData.name}' has been created`,
        life: 3000
      })
      
      return response.data
    } catch (error) {
      console.error('Error creating permission:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create permission. Please try again.',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Update an existing permission
   * @param {string} id - Permission ID
   * @param {Object} permissionData - Updated permission data
   * @returns {Promise<Object>} - Updated permission
   */
  const updatePermission = async (id, permissionData) => {
    loading.value = true
    
    try {
      const response = await topicPermissionService.updateTopicPermission(id, permissionData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Permission role '${permissionData.name}' has been updated`,
        life: 3000
      })
      
      return response.data
    } catch (error) {
      console.error('Error updating permission:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update permission. Please try again.',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Delete a permission
   * @param {string} id - Permission ID
   * @param {string} name - Permission name for display
   * @returns {Promise<boolean>} - Success status
   */
  const deletePermission = async (id, name) => {
    loading.value = true
    try {
      await topicPermissionService.deleteTopicPermission(id)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Permission role '${name}' has been deleted`,
        life: 3000
      })
      
      return true
    } catch (error) {
      console.error('Error deleting permission:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete permission',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
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
