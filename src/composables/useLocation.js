// src/composables/useLocation.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  locationService, 
  parseLocationPath, 
  validateLocationCode, 
  generateLocationCode, 
  locationLevels, 
  locationZones 
} from '../services'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'

/**
 * Composable for location-related functionality
 * Centralizes location operations, formatting helpers, and navigation
 */
export function useLocation() {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performDelete } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Load location types
  typesStore.loadLocationTypes()
  
  // Common state
  const locations = ref([])
  const childLocations = ref([])
  const loading = ref(false)
  const childrenLoading = ref(false)
  const error = ref(null)
  
  // Location types from the store
  const locationTypes = computed(() => typesStore.locationTypes)
  
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
    return typesStore.getTypeName(typeCode, 'locationTypes')
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
   * Check if a location has a parent
   * @param {Object} location - Location object
   * @returns {boolean} - True if parent exists
   */
  const hasParent = (location) => {
    return location && 
           location.parent_id && 
           location.parent_id.trim() !== ''
  }
  
  /**
   * Get parent location display information
   * @param {Object} location - Location object with expanded parent_id
   * @returns {Object|null} - Parent info or null if no parent
   */
  const getParentInfo = (location) => {
    if (!location || !location.expand || !location.expand.parent_id) {
      return null
    }
    
    const parent = location.expand.parent_id
    return {
      id: parent.id,
      code: parent.code,
      name: parent.name,
      type: parent.type
    }
  }
  
  /**
   * Fetch all locations with optional filtering
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of locations
   */
  const fetchLocations = async (params = {}) => {
    return performOperation(
      () => locationService.getList({ 
        expand: 'edge_id,parent_id',
        sort: '-created',
        ...params
      }),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load locations',
        onSuccess: (response) => {
          locations.value = response.data.items || []
          return locations.value
        }
      }
    )
  }
  
  /**
   * Fetch child locations for a given parent
   * @param {string} parentId - Parent location ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Array>} - List of child locations
   */
  const fetchChildLocations = async (parentId) => {
    if (!parentId) {
      childLocations.value = []
      return []
    }
    
    return performOperation(
      () => locationService.getChildLocations(parentId, {
        expand: 'edge_id,parent_id',
        sort: 'name'
      }),
      {
        loadingRef: childrenLoading,
        errorRef: null,
        errorMessage: 'Failed to load child locations',
        onSuccess: (response) => {
          childLocations.value = response.data.items || []
          return childLocations.value
        }
      }
    )
  }
  
  /**
   * Fetch root locations (locations without parents)
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Array>} - List of root locations
   */
  const fetchRootLocations = async (params = {}) => {
    return performOperation(
      () => locationService.getRootLocations({
        expand: 'edge_id,parent_id',
        sort: 'name',
        ...params
      }),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load root locations',
        onSuccess: (response) => {
          locations.value = response.data.items || []
          return locations.value
        }
      }
    )
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
    
    return performOperation(
      () => locationService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load location details',
        onSuccess: (response) => {
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
        }
      }
    )
  }
  
  /**
   * Delete a location
   * @param {string} id - Location ID
   * @param {string} code - Location code for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteLocation = async (id, code) => {
    return performDelete(
      () => locationService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to delete location',
        entityName: 'Location',
        entityIdentifier: code
      }
    )
  }
  
  /**
   * Upload a floor plan image for a location
   * @param {string} id - Location ID
   * @param {File} file - Floor plan image file
   * @returns {Promise<boolean>} - Success status
   */
  const uploadFloorPlan = async (id, file) => {
    return performOperation(
      () => {
        // Create FormData object for file upload
        const formData = new FormData()
        formData.append('floorplan', file)
        
        // Update location with new floor plan
        return locationService.uploadFloorPlan(id, formData)
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to upload floor plan',
        successMessage: 'Floor plan uploaded successfully',
        onSuccess: () => true
      }
    )
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
    return performOperation(
      () => locationService.updateLocationCoordinates(id, coordinates),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to update location coordinates',
        successMessage: 'Location coordinates updated',
        onSuccess: () => true
      }
    )
  }
  
  /**
   * Check if selecting a parent would create a circular reference
   * @param {string} locationId - Current location ID
   * @param {string} parentId - Potential parent ID
   * @returns {Promise<boolean>} - Whether the reference would be circular
   */
  const checkCircularReference = async (locationId, parentId) => {
    if (!locationId || !parentId) return false
    
    return performOperation(
      () => locationService.isCircularReference(locationId, parentId),
      {
        loadingRef: false,
        errorRef: null,
        errorMessage: 'Error checking for circular reference',
        onSuccess: (result) => result,
        onError: () => false
      }
    )
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
    childLocations,
    loading,
    childrenLoading,
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
    hasParent,
    getParentInfo,
    generateLocationCode,
    validateLocationCode,
    checkCircularReference,
    
    // Operations
    fetchLocations,
    fetchRootLocations,
    fetchChildLocations,
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
