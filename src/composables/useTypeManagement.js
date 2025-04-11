// src/composables/useTypeManagement.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'

/**
 * Base composable for type management
 * Provides common functions for all type entities (edge types, location types, etc.)
 * 
 * @param {Object} typeService - Service instance for the specific type
 * @param {Object} routeNames - Route names for navigation (list, detail, create, edit)
 * @param {string} entityName - Display name of the entity (e.g., 'Edge Type')
 * @returns {Object} - Common state and functions for type management
 */
export function useTypeManagement(typeService, routeNames, entityName) {
  const router = useRouter()
  const toast = useToast()
  
  // Common state
  const types = ref([])
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
   * Fetch all types
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of types
   */
  const fetchTypes = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await typeService.getTypes({ 
        sort: 'type',
        ...params
      })
      
      types.value = response.data.items || []
      return types.value
    } catch (err) {
      console.error(`Error fetching ${entityName.toLowerCase()}s:`, err)
      error.value = `Failed to load ${entityName.toLowerCase()}s. Please try again.`
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to load ${entityName.toLowerCase()}s`,
        life: 3000
      })
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch a single type by ID
   * @param {string} id - Type ID
   * @returns {Promise<Object>} - Type data
   */
  const fetchType = async (id) => {
    if (!id) {
      error.value = `Invalid ${entityName.toLowerCase()} ID`
      return null
    }
    
    loading.value = true
    error.value = null
    
    try {
      const response = await typeService.getType(id)
      return response.data
    } catch (err) {
      console.error(`Error fetching ${entityName.toLowerCase()}:`, err)
      error.value = `Failed to load ${entityName.toLowerCase()} details. Please try again.`
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to load ${entityName.toLowerCase()} details`,
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Create a new type
   * @param {Object} typeData - Type data
   * @returns {Promise<Object>} - Created type
   */
  const createType = async (typeData) => {
    loading.value = true
    
    try {
      // Check if code is already in use
      const isCodeInUse = await typeService.isCodeInUse(typeData.code)
      
      if (isCodeInUse) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: `Code "${typeData.code}" is already in use. Please choose a different code.`,
          life: 3000
        })
        return null
      }
      
      const response = await typeService.createType(typeData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${entityName} "${typeData.type}" has been created`,
        life: 3000
      })
      
      return response.data
    } catch (error) {
      console.error(`Error creating ${entityName.toLowerCase()}:`, error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to create ${entityName.toLowerCase()}. Please try again.`,
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Update an existing type
   * @param {string} id - Type ID
   * @param {Object} typeData - Updated type data
   * @returns {Promise<Object>} - Updated type
   */
  const updateType = async (id, typeData) => {
    loading.value = true
    
    try {
      // Check if code is already in use (excluding current type)
      if (typeData.code) {
        const isCodeInUse = await typeService.isCodeInUse(typeData.code, id)
        
        if (isCodeInUse) {
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: `Code "${typeData.code}" is already in use. Please choose a different code.`,
            life: 3000
          })
          return null
        }
      }
      
      const response = await typeService.updateType(id, typeData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${entityName} "${typeData.type}" has been updated`,
        life: 3000
      })
      
      return response.data
    } catch (error) {
      console.error(`Error updating ${entityName.toLowerCase()}:`, error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to update ${entityName.toLowerCase()}. Please try again.`,
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Delete a type
   * @param {string} id - Type ID
   * @param {string} name - Type name for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteType = async (id, name) => {
    loading.value = true
    
    try {
      await typeService.deleteType(id)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${entityName} "${name}" has been deleted`,
        life: 3000
      })
      
      return true
    } catch (error) {
      console.error(`Error deleting ${entityName.toLowerCase()}:`, error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to delete ${entityName.toLowerCase()}`,
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Validate type code format
   * @param {string} code - Code to validate
   * @returns {boolean} - True if valid
   */
  const validateCode = (code) => {
    return typeService.validateCode ? typeService.validateCode(code) : true
  }
  
  // Navigation methods
  const navigateToTypeList = () => router.push({ name: routeNames.list })
  const navigateToTypeDetail = (id) => router.push({ name: routeNames.detail, params: { id } })
  const navigateToTypeEdit = (id) => router.push({ name: routeNames.edit, params: { id } })
  const navigateToTypeCreate = () => router.push({ name: routeNames.create })
  
  return {
    // State
    types,
    loading,
    error,
    
    // Helpers
    formatDate,
    validateCode,
    
    // Operations
    fetchTypes,
    fetchType,
    createType,
    updateType,
    deleteType,
    
    // Navigation
    navigateToTypeList,
    navigateToTypeDetail,
    navigateToTypeEdit,
    navigateToTypeCreate
  }
}
