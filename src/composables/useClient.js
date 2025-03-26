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

/**
 * Composable for client-related functionality
 * Centralizes client operations, formatting helpers, and navigation
 */
export function useClient() {
  const router = useRouter()
  const toast = useToast()
  
  // Common state
  const clients = ref([])
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
   * Get connection URL from environment variables
   * @returns {string} - MQTT connection URL
   */
  const getConnectionUrl = () => {
    return import.meta.env.VITE_MQTT_HOST || 'mqtt://localhost:1883'
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
      const response = await clientService.getClients({
        expand: 'role_id',
        sort: '-created',
        ...params
      })
      clients.value = response.data.items || []
      return clients.value
    } catch (err) {
      console.error('Error fetching clients:', err)
      error.value = 'Failed to load clients. Please try again.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load clients',
        life: 3000
      })
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
    
    loading.value = true
    error.value = null
    
    try {
      const response = await clientService.getClient(id)
      return response.data
    } catch (err) {
      console.error('Error fetching client:', err)
      error.value = 'Failed to load client details. Please try again.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load client details',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Create a new client
   * @param {Object} clientData - Client data
   * @returns {Promise<Object>} - Created client and plain password
   */
  const createClient = async (clientData) => {
    loading.value = true
    
    try {
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
      const response = await clientService.createClient(data)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Client ${data.username} has been created`,
        life: 3000
      })
      
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
    } catch (error) {
      console.error('Error creating client:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create client. Please try again.',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Update an existing client
   * @param {string} id - Client ID
   * @param {Object} clientData - Updated client data
   * @returns {Promise<Object>} - Updated client
   */
  const updateClient = async (id, clientData) => {
    loading.value = true
    
    try {
      // If password is included, hash it
      let data = { ...clientData }
      
      if (data.password) {
        data.password = await clientService.hashPassword(data.password)
      }
      
      // Update client
      const response = await clientService.updateClient(id, data)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Client has been updated`,
        life: 3000
      })
      
      return response.data
    } catch (error) {
      console.error('Error updating client:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update client. Please try again.',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Delete a client
   * @param {string} id - Client ID
   * @param {string} username - Client username for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteClient = async (id, username) => {
    loading.value = true
    try {
      await clientService.deleteClient(id)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Client ${username} has been deleted`,
        life: 3000
      })
      
      return true
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete client',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Reset client password
   * @param {string} id - Client ID
   * @returns {Promise<string|null>} - New plain text password or null on failure
   */
  const resetPassword = async (id) => {
    loading.value = true
    
    try {
      // Generate new password
      const newPassword = generateSecurePassword(12)
      
      // Hash the password before sending to PocketBase
      const hashedPassword = await clientService.hashPassword(newPassword)
      
      // Update client with new hashed password
      await clientService.updateClient(id, {
        password: hashedPassword
      })
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Password has been reset successfully',
        life: 3000
      })
      
      return newPassword
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to reset password',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
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
