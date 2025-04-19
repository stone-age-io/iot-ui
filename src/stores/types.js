// src/stores/types.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  edgeTypeService, 
  edgeRegionService, 
  locationTypeService, 
  thingTypeService 
} from '../services/type/typeServices'

/**
 * Centralized Pinia store for managing all entity type data.
 * This store provides a single source of truth for all type-related data,
 * including edge types, edge regions, location types, and thing types.
 */
export const useTypesStore = defineStore('types', () => {
  // State for all entity types
  const edgeTypes = ref([])
  const edgeRegions = ref([])
  const locationTypes = ref([])
  const thingTypes = ref([])

  // Loading states
  const loading = ref({
    edgeTypes: false,
    edgeRegions: false,
    locationTypes: false,
    thingTypes: false
  })

  // Error states
  const error = ref({
    edgeTypes: null,
    edgeRegions: null,
    locationTypes: null,
    thingTypes: null
  })

  // Computed properties for aggregate status
  const isLoading = computed(() => 
    loading.value.edgeTypes || 
    loading.value.edgeRegions || 
    loading.value.locationTypes || 
    loading.value.thingTypes
  )

  const hasError = computed(() => 
    error.value.edgeTypes || 
    error.value.edgeRegions || 
    error.value.locationTypes || 
    error.value.thingTypes
  )

  /**
   * Load edge types with caching
   * @returns {Promise<Array>} - Edge types
   */
  async function loadEdgeTypes() {
    // Return cached types if available
    if (edgeTypes.value.length > 0) return edgeTypes.value
    
    loading.value.edgeTypes = true
    error.value.edgeTypes = null
    
    try {
      const types = await edgeTypeService.getTypeOptions()
      edgeTypes.value = types
      return types
    } catch (err) {
      console.error('Error loading edge types:', err)
      error.value.edgeTypes = 'Failed to load edge types'
      return []
    } finally {
      loading.value.edgeTypes = false
    }
  }

  /**
   * Load edge regions with caching
   * @returns {Promise<Array>} - Edge regions
   */
  async function loadEdgeRegions() {
    // Return cached regions if available
    if (edgeRegions.value.length > 0) return edgeRegions.value
    
    loading.value.edgeRegions = true
    error.value.edgeRegions = null
    
    try {
      const regions = await edgeRegionService.getRegionOptions()
      edgeRegions.value = regions
      return regions
    } catch (err) {
      console.error('Error loading edge regions:', err)
      error.value.edgeRegions = 'Failed to load edge regions'
      return []
    } finally {
      loading.value.edgeRegions = false
    }
  }

  /**
   * Load location types with caching
   * @returns {Promise<Array>} - Location types
   */
  async function loadLocationTypes() {
    // Return cached types if available
    if (locationTypes.value.length > 0) return locationTypes.value
    
    loading.value.locationTypes = true
    error.value.locationTypes = null
    
    try {
      const types = await locationTypeService.getTypeOptions()
      locationTypes.value = types
      return types
    } catch (err) {
      console.error('Error loading location types:', err)
      error.value.locationTypes = 'Failed to load location types'
      return []
    } finally {
      loading.value.locationTypes = false
    }
  }

  /**
   * Load thing types with caching
   * @returns {Promise<Array>} - Thing types
   */
  async function loadThingTypes() {
    // Return cached types if available
    if (thingTypes.value.length > 0) return thingTypes.value
    
    loading.value.thingTypes = true
    error.value.thingTypes = null
    
    try {
      const types = await thingTypeService.getTypeOptions()
      thingTypes.value = types
      return types
    } catch (err) {
      console.error('Error loading thing types:', err)
      error.value.thingTypes = 'Failed to load thing types'
      return []
    } finally {
      loading.value.thingTypes = false
    }
  }

  /**
   * Refresh a specific type collection's data by forcing a refetch from API
   * @param {string} collection - Collection name (edgeTypes, edgeRegions, locationTypes, thingTypes)
   * @returns {Promise<Array>} - Refreshed data
   */
  async function refreshTypeCollection(collection) {
    console.log(`Refreshing type collection: ${collection}`)
    switch (collection) {
      case 'edgeTypes':
        edgeTypes.value = [] // Reset cache
        return loadEdgeTypes() // Force reload
      case 'edgeRegions':
        edgeRegions.value = [] // Reset cache
        return loadEdgeRegions() // Force reload
      case 'locationTypes':
        locationTypes.value = [] // Reset cache
        return loadLocationTypes() // Force reload
      case 'thingTypes':
        thingTypes.value = [] // Reset cache
        return loadThingTypes() // Force reload
      default:
        console.warn(`Unknown type collection: ${collection}`)
        return []
    }
  }

  /**
   * Load all type collections at once
   * @returns {Promise<Array>} - All type collections
   */
  async function loadAllTypes() {
    return Promise.all([
      loadEdgeTypes(),
      loadEdgeRegions(),
      loadLocationTypes(),
      loadThingTypes()
    ])
  }

  /**
   * Reset store state (useful for logout)
   */
  function resetTypes() {
    edgeTypes.value = []
    edgeRegions.value = []
    locationTypes.value = []
    thingTypes.value = []
    
    // Reset errors
    error.value = {
      edgeTypes: null,
      edgeRegions: null,
      locationTypes: null,
      thingTypes: null
    }
  }

  /**
   * Get type name from code
   * @param {string} typeCode - Type code
   * @param {string} collection - Collection name (edgeTypes, edgeRegions, locationTypes, thingTypes)
   * @returns {string} - Type name or code if not found
   */
  function getTypeName(typeCode, collection) {
    if (!typeCode) return ''
    
    // Get the appropriate collection
    let types
    switch (collection) {
      case 'edgeTypes':
        types = edgeTypes.value
        break
      case 'edgeRegions':
        types = edgeRegions.value
        break
      case 'locationTypes':
        types = locationTypes.value
        break
      case 'thingTypes':
        types = thingTypes.value
        break
      default:
        return typeCode
    }
    
    // Find matching type
    const type = types.find(t => t.value === typeCode)
    return type ? type.label : typeCode
  }

  /**
   * Get CSS class for edge type badge
   * @param {string} typeCode - Edge type code
   * @returns {string} - CSS class
   */
  function getEdgeTypeClass(typeCode) {
    // Map of type codes to CSS classes - Updated with dark mode support
    const classMap = {
      'bld': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'srv': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'gw': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'hst': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    }
    
    return classMap[typeCode] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  /**
   * Get CSS class for edge region badge
   * @param {string} regionCode - Edge region code
   * @returns {string} - CSS class
   */
  function getEdgeRegionClass(regionCode) {
    // Map of region codes to CSS classes - Updated with dark mode support
    const classMap = {
      'na': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'eu': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'ap': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'sa': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      'af': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
    
    return classMap[regionCode] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  /**
   * Get CSS class for location type badge
   * @param {string} typeCode - Location type code
   * @returns {string} - CSS class
   */
  function getLocationTypeClass(typeCode) {
    // Map of location type codes to CSS classes - Updated with dark mode support
    const classMap = {
      'entrance': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'work-area': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'meeting-room': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'break-area': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      'reception': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'security': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'server-room': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      'utility-room': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      'storage': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'entrance-hall': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
    
    return classMap[typeCode] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  /**
   * Get CSS class for thing type badge
   * @param {string} typeCode - Thing type code
   * @returns {string} - CSS class
   */
  function getThingTypeClass(typeCode) {
    // Map of thing type codes to CSS classes - Updated with dark mode support
    const classMap = {
      'reader': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'controller': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'lock': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      'temperature-sensor': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'humidity-sensor': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      'hvac': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      'lighting': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'camera': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'motion-sensor': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'occupancy-sensor': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
    
    return classMap[typeCode] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  // Return public API
  return {
    // State
    edgeTypes,
    edgeRegions,
    locationTypes,
    thingTypes,
    loading,
    error,
    isLoading,
    hasError,
    
    // Actions
    loadEdgeTypes,
    loadEdgeRegions,
    loadLocationTypes,
    loadThingTypes,
    loadAllTypes,
    resetTypes,
    refreshTypeCollection,
    
    // Helpers
    getTypeName,
    getEdgeTypeClass,
    getEdgeRegionClass,
    getLocationTypeClass,
    getThingTypeClass
  }
})
