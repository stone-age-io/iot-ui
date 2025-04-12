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
 * Centralized store for type management
 * Handles edge types, edge regions, location types, and thing types
 * Provides consistent loading, caching, and error handling
 */
export const useTypesStore = defineStore('types', () => {
  // State
  const edgeTypes = ref([])
  const edgeRegions = ref([])
  const locationTypes = ref([])
  const thingTypes = ref([])
  const loading = ref({
    edgeTypes: false,
    edgeRegions: false,
    locationTypes: false,
    thingTypes: false
  })
  const error = ref({
    edgeTypes: null,
    edgeRegions: null,
    locationTypes: null,
    thingTypes: null
  })

  // Computed properties
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

  // Actions for loading types
  async function loadEdgeTypes() {
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

  async function loadEdgeRegions() {
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

  async function loadLocationTypes() {
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

  async function loadThingTypes() {
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

  // Utility function to load all types simultaneously
  async function loadAllTypes() {
    return Promise.all([
      loadEdgeTypes(),
      loadEdgeRegions(),
      loadLocationTypes(),
      loadThingTypes()
    ])
  }

  // Reset store state (useful for logout)
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

  // Utility functions for getting type names and classes
  function getTypeName(typeCode, collection) {
    if (!typeCode) return ''
    
    let types = []
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
    
    const type = types.find(t => t.value === typeCode)
    return type ? type.label : typeCode
  }

  // Get css class for edge type badge
  function getEdgeTypeClass(typeCode) {
    switch (typeCode) {
      case 'bld': return 'bg-blue-100 text-blue-800'
      case 'dc': return 'bg-purple-100 text-purple-800'
      case 'wh': return 'bg-amber-100 text-amber-800'
      case 'camp': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get css class for edge region badge
  function getEdgeRegionClass(regionCode) {
    switch (regionCode) {
      case 'na': return 'bg-red-100 text-red-800'
      case 'eu': return 'bg-blue-100 text-blue-800'
      case 'ap': return 'bg-green-100 text-green-800'
      case 'sa': return 'bg-yellow-100 text-yellow-800'
      case 'af': return 'bg-orange-100 text-orange-800'
      case 'me': return 'bg-purple-100 text-purple-800'
      case 'aus': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return {
    // State
    edgeTypes,
    edgeRegions,
    locationTypes,
    thingTypes,
    loading,
    error,
    
    // Computed
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
    getEdgeRegionClass
  }
})
