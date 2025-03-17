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
    const filters = []
    if (params.location_id) {
      filters.push(`location_id="${params.location_id}"`)
    }
    if (params.edge_id) {
      // For edge filtering, we need to find locations in that edge
      filters.push(`edge_id="${params.edge_id}"`)
    }
    if (params.thing_type) {
      filters.push(`thing_type="${params.thing_type}"`)
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
    return apiHelpers.getList(`${endpoint}?expand=location`)
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
  }
}

/**
 * Thing types for dropdown options - EXPORT EXPLICITLY ADDED
 */
export const thingTypes = [
  { label: 'Reader', value: 'reader' },
  { label: 'Controller', value: 'controller' },
  { label: 'Lock', value: 'lock' },
  { label: 'Temperature Sensor', value: 'temperature-sensor' },
  { label: 'Humidity Sensor', value: 'humidity-sensor' },
  { label: 'HVAC Unit', value: 'hvac' },
  { label: 'Lighting Controller', value: 'lighting' },
  { label: 'Camera', value: 'camera' },
  { label: 'Motion Sensor', value: 'motion-sensor' },
  { label: 'Occupancy Sensor', value: 'occupancy-sensor' }
]

/**
 * Validate thing code format
 * @param {string} code - Thing code to validate
 * @returns {boolean} - True if valid
 */
export const validateThingCode = (code) => {
  if (!code) return false
  const pattern = /^[a-z]{3,4}-[a-z]+-\d{3,4}$/
  return pattern.test(code)
}

/**
 * Generate a thing code from type, location, and number
 * @param {string} type - Thing type abbreviation (e.g., rdr)
 * @param {string} location - Location identifier
 * @param {number} number - Sequence number
 * @returns {string} - Formatted thing code
 */
export const generateThingCode = (type, location, number) => {
  if (!type || !location || !number) return ''
  const paddedNumber = String(number).padStart(3, '0')
  return `${type}-${location}-${paddedNumber}`
}

/**
 * Convert thing type to abbreviation for code generation
 * @param {string} thingType - Thing type (e.g., 'reader')
 * @returns {string} - Abbreviation (e.g., 'rdr')
 */
export const getThingTypeAbbreviation = (thingType) => {
  const abbreviations = {
    'reader': 'rdr',
    'controller': 'ctrl',
    'lock': 'lock',
    'temperature-sensor': 'temp',
    'humidity-sensor': 'hum',
    'hvac': 'hvac',
    'lighting': 'light',
    'camera': 'cam',
    'motion-sensor': 'motion',
    'occupancy-sensor': 'occ'
  }
  
  return abbreviations[thingType] || thingType.substring(0, 3)
}
