// src/composables/useTypeManagement.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { useApiOperation } from './useApiOperation'

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
  const { performOperation, performCreate, performUpdate, performDelete } = useApiOperation()
  
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
    return performOperation(
      () => typeService.getList({ 
        sort: 'type',
        ...params
      }),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to load ${entityName.toLowerCase()}s`,
        onSuccess: (response) => {
          types.value = response.data.items || []
          return types.value
        }
      }
    )
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
    
    return performOperation(
      () => typeService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to load ${entityName.toLowerCase()} details`,
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Create a new type
   * @param {Object} typeData - Type data
   * @returns {Promise<Object>} - Created type
   */
  const createType = async (typeData) => {
    return performOperation(
      async () => {
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
        
        return typeService.create(typeData)
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to create ${entityName.toLowerCase()}`,
        successMessage: `${entityName} "${typeData.type}" has been created`,
        onSuccess: (response) => response?.data || null
      }
    )
  }
  
  /**
   * Update an existing type
   * @param {string} id - Type ID
   * @param {Object} typeData - Updated type data
   * @returns {Promise<Object>} - Updated type
   */
  const updateType = async (id, typeData) => {
    return performOperation(
      async () => {
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
        
        return typeService.update(id, typeData)
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to update ${entityName.toLowerCase()}`,
        successMessage: `${entityName} "${typeData.type}" has been updated`,
        onSuccess: (response) => response?.data || null
      }
    )
  }
  
  /**
   * Delete a type
   * @param {string} id - Type ID
   * @param {string} name - Type name for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteType = async (id, name) => {
    return performDelete(
      () => typeService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to delete ${entityName.toLowerCase()}`,
        entityName: entityName,
        entityIdentifier: `"${name}"`
      }
    )
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
