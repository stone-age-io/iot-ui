import { apiHelpers } from './api'
import { 
  COLLECTIONS, 
  collectionEndpoint, 
  transformResponse,
  transformPaginationParams 
} from './pocketbase-config'

// Location service with CRUD operations
export const locationService = {
  /**
   * Get a paginated list of locations
   * @param {Object} params - Query parameters for pagination, sorting, filtering
   * @returns {Promise} - Axios promise with locations data
   */
  getLocations(params = {}) {
    const endpoint = collectionEndpoint(COLLECTIONS.LOCATIONS)
    const transformedParams = transformPaginationParams(params)
    
    // Add expand parameter to include edge data
    if (!transformedParams.expand) {
      transformedParams.expand = 'edge'
    }
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        // Transform the response to match our expected format
        return { data: transformResponse(response.data) }
      })
  },

  /**
   * Get a single location by ID
   * @param {string} id - Location ID
   * @returns {Promise} - Axios promise with location data
   */
  getLocation(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.LOCATIONS, id)
    // Add expand parameter to include edge data
    return apiHelpers.getList(`${endpoint}?expand=edge`);
  },

  /**
   * Create a new location
   * @param {Object} location - Location data
   * @returns {Promise} - Axios promise with created location
   */
  createLocation(location) {
    const endpoint = collectionEndpoint(COLLECTIONS.LOCATIONS)
    return apiHelpers.create(endpoint, location)
  },

  /**
   * Update an existing location
   * @param {string} id - Location ID
   * @param {Object} location - Updated location data
   * @returns {Promise} - Axios promise with updated location
   */
  updateLocation(id, location) {
    const endpoint = collectionEndpoint(COLLECTIONS.LOCATIONS, id)
    return apiHelpers.update(endpoint, null, location)
  },

  /**
   * Delete a location
   * @param {string} id - Location ID
   * @returns {Promise} - Axios promise
   */
  deleteLocation(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.LOCATIONS, id)
    return apiHelpers.delete(endpoint)
  },
  
  /**
   * Get all locations for a specific edge
   * @param {string} edgeId - Edge ID
   * @returns {Promise} - Axios promise with locations data
   */
  getLocationsByEdge(edgeId) {
    const endpoint = collectionEndpoint(COLLECTIONS.LOCATIONS)
    const filter = `edge_id="${edgeId}"`
    
    return apiHelpers.getList(endpoint, { 
      filter,
      expand: 'edge',
      sort: 'created'
    })
    .then(response => {
      // Transform the response to match our expected format
      return { data: transformResponse(response.data) }
    })
  }
}
