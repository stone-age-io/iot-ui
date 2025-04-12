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
    // Map of type codes to CSS classes
    const classMap = {
      'bld': 'bg-blue-100 text-blue-800',
      'srv': 'bg-purple-100 text-purple-800',
      'gw': 'bg-green-100 text-green-800',
      'hst': 'bg-amber-100 text-amber-800'
    }
    
    return classMap[typeCode] || 'bg-gray-100 text-gray-800'
  }

  /**
   * Get CSS class for edge region badge
   * @param {string} regionCode - Edge region code
   * @returns {string} - CSS class
   */
  function getEdgeRegionClass(regionCode) {
    // Map of region codes to CSS classes
    const classMap = {
      'na': 'bg-blue-100 text-blue-800',
      'eu': 'bg-green-100 text-green-800',
      'ap': 'bg-purple-100 text-purple-800',
      'sa': 'bg-amber-100 text-amber-800',
      'af': 'bg-red-100 text-red-800'
    }
    
    return classMap[regionCode] || 'bg-gray-100 text-gray-800'
  }

  /**
   * Get CSS class for location type badge
   * @param {string} typeCode - Location type code
   * @returns {string} - CSS class
   */
  function getLocationTypeClass(typeCode) {
    // Map of location type codes to CSS classes
    const classMap = {
      'entrance': 'bg-blue-100 text-blue-800',
      'work-area': 'bg-green-100 text-green-800',
      'meeting-room': 'bg-purple-100 text-purple-800',
      'break-area': 'bg-amber-100 text-amber-800',
      'reception': 'bg-indigo-100 text-indigo-800',
      'security': 'bg-red-100 text-red-800',
      'server-room': 'bg-cyan-100 text-cyan-800',
      'utility-room': 'bg-teal-100 text-teal-800',
      'storage': 'bg-gray-100 text-gray-800',
      'entrance-hall': 'bg-blue-100 text-blue-800'
    }
    
    return classMap[typeCode] || 'bg-gray-100 text-gray-800'
  }

  /**
   * Get CSS class for thing type badge
   * @param {string} typeCode - Thing type code
   * @returns {string} - CSS class
   */
  function getThingTypeClass(typeCode) {
    // Map of thing type codes to CSS classes
    const classMap = {
      'reader': 'bg-blue-100 text-blue-800',
      'controller': 'bg-purple-100 text-purple-800',
      'lock': 'bg-amber-100 text-amber-800',
      'temperature-sensor': 'bg-green-100 text-green-800',
      'humidity-sensor': 'bg-cyan-100 text-cyan-800',
      'hvac': 'bg-teal-100 text-teal-800',
      'lighting': 'bg-yellow-100 text-yellow-800',
      'camera': 'bg-red-100 text-red-800',
      'motion-sensor': 'bg-indigo-100 text-indigo-800',
      'occupancy-sensor': 'bg-orange-100 text-orange-800'
    }
    
    return classMap[typeCode] || 'bg-gray-100 text-gray-800'
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
    
    // Helpers
    getTypeName,
    getEdgeTypeClass,
    getEdgeRegionClass,
    getLocationTypeClass,
    getThingTypeClass
  }
})
