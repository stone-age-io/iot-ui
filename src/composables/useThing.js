// src/composables/useThing.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  thingService, 
  generateThingCode, 
  validateThingCode,
  getThingTypeAbbreviation 
} from '../services'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'
import { useReactiveData } from './useReactiveData'

/**
 * Composable for thing-related functionality
 * Centralizes thing operations, formatting helpers, and navigation
 * Enhanced to use the reactive data cache system
 */
export function useThing() {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performDelete } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Load thing types
  typesStore.loadThingTypes()
  
  // Common state
  const loading = ref(false)
  const error = ref(null)
  
  // Thing types from store
  const thingTypes = computed(() => typesStore.thingTypes)
  
  // Set up reactive data from the cache store
  const thingsData = useReactiveData({
    collection: 'things',
    operation: 'list',
    fetchFunction: fetchThingsRaw,
    // Make sure we properly process the data to maintain field mappings
    processData: data => {
      // First ensure we have valid data
      if (!data || !data.items) return []
      
      return data.items
    }
  })
  
  // Expose things as a computed property that returns from reactive cache
  const things = computed(() => thingsData.data.value || [])
  
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
   * Format time for display
   * @param {Date} dateObj - Date object
   * @returns {string} - Formatted time
   */
  const formatTime = (dateObj) => {
    if (!dateObj) return 'N/A'
    return dayjs(dateObj).format('HH:mm:ss')
  }
  
  /**
   * Get thing type display name
   * @param {string} type - Thing type code
   * @returns {string} - Display name
   */
  const getTypeName = (type) => {
    return typesStore.getTypeName(type, 'thingTypes')
  }
  
  /**
   * Get CSS class for thing type badge
   * @param {string} type - Thing type code
   * @returns {string} - CSS class
   */
  const getTypeClass = (type) => {
    switch (type) {
      case 'reader': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'controller': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'lock': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'temperature-sensor': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'humidity-sensor': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
      case 'hvac': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
      case 'lighting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'camera': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'motion-sensor': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
      case 'occupancy-sensor': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }
  
  /**
   * Format metric name for display (camelCase to Title Case)
   * @param {string} key - Metric key in camelCase
   * @returns {string} - Formatted name
   */
  const formatMetricName = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
  
  /**
   * Format metric value based on metric type
   * @param {string} key - Metric key
   * @param {*} value - Metric value
   * @returns {string} - Formatted value
   */
  const formatMetricValue = (key, value) => {
    if (key === 'batteryLevel') {
      return `${value}%`
    } else if (key === 'signalStrength') {
      return `${value} dBm`
    } else if (key === 'temperature') {
      return `${value}°C`
    }
    return value
  }
  
  /**
   * Check if a thing has metadata
   * @param {Object} thing - Thing object
   * @returns {boolean} - True if metadata exists
   */
  const hasMetadata = (thing) => {
    return thing && 
           thing.metadata && 
           typeof thing.metadata === 'object' && 
           Object.keys(thing.metadata).length > 0
  }
  
  /**
   * Raw function to fetch things - used internally by useReactiveData
   * 
   * @param {Object} options - Fetch options including skipCache flag
   * @returns {Promise<Object>} - Response from API
   */
  async function fetchThingsRaw(options = {}) {
    const response = await thingService.getList({
      expand: 'location_id,edge_id',
      sort: '-created',
      ...options,
      skipCache: options?.skipCache
    })
    
    // Return the entire response
    return response
  }
  
  /**
   * Fetch all things with optional filtering
   * Maintains backward compatibility while using the reactive cache
   * 
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of things
   */
  const fetchThings = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // If user explicitly wants fresh data or provides filters
      const skipCache = params.skipCache || Object.keys(params).length > 0
      
      if (skipCache || Object.keys(params).length > 0) {
        // For filtered queries, we need to ensure we're using the original API
        const response = await thingService.getList({
          expand: 'location_id,edge_id',
          sort: '-created',
          ...params,
          skipCache
        })
        
        // Process the response to match expected format
        if (response && response.data && response.data.items) {
          // Update cache with this data to keep UI consistent
          thingsData.updateData(response)
          return response.data.items
        }
        return []
      } else {
        // Use the reactive data system for standard fetches
        await thingsData.refreshData(skipCache)
        return things.value
      }
    } catch (err) {
      console.error('Error in fetchThings:', err)
      error.value = 'Failed to load things'
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch a single thing by ID
   * @param {string} id - Thing ID
   * @returns {Promise<Object>} - Thing data
   */
  const fetchThing = async (id) => {
    if (!id) {
      error.value = 'Invalid thing ID'
      return null
    }
    
    return performOperation(
      () => thingService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load thing details',
        collection: 'things', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Delete a thing
   * @param {string} id - Thing ID
   * @param {string} code - Thing code for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteThing = async (id, code) => {
    return performDelete(
      () => thingService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to delete thing',
        entityName: 'Thing',
        entityIdentifier: code,
        collection: 'things' // Specify collection for cache updates
      }
    )
  }
  
  /**
   * Open Grafana dashboard for a thing
   * @param {string} thingId - Thing ID
   */
  const openInGrafana = (thingId) => {
    const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'https://grafana.domain.com'
    const dashboardUrl = `${grafanaUrl}/d/thing-monitoring/thing-monitoring?var-thing_id=${thingId}`
    window.open(dashboardUrl, '_blank')
  }
  
  /**
   * Update a thing's position in the floor plan
   * @param {string} thingId - Thing ID
   * @param {Object} coordinates - x,y coordinates
   */
  const updateThingPosition = async (thingId, coordinates) => {
    if (!thingId) {
      error.value = 'Invalid thing ID'
      return false
    }
    
    try {
      loading.value = true
      error.value = null
      
      // First, get the current thing data
      const thingData = await thingService.getById(thingId)
      if (!thingData || !thingData.data) {
        throw new Error('Failed to get thing data')
      }
      
      const thing = thingData.data
      
      // Update or create the metadata.coordinates property
      const updatedMetadata = {
        ...thing.metadata || {},
        coordinates: {
          x: coordinates.x,
          y: coordinates.y
        }
      }
      
      // Update the thing with new metadata
      const result = await thingService.update(thingId, {
        ...thing,
        metadata: updatedMetadata
      })
      
      // Notice: No toast notification here - let the parent component handle that
      return true
    } catch (err) {
      console.error('Error updating thing position:', err)
      error.value = 'Failed to update thing position'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Navigation methods
  const navigateToThingList = (query = {}) => router.push({ name: 'things', query })
  const navigateToThingDetail = (id) => router.push({ name: 'thing-detail', params: { id } })
  // Fix: Changed route name from 'thing-edit' to 'edit-thing' to match router configuration
  const navigateToThingEdit = (id) => router.push({ name: 'edit-thing', params: { id } })
  const navigateToThingCreate = (query = {}) => router.push({ name: 'create-thing', query })
  const navigateToLocationDetail = (id) => router.push({ name: 'location-detail', params: { id } })
  const navigateToEdgeDetail = (id) => router.push({ name: 'edge-detail', params: { id } })
  
  return {
    // State
    things,
    loading,
    error,
    thingTypes,
    
    // Helpers
    formatDate,
    formatTime,
    getTypeName,
    getTypeClass,
    formatMetricName,
    formatMetricValue,
    hasMetadata,
    generateThingCode,
    validateThingCode,
    getThingTypeAbbreviation,
    
    // Operations
    fetchThings,
    fetchThing,
    deleteThing,
    openInGrafana,
    updateThingPosition,
    
    // Navigation
    navigateToThingList,
    navigateToThingDetail,
    navigateToThingEdit,
    navigateToThingCreate,
    navigateToLocationDetail,
    navigateToEdgeDetail
  }
}
