// src/composables/useTypeManagement.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'
import { useReactiveData } from './useReactiveData'

/**
 * Base composable for type management
 * Provides common functions for all type entities (edge types, location types, etc.)
 * Enhanced to use the reactive data cache system
 * 
 * @param {Object} typeService - Service instance for the specific type
 * @param {Object} routeNames - Route names for navigation (list, detail, create, edit)
 * @param {string} entityName - Display name of the entity (e.g., 'Edge Type')
 * @returns {Object} - Common state and functions for type management
 */
export function useTypeManagement(typeService, routeNames, entityName) {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performDelete } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Determine the store collection name based on entityName
  const storeCollectionName = getStoreCollectionName(entityName)
  
  // Map entityName to a collection name for cache purposes
  const cacheCollection = mapToCollectionName(entityName)
  
  // Common state
  const loading = ref(false)
  const error = ref(null)
  
  // Set up reactive data from the cache store
  const typesData = useReactiveData({
    collection: cacheCollection,
    operation: 'list',
    fetchFunction: fetchTypesRaw,
    processData: data => data?.items || []
  })
  
  // Expose types as a computed property that returns from reactive cache
  const types = computed(() => typesData.data.value || [])
  
  /**
   * Determine the store collection name based on entity name
   * @param {string} name - Entity name (Edge Type, Location Type, etc.)
   * @returns {string} - Store collection name
   */
  function getStoreCollectionName(name) {
    if (name.includes('Edge Type')) return 'edgeTypes'
    if (name.includes('Edge Region')) return 'edgeRegions' 
    if (name.includes('Location Type')) return 'locationTypes'
    if (name.includes('Thing Type')) return 'thingTypes'
    return null
  }
  
  /**
   * Map entity name to a collection name for caching
   * @param {string} name - Entity name
   * @returns {string} - Collection name
   */
  function mapToCollectionName(name) {
    if (name.includes('Edge Type')) return 'edge_types'
    if (name.includes('Edge Region')) return 'edge_regions' 
    if (name.includes('Location Type')) return 'location_types'
    if (name.includes('Thing Type')) return 'thing_types'
    return name.toLowerCase().replace(/\s+/g, '_')
  }

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
   * Raw function to fetch types - used internally by useReactiveData
   * @param {Object} options - Fetch options including skipCache flag
   * @returns {Promise<Object>} - Response from API
   */
  async function fetchTypesRaw(options = {}) {
    return await typeService.getList({
      sort: 'type',
      ...options,
      skipCache: options?.skipCache
    })
  }
  
  /**
   * Fetch all types with optional filtering
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of types
   */
  const fetchTypes = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // If user explicitly wants fresh data or provides filters
      const skipCache = params.skipCache || Object.keys(params).length > 0
      
      if (skipCache || Object.keys(params).length > 0) {
        // For filtered queries, use direct API call
        const response = await typeService.getList({
          sort: 'type',
          ...params,
          skipCache
        })
        
        // Update the cache with this response
        if (response && response.data) {
          typesData.updateData(response)
          return response.data.items || []
        }
        return []
      } else {
        // Use the reactive data system for standard fetches
        await typesData.refreshData(skipCache)
        return types.value
      }
    } catch (err) {
      console.error(`Error in fetch${entityName}s:`, err)
      error.value = `Failed to load ${entityName.toLowerCase()}s`
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
    
    return performOperation(
      () => typeService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: `Failed to load ${entityName.toLowerCase()} details`,
        collection: cacheCollection, // Specify collection for cache updates
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
        collection: cacheCollection, // Specify collection for cache updates
        onSuccess: (response) => {
          // Force refresh the data
          typesData.refreshData(true)
          
          // Refresh the types store
          if (storeCollectionName) {
            typesStore.refreshTypeCollection(storeCollectionName)
          }
          return response?.data || null
        }
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
        collection: cacheCollection, // Specify collection for cache updates
        onSuccess: (response) => {
          // Force refresh the data
          typesData.refreshData(true)
          
          // Refresh the types store
          if (storeCollectionName) {
            typesStore.refreshTypeCollection(storeCollectionName)
          }
          return response?.data || null
        }
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
        entityIdentifier: `"${name}"`,
        collection: cacheCollection, // Specify collection for cache updates
        onSuccess: () => {
          // Force refresh the data
          typesData.refreshData(true)
          
          // Refresh the types store
          if (storeCollectionName) {
            typesStore.refreshTypeCollection(storeCollectionName)
          }
          return true
        }
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
  
  // Refresh the types data when the composable is initialized
  typesData.refreshData(false)
  
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
