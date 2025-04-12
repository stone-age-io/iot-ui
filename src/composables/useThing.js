// src/composables/useThing.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  thingService, 
  thingTypes, 
  generateThingCode, 
  validateThingCode,
  getThingTypeAbbreviation 
} from '../services'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for thing-related functionality
 * Centralizes thing operations, formatting helpers, and navigation
 */
export function useThing() {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performDelete } = useApiOperation()
  
  // Common state
  const things = ref([])
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
   * @param {string} thingType - Thing type code
   * @returns {string} - Display name
   */
  const getTypeName = (thingType) => {
    const type = thingTypes.find(t => t.value === thingType)
    return type ? type.label : thingType
  }
  
  /**
   * Get CSS class for thing type badge
   * @param {string} thingType - Thing type code
   * @returns {string} - CSS class
   */
  const getTypeClass = (thingType) => {
    switch (thingType) {
      case 'reader': return 'bg-blue-100 text-blue-800'
      case 'controller': return 'bg-purple-100 text-purple-800'
      case 'lock': return 'bg-amber-100 text-amber-800'
      case 'temperature-sensor': return 'bg-green-100 text-green-800'
      case 'humidity-sensor': return 'bg-cyan-100 text-cyan-800'
      case 'hvac': return 'bg-teal-100 text-teal-800'
      case 'lighting': return 'bg-yellow-100 text-yellow-800'
      case 'camera': return 'bg-red-100 text-red-800'
      case 'motion-sensor': return 'bg-indigo-100 text-indigo-800'
      case 'occupancy-sensor': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
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
   * Fetch all things with optional filtering
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of things
   */
  const fetchThings = async (params = {}) => {
    return performOperation(
      () => thingService.getList({
        expand: 'location_id,edge_id',
        sort: '-created',
        ...params
      }),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load things',
        onSuccess: (response) => {
          things.value = response.data.items || []
          return things.value
        }
      }
    )
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
        entityIdentifier: code
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
  
  // Navigation methods
  const navigateToThingList = (query = {}) => router.push({ name: 'things', query })
  const navigateToThingDetail = (id) => router.push({ name: 'thing-detail', params: { id } })
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
    
    // Navigation
    navigateToThingList,
    navigateToThingDetail,
    navigateToThingEdit,
    navigateToThingCreate,
    navigateToLocationDetail,
    navigateToEdgeDetail
  }
}
