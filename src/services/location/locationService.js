// src/services/location/locationService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint 
} from '../pocketbase-config'

/**
 * Service for Location entity operations
 */
export class LocationService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.LOCATIONS, 
      collectionEndpoint,
      {
        jsonFields: ['metadata'],
        expandFields: ['edge_id', 'parent_id'] // Added parent_id to expand fields
      }
    )
  }
  
  /**
   * Get a paginated list of locations
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with data
   */
  getLocations(params = {}) {
    return this.getList(params)
  }
  
  /**
   * Get a single location by ID
   * @param {string} id - Location ID
   * @returns {Promise} - Axios promise with location data
   */
  getLocation(id) {
    return this.getById(id)
  }
  
  /**
   * Get child locations for a given parent location
   * @param {string} parentId - Parent location ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Axios promise with child locations data
   */
  getChildLocations(parentId, params = {}) {
    return this.getList({
      ...params,
      parent_id: parentId,
      sort: 'created'
    })
  }
  
  /**
   * Get root locations (locations without a parent)
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Axios promise with root locations data
   */
  getRootLocations(params = {}) {
    return this.getList({
      ...params,
      parent_id_empty: true,
      sort: 'created'
    })
  }
  
  /**
   * Create a new location
   * @param {Object} location - Location data
   * @returns {Promise} - Axios promise with created location
   */
  createLocation(location) {
    return this.create(location)
  }
  
  /**
   * Update an existing location
   * @param {string} id - Location ID
   * @param {Object} location - Updated location data
   * @returns {Promise} - Axios promise with updated location
   */
  updateLocation(id, location) {
    return this.update(id, location)
  }
  
  /**
   * Delete a location
   * @param {string} id - Location ID
   * @returns {Promise} - Axios promise
   */
  deleteLocation(id) {
    return this.delete(id)
  }
  
  /**
   * Upload a floor plan image for a location
   * @param {string} id - Location ID
   * @param {FormData} formData - FormData containing the floorplan file
   * @returns {Promise} - Axios promise with updated location
   */
  uploadFloorPlan(id, formData) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    
    // Use custom axios config for multipart/form-data
    return apiHelpers.axiosInstance.patch(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  
  /**
   * Get the floor plan image URL
   * @param {Object} location - Location object with floorplan field
   * @returns {string} - URL of the floor plan image
   */
  getFloorPlanImageUrl(location) {
    if (!location || !location.floorplan) {
      return null;
    }

    // Construct the PocketBase file URL with /pb prefix
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const collectionName = 'locations'; // Use the fixed collection name
    const recordId = location.id;
    const filename = location.floorplan;
    
    // Return direct URL without attempting to fetch
    return `${baseUrl}/pb/api/files/${collectionName}/${recordId}/${filename}`;
  }
  
  /**
   * Update location coordinates (for global maps)
   * @param {string} id - Location ID
   * @param {Object} coordinates - {lat, lng} coordinates
   * @returns {Promise} - Axios promise with updated location
   */
  updateLocationCoordinates(id, coordinates) {
    return this.getLocation(id).then(response => {
      const location = response.data
      
      // Create or update metadata
      let metadata = location.metadata || {}
      
      // Set coordinates
      metadata.coordinates = {
        ...metadata.coordinates,
        lat: coordinates.lat,
        lng: coordinates.lng
      }
      
      // Update location with new metadata
      return this.updateLocation(id, { metadata })
    })
  }
  
  /**
   * Custom parameter transformation for location specific filters
   * @override
   */
  transformParams(transformedParams, originalParams) {
    const filters = []
    
    // Add filter for edge_id if provided
    if (originalParams.edge_id) {
      filters.push(`edge_id="${originalParams.edge_id}"`)
    }
    
    // Add filter for parent_id if provided
    if (originalParams.parent_id) {
      filters.push(`parent_id="${originalParams.parent_id}"`)
    }
    
    // Add filter for empty parent_id if requested
    if (originalParams.parent_id_empty) {
      filters.push(`parent_id=""`)
    }
    
    // Combine all filters with AND operator
    if (filters.length > 0) {
      transformedParams.filter = filters.join(' && ')
    }
  }
  
  /**
   * Check if a location is an ancestor of another location
   * to prevent circular references when selecting a parent
   * @param {string} locationId - Location ID to check
   * @param {string} potentialParentId - Potential parent ID
   * @returns {Promise<boolean>} - True if circular reference would occur
   */
  async isCircularReference(locationId, potentialParentId) {
    // If IDs are the same, it's definitely circular
    if (locationId === potentialParentId) {
      return true
    }
    
    // If there's no potential parent, no circular reference
    if (!potentialParentId) {
      return false
    }
    
    // Check ancestors recursively
    try {
      const response = await this.getLocation(potentialParentId)
      const parent = response.data
      
      // If the parent has a parent of its own, check recursively
      if (parent.parent_id) {
        return this.isCircularReference(locationId, parent.parent_id)
      }
      
      // If we got here, no circular reference was found
      return false
    } catch (error) {
      console.error('Error checking for circular reference:', error)
      return false
    }
  }
}

// Create instance
export const locationService = new LocationService()

/**
 * Location types for dropdown options
 */
export const locationTypes = [
  { label: 'Entrance', value: 'entrance' },
  { label: 'Work Area', value: 'work-area' },
  { label: 'Meeting Room', value: 'meeting-room' },
  { label: 'Break Area', value: 'break-area' },
  { label: 'Reception', value: 'reception' },
  { label: 'Security', value: 'security' },
  { label: 'Server Room', value: 'server-room' },
  { label: 'Utility Room', value: 'utility-room' },
  { label: 'Storage', value: 'storage' },
  { label: 'Entrance Hall', value: 'entrance-hall' }
]

/**
 * Parse location path into segments
 * @param {string} path - Location path (e.g., "floor-1/north-wing/reception")
 * @returns {Array} - Array of path segments
 */
export const parseLocationPath = (path) => {
  if (!path) return []
  return path.split('/')
}

/**
 * Validate location code format: [level]-[zone]-[identifier]
 * @param {string} code - Location code to validate
 * @returns {boolean} - True if valid
 */
export const validateLocationCode = (code) => {
  if (!code) return false
  const pattern = /^[a-z]+-[a-z0-9]+-[a-z0-9-]+$/
  return pattern.test(code)
}

/**
 * Generate a location code from level, zone, and identifier
 * @param {string} level - Level (e.g., floor-1)
 * @param {string} zone - Zone (e.g., north)
 * @param {string} identifier - Unique identifier
 * @returns {string} - Formatted location code
 */
export const generateLocationCode = (level, zone, identifier) => {
  if (!level || !zone || !identifier) return ''
  return `${level}-${zone}-${identifier}`
}

/**
 * Get location levels for dropdown options
 */
export const locationLevels = [
  { label: 'Floor 1', value: 'floor-1' },
  { label: 'Floor 2', value: 'floor-2' },
  { label: 'Floor 3', value: 'floor-3' },
  { label: 'Basement', value: 'basement' },
  { label: 'Roof', value: 'roof' },
  { label: 'Zone A', value: 'zone-a' },
  { label: 'Zone B', value: 'zone-b' },
  { label: 'Zone C', value: 'zone-c' }
]

/**
 * Get location zones for dropdown options
 */
export const locationZones = [
  { label: 'North', value: 'north' },
  { label: 'South', value: 'south' },
  { label: 'East', value: 'east' },
  { label: 'West', value: 'west' },
  { label: 'Central', value: 'central' },
  { label: 'Main', value: 'main' },
  { label: 'Production', value: 'prod' },
  { label: 'Security', value: 'sec' }
]
