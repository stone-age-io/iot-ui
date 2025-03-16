import { apiHelpers } from './api'
import { 
  COLLECTIONS, 
  collectionEndpoint, 
  transformResponse,
  transformPaginationParams 
} from './pocketbase-config'

// Thing service with CRUD operations
export const thingService = {
  /**
   * Get a paginated list of things
   * @param {Object} params - Query parameters for pagination, sorting, filtering
   * @returns {Promise} - Axios promise with things data
   */
  getThings(params = {}) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS)
    const transformedParams = transformPaginationParams(params)
    
    // Build filter based on params
    let filters = []
    if (params.location_id) {
      filters.push(`location_id="${params.location_id}"`)
    }
    if (params.edge_id) {
      // For edge filtering, we need to find locations in that edge first
      // This would be handled differently in a real implementation
      // For now, we'll just pass the edge_id and handle it in the mock API
      filters.push(`edge_id="${params.edge_id}"`)
    }
    
    // Add expand parameter to include location data
    if (!transformedParams.expand) {
      transformedParams.expand = 'location'
    }
    
    // If we have filters, add them to the params
    if (filters.length > 0) {
      transformedParams.filter = filters.join(' && ')
    }
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        // Transform the response to match our expected format
        return { data: transformResponse(response.data) }
      })
  },

  /**
   * Get a single thing by ID
   * @param {string} id - Thing ID
   * @returns {Promise} - Axios promise with thing data
   */
  getThing(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS, id)
    // Add expand parameter to include location data
    return apiHelpers.getList(`${endpoint}?expand=location`);
  },

  /**
   * Create a new thing
   * @param {Object} thing - Thing data
   * @returns {Promise} - Axios promise with created thing
   */
  createThing(thing) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS)
    return apiHelpers.create(endpoint, thing)
  },

  /**
   * Update an existing thing
   * @param {string} id - Thing ID
   * @param {Object} thing - Updated thing data
   * @returns {Promise} - Axios promise with updated thing
   */
  updateThing(id, thing) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS, id)
    return apiHelpers.update(endpoint, null, thing)
  },

  /**
   * Delete a thing
   * @param {string} id - Thing ID
   * @returns {Promise} - Axios promise
   */
  deleteThing(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS, id)
    return apiHelpers.delete(endpoint)
  },
  
  /**
   * Get all things for a specific location
   * @param {string} locationId - Location ID
   * @returns {Promise} - Axios promise with things data
   */
  getThingsByLocation(locationId) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS)
    const filter = `location_id="${locationId}"`
    
    return apiHelpers.getList(endpoint, { 
      filter,
      expand: 'location',
      sort: 'created'
    })
    .then(response => {
      // Transform the response to match our expected format
      return { data: transformResponse(response.data) }
    })
  },
  
  /**
   * Get all things for a specific edge
   * @param {string} edgeId - Edge ID
   * @returns {Promise} - Axios promise with things data
   */
  getThingsByEdge(edgeId) {
    // This is a more complex query that would typically be handled by the backend
    // In a real implementation, we might have a dedicated API endpoint for this
    // For now, we'll just pass the edge_id parameter and handle it in the mock API
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS)
    return apiHelpers.getList(endpoint, { 
      filter: `edge_id="${edgeId}"`,
      expand: 'location'
    })
    .then(response => {
      // Transform the response to match our expected format
      return { data: transformResponse(response.data) }
    })
  }
}
