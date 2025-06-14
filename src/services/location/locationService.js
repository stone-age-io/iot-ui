// src/services/location/locationService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint 
} from '../pocketbase-config'
import { apiHelpers } from '../api'
import configService from '../config/configService'

/**
 * Service for Location entity operations
 * Updated to use ConfigService for all URL construction
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
   * Upload a floor plan image for a location
   * @param {string} id - Location ID
   * @param {FormData} formData - FormData containing the floorplan file
   * @returns {Promise} - Axios promise with updated location
   */
  uploadFloorPlan(id, formData) {
    // Use ConfigService to build the endpoint consistently
    const endpoint = configService.getCollectionEndpoint(COLLECTIONS.LOCATIONS, id)
    
    // Use apiHelpers for consistency, with multipart form data headers
    return apiHelpers.axiosInstance.patch(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  
  /**
   * Get the floor plan image URL using ConfigService for consistent URL construction
   * @param {Object} location - Location object with floorplan field
   * @returns {string|null} - URL of the floor plan image or null
   */
  getFloorPlanImageUrl(location) {
    if (!location || !location.floorplan) {
      return null
    }

    // Use ConfigService for consistent file URL construction
    return configService.getFileUrl(COLLECTIONS.LOCATIONS, location.id, location.floorplan)
  }
  
  /**
   * Get the floor plan image thumbnail URL using ConfigService
   * @param {Object} location - Location object with floorplan field
   * @param {string} size - Thumbnail size (e.g., '800x600')
   * @returns {string|null} - URL of the floor plan thumbnail or null
   */
  getFloorPlanThumbnailUrl(location, size = '800x600') {
    if (!location || !location.floorplan) {
      return null
    }

    // Use ConfigService with thumbnail parameters
    return configService.getFileUrl(COLLECTIONS.LOCATIONS, location.id, location.floorplan, {
      thumb: size
    })
  }
  
  /**
   * Get downloadable floor plan URL using ConfigService
   * @param {Object} location - Location object with floorplan field
   * @returns {string|null} - URL for downloading the floor plan or null
   */
  getFloorPlanDownloadUrl(location) {
    if (!location || !location.floorplan) {
      return null
    }

    // Use ConfigService with download parameter
    return configService.getFileUrl(COLLECTIONS.LOCATIONS, location.id, location.floorplan, {
      download: '1'
    })
  }
  
  /**
   * Update location coordinates (for global maps)
   * @param {string} id - Location ID
   * @param {Object} coordinates - {lat, lng} coordinates
   * @returns {Promise} - Axios promise with updated location
   */
  updateLocationCoordinates(id, coordinates) {
    return this.getById(id).then(response => {
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
      return this.update(id, { metadata })
    })
  }
  
  /**
   * Update location indoor coordinates (for floor plan positioning)
   * @param {string} id - Location ID
   * @param {Object} coordinates - {x, y} coordinates on floor plan
   * @returns {Promise} - Axios promise with updated location
   */
  updateLocationIndoorCoordinates(id, coordinates) {
    return this.getById(id).then(response => {
      const location = response.data
      
      // Create or update metadata
      let metadata = location.metadata || {}
      
      // Set indoor coordinates
      metadata.indoorCoordinates = {
        ...metadata.indoorCoordinates,
        x: coordinates.x,
        y: coordinates.y
      }
      
      // Update location with new metadata
      return this.update(id, { metadata })
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
      const response = await this.getById(potentialParentId)
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
  
  /**
   * Compute location path based on parent-child relationship
   * @param {string} parentPath - Parent location path
   * @param {string} locationCode - Location code
   * @returns {string} - Computed path
   */
  computeLocationPath(parentPath, locationCode) {
    if (!parentPath) return locationCode
    return `${parentPath}/${locationCode}`
  }
  
  /**
   * Update location path based on parent change
   * This ensures path is consistent with parent-child relationships
   * @param {string} id - Location ID
   * @param {string} parentId - New parent ID
   * @returns {Promise} - Axios promise with updated location
   */
  async updateLocationPath(id, parentId) {
    try {
      // Get the current location
      const locationResponse = await this.getById(id)
      const location = locationResponse.data
      
      let newPath = location.code
      
      // If parent exists, get parent path and compute new path
      if (parentId) {
        const parentResponse = await this.getById(parentId)
        const parent = parentResponse.data
        newPath = this.computeLocationPath(parent.path, location.code)
      }
      
      // Update location with new path
      return this.update(id, { path: newPath })
    } catch (error) {
      console.error('Error updating location path:', error)
      throw error
    }
  }
}

// Create instance
export const locationService = new LocationService()

/**
 * Location types for dropdown options based on the documentation
 */
export const locationTypes = [
  { label: 'Zone', value: 'zone' },
  { label: 'Room', value: 'room' },
  { label: 'Station', value: 'station' },
  { label: 'Area', value: 'area' },
  { label: 'Section', value: 'section' },
  { label: 'Floor', value: 'floor' },
  { label: 'Wing', value: 'wing' },
  { label: 'Virtual', value: 'virtual' },
  // Additional specialized types
  { label: 'Meeting Room', value: 'meeting-room' },
  { label: 'Server Room', value: 'server-room' },
  { label: 'Storage Room', value: 'storage-room' },
  { label: 'Entrance', value: 'entrance' },
  { label: 'Reception Area', value: 'reception-area' },
  { label: 'Security Zone', value: 'security-zone' }
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
 * Validate location code format as per documentation {type}-{number}
 * @param {string} code - Location code to validate
 * @returns {boolean} - True if valid
 */
export const validateLocationCode = (code) => {
  if (!code) return false
  // Match pattern {type}-{number} where type can contain hyphens
  // For example: floor-1, room-101, meeting-room-5
  const pattern = /^[a-z][-a-z]+-[0-9a-z]+$/
  return pattern.test(code)
}

/**
 * Generate a location code from type and number
 * Following the documented pattern {type}-{number}
 * @param {string} type - Location type (e.g., floor, room, wing)
 * @param {string|number} number - Identifying number/code
 * @returns {string} - Formatted location code
 */
export const generateLocationCode = (type, number) => {
  if (!type || !number) return ''
  return `${type}-${number}`
}

/**
 * Compute path from parent path and location code
 * Ensures path is consistent with parent-child relationships
 * @param {string} parentPath - Parent location path
 * @param {string} locationCode - Location code
 * @returns {string} - Computed path
 */
export const computeLocationPath = (parentPath, locationCode) => {
  if (!parentPath) return locationCode
  return `${parentPath}/${locationCode}`
}

/**
 * Get location type value from label
 * @param {string} typeLabel - Type label
 * @returns {string} - Type code/value
 */
export const getLocationTypeValue = (typeLabel) => {
  const type = locationTypes.find(t => t.label.toLowerCase() === typeLabel.toLowerCase())
  return type ? type.value : typeLabel.toLowerCase().replace(/\s+/g, '-')
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
