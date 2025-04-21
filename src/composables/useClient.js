// src/composables/useClient.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  clientService, 
  generateClientUsername, 
  generateSecurePassword 
} from '../services'
import { useApiOperation } from './useApiOperation'
import { useReactiveData } from './useReactiveData'

/**
 * Composable for client-related functionality
 * Centralizes client operations, formatting helpers, and navigation
 * Enhanced to use the reactive data cache system
 */
export function useClient() {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performCreate, performUpdate, performDelete } = useApiOperation()
  
  // Common state
  const loading = ref(false)
  const error = ref(null)
  
  // Set up reactive data from the cache store
  const clientsData = useReactiveData({
    collection: 'clients',
    operation: 'list',
    fetchFunction: fetchClientsRaw,
    processData: data => data?.items || []
  })
  
  // Expose clients as a computed property that returns from reactive cache
  const clients = computed(() => clientsData.data.value || [])
  
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
   * Get connection URL from environment variables
   * @returns {string} - MQTT connection URL
   */
  const getConnectionUrl = () => {
    return import.meta.env.VITE_MQTT_HOST || 'mqtt://localhost:1883'
  }
  
  /**
   * Raw function to fetch clients - used internally by useReactiveData
   * @param {Object} options - Fetch options including skipCache flag
   * @returns {Promise<Object>} - Response from API
   */
  async function fetchClientsRaw(options = {}) {
    return await clientService.getList({
      expand: 'role_id',
      sort: '-created',
      ...options,
      skipCache: options?.skipCache
    })
  }
  
  /**
   * Fetch all clients with optional filtering
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of clients
   */
  const fetchClients = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // If user explicitly wants fresh data or provides filters
      const skipCache = params.skipCache || Object.keys(params).length > 0
      
      if (skipCache || Object.keys(params).length > 0) {
        // For filtered queries, use direct API call
        const response = await clientService.getList({
          expand: 'role_id',
          sort: '-created',
          ...params,
          skipCache
        })
        
        // Update the cache with this response
        if (response && response.data) {
          clientsData.updateData(response)
          return response.data.items || []
        }
        return []
      } else {
        // Use the reactive data system for standard fetches
        await clientsData.refreshData(skipCache)
        return clients.value
      }
    } catch (err) {
      console.error('Error in fetchClients:', err)
      error.value = 'Failed to load clients'
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch a single client by ID
   * @param {string} id - Client ID
   * @returns {Promise<Object>} - Client data
   */
  const fetchClient = async (id) => {
    if (!id) {
      error.value = 'Invalid client ID'
      return null
    }
    
    return performOperation(
      () => clientService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load client details',
        collection: 'clients', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Create a new client
   * @param {Object} clientData - Client data
   * @returns {Promise<Object>} - Created client and plain password
   */
  const createClient = async (clientData) => {
    return performOperation(
      async () => {
        // Hash the password before sending to PocketBase
        const hashedPassword = await clientService.hashPassword(clientData.password)
        
        // Remember the original password to display to the user
        const plainPassword = clientData.password
        
        // Prepare data for API using only schema fields with hashed password
        const data = {
          username: clientData.username,
          password: hashedPassword,
          role_id: clientData.role_id,
          active: clientData.active
        }
        
        // Create client
        const response = await clientService.create(data)
        
        // Show a confirmation with the plain password
        toast.add({
          severity: 'info',
          summary: 'Password Information',
          detail: `Remember to securely store the password: ${plainPassword}`,
          life: 10000
        })
        
        return {
          client: response.data,
          plainPassword
        }
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to create client',
        successMessage: `Client ${clientData.username} has been created`,
        collection: 'clients' // Specify collection for cache updates
      }
    )
  }
  
  /**
   * Update an existing client
   * @param {string} id - Client ID
   * @param {Object} clientData - Updated client data
   * @returns {Promise<Object>} - Updated client
   */
  const updateClient = async (id, clientData) => {
    return performOperation(
      async () => {
        // If password is included, hash it
        let data = { ...clientData }
        
        if (data.password) {
          data.password = await clientService.hashPassword(data.password)
        }
        
        // Update client
        return clientService.update(id, data)
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to update client',
        successMessage: 'Client has been updated',
        collection: 'clients', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Delete a client
   * @param {string} id - Client ID
   * @param {string} username - Client username for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteClient = async (id, username) => {
    return performDelete(
      () => clientService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to delete client',
        entityName: 'Client',
        entityIdentifier: username,
        collection: 'clients' // Specify collection for cache updates
      }
    )
  }
  
  /**
   * Reset client password
   * @param {string} id - Client ID
   * @returns {Promise<string|null>} - New plain text password or null on failure
   */
  const resetPassword = async (id) => {
    return performOperation(
      async () => {
        // Generate new password
        const newPassword = generateSecurePassword(12)
        
        // Hash the password before sending to PocketBase
        const hashedPassword = await clientService.hashPassword(newPassword)
        
        // Update client with new hashed password
        await clientService.update(id, {
          password: hashedPassword
        })
        
        return newPassword
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to reset password',
        successMessage: 'Password has been reset successfully',
        collection: 'clients' // Specify collection for cache updates
      }
    )
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
  
  // Navigation methods
  const navigateToClientList = () => router.push({ name: 'clients' })
  const navigateToClientDetail = (id) => router.push({ name: 'client-detail', params: { id } })
  const navigateToClientEdit = (id) => router.push({ name: 'edit-client', params: { id } })
  const navigateToClientCreate = () => router.push({ name: 'create-client' })
  const navigateToRoleDetail = (id) => router.push({ name: 'topic-permission-detail', params: { id } })
  const navigateToCreateRole = () => router.push({ name: 'create-topic-permission' })
  
  return {
    // State
    clients,
    loading,
    error,
    
    // Helpers
    formatDate,
    getConnectionUrl,
    generateClientUsername,
    generateSecurePassword,
    copyToClipboard,
    
    // Operations
    fetchClients,
    fetchClient,
    createClient,
    updateClient,
    deleteClient,
    resetPassword,
    
    // Navigation
    navigateToClientList,
    navigateToClientDetail,
    navigateToClientEdit,
    navigateToClientCreate,
    navigateToRoleDetail,
    navigateToCreateRole
  }
}
