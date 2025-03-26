// src/composables/useLocation.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  locationService, 
  locationTypes, 
  parseLocationPath, 
  validateLocationCode, 
  generateLocationCode, 
  locationLevels, 
  locationZones 
} from '../services'

/**
 * Composable for location-related functionality
 * Centralizes location operations, formatting helpers, and navigation
 */
export function useLocation() {
  const router = useRouter()
  const toast = useToast()
  
  // Common state
  const locations = ref([])
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
   * Get location type display name
   * @param {string} typeCode - Location type code
   * @returns {string} - Display name
   */
  const getTypeName = (typeCode) => {
    const type = locationTypes.find(t => t.value === typeCode)
    return type ? type.label : typeCode
  }
  
  /**
   * Get CSS class for location type badge
   * @param {string} typeCode - Location type code
   * @returns {string} - CSS class
   */
  const getTypeClass = (typeCode) => {
    switch (typeCode) {
      case 'entrance': return 'bg-blue-100 text-blue-800'
      case 'work-area': return 'bg-green-100 text-green-800'
      case 'meeting-room': return 'bg-purple-100 text-purple-800'
      case 'break-area': return 'bg-amber-100 text-amber-800'
      case 'reception': return 'bg-indigo-100 text-indigo-800'
      case 'security': return 'bg-red-100 text-red-800'
      case 'server-room': return 'bg-cyan-100 text-cyan-800'
      case 'utility-room': return 'bg-teal-100 text-teal-800'
      case 'storage': return 'bg-gray-100 text-gray-800'
      case 'entrance-hall': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  /**
   * Format location path for display
   * @param {string} path - Location path
   * @returns {string} - Formatted path
   */
  const formatPath = (path) => {
    if (!path) return ''
    return path.split('/').join(' > ')
  }
  
  /**
   * Check if a location has metadata
   * @param {Object} location - Location object
   * @returns {boolean} - True if metadata exists
   */
  const hasMetadata = (location) => {
    return location && 
           location.metadata && 
           typeof location.metadata === 'object' && 
           Object.keys(location.metadata).length > 0
  }

  /**
   * Check if a location has valid floor plan
   * @param {Object} location - Location object
   * @returns {boolean} - True if floor plan exists
   */
  const hasFloorPlan = (location) => {
    return location && location.floorplan;
  }
  
  /**
   * Fetch all locations with optional filtering
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of locations
   */
  const fetchLocations = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await locationService.getLocations({ 
        expand: 'edge_id',
        sort: '-created',
        ...params
      })
      locations.value = response.data.items || []
      return locations.value
    } catch (err) {
      console.error('Error fetching locations:', err)
      error.value = 'Failed to load locations. Please try again.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load locations',
        life: 3000
      })
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch a single location by ID
   * @param {string} id - Location ID
   * @returns {Promise<Object>} - Location data
   */
  const fetchLocation = async (id) => {
    if (!id) {
      error.value = 'Invalid location ID'
      return null
    }
    
    loading.value = true
    error.value = null
    
    try {
      const response = await locationService.getLocation(id)
      // Parse metadata if it's a string
      if (response.data.metadata && typeof response.data.metadata === 'string') {
        try {
          response.data.metadata = JSON.parse(response.data.metadata)
        } catch (e) {
          console.warn('Failed to parse metadata for location:', response.data.code)
          response.data.metadata = {}
        }
      }
      return response.data
    } catch (err) {
      console.error('Error fetching location:', err)
      error.value = 'Failed to load location details. Please try again.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load location details',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Delete a location
   * @param {string} id - Location ID
   * @param {string} code - Location code for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteLocation = async (id, code) => {
    loading.value = true
    try {
      await locationService.deleteLocation(id)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Location ${code} has been deleted`,
        life: 3000
      })
      
      return true
    } catch (error) {
      console.error('Error deleting location:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete location',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Upload a floor plan image for a location
   * @param {string} id - Location ID
   * @param {File} file - Floor plan image file
   * @returns {Promise<boolean>} - Success status
   */
  const uploadFloorPlan = async (id, file) => {
    loading.value = true
    try {
      // Create FormData object for file upload
      const formData = new FormData()
      formData.append('floorplan', file)
      
      // Update location with new floor plan
      await locationService.uploadFloorPlan(id, formData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Floor plan uploaded successfully',
        life: 3000
      })
      
      return true
    } catch (error) {
      console.error('Error uploading floor plan:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to upload floor plan',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Get the floor plan image URL
   * @param {Object} location - Location object
   * @returns {string} - URL of floor plan image
   */
  const getFloorPlanImageUrl = (location) => {
    return locationService.getFloorPlanImageUrl(location)
  }
  
  /**
   * Update location coordinates for global map
   * @param {string} id - Location ID
   * @param {Object} coordinates - {lat, lng} coordinates
   * @returns {Promise<boolean>} - Success status
   */
  const updateLocationCoordinates = async (id, coordinates) => {
    loading.value = true
    try {
      await locationService.updateLocationCoordinates(id, coordinates)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Location coordinates updated',
        life: 3000
      })
      
      return true
    } catch (error) {
      console.error('Error updating location coordinates:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update location coordinates',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Navigation methods
  const navigateToLocationList = (query = {}) => router.push({ name: 'locations', query })
  const navigateToLocationDetail = (id) => router.push({ name: 'location-detail', params: { id } })
  const navigateToLocationEdit = (id) => router.push({ name: 'edit-location', params: { id } })
  const navigateToLocationCreate = (query = {}) => router.push({ name: 'create-location', query })
  const navigateToEdgeDetail = (id) => router.push({ name: 'edge-detail', params: { id } })
  const navigateToThings = (locationId) => router.push({ name: 'things', query: { location: locationId } })
  const navigateToCreateThing = (locationId) => router.push({ name: 'create-thing', query: { location_id: locationId } })
  
  return {
    // State
    locations,
    loading,
    error,
    locationTypes,
    locationLevels,
    locationZones,
    
    // Helpers
    formatDate,
    getTypeName,
    getTypeClass,
    parseLocationPath,
    formatPath,
    hasMetadata,
    hasFloorPlan,
    generateLocationCode,
    validateLocationCode,
    
    // Operations
    fetchLocations,
    fetchLocation,
    deleteLocation,
    uploadFloorPlan,
    getFloorPlanImageUrl,
    updateLocationCoordinates,
    
    // Navigation
    navigateToLocationList,
    navigateToLocationDetail,
    navigateToLocationEdit,
    navigateToLocationCreate,
    navigateToEdgeDetail,
    navigateToThings,
    navigateToCreateThing
  }
}
