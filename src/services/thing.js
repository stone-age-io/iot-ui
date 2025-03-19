// src/services/thing.js - Updated for indoor positioning
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
    
    // Add expand parameters to include location and edge data
    transformedParams.expand = 'location_id,edge_id'
    
    // Build filter based on params
    const filters = []
    if (params.location_id) {
      filters.push(`location_id="${params.location_id}"`)
    }
    if (params.edge_id) {
      filters.push(`edge_id="${params.edge_id}"`)
    }
    if (params.type) {
      filters.push(`type="${params.type}"`)
    }
    
    // If we have filters, add them to the params
    if (filters.length > 0) {
      transformedParams.filter = filters.join(' && ')
    }
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        // Parse metadata and current_state if needed
        const data = transformResponse(response.data)
        if (data.items && data.items.length > 0) {
          data.items = data.items.map(item => {
            // Parse metadata if it's a string
            if (item.metadata && typeof item.metadata === 'string') {
              try {
                item.metadata = JSON.parse(item.metadata)
              } catch (e) {
                console.warn('Failed to parse metadata for thing:', item.code)
                item.metadata = {}
              }
            }
            
            // Parse current_state if it's a string
            if (item.current_state && typeof item.current_state === 'string') {
              try {
                item.current_state = JSON.parse(item.current_state)
              } catch (e) {
                console.warn('Failed to parse current_state for thing:', item.code)
                item.current_state = {}
              }
            }
            
            return item
          })
        }
        
        return { data }
      })
  },

  /**
   * Get a single thing by ID
   * @param {string} id - Thing ID
   * @returns {Promise} - Axios promise with thing data
   */
  getThing(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS, id)
    // Add expand parameter to include location and edge data
    return apiHelpers.getById(`${endpoint}?expand=location_id,edge_id`)
      .then(response => {
        // Parse metadata and current_state if needed
        if (response.data) {
          if (response.data.metadata && typeof response.data.metadata === 'string') {
            try {
              response.data.metadata = JSON.parse(response.data.metadata)
            } catch (e) {
              console.warn('Failed to parse metadata for thing:', response.data.thing_code)
              response.data.metadata = {}
            }
          }
          
          if (response.data.current_state && typeof response.data.current_state === 'string') {
            try {
              response.data.current_state = JSON.parse(response.data.current_state)
            } catch (e) {
              console.warn('Failed to parse current_state for thing:', response.data.thing_code)
              response.data.current_state = {}
            }
          }
        }
        
        return response
      })
  },

  /**
   * Create a new thing
   * @param {Object} thing - Thing data
   * @returns {Promise} - Axios promise with created thing
   */
  createThing(thing) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS)
    
    // Process thing data before sending to API
    const thingData = { ...thing }
    
    // Convert JSON objects to strings
    if (thingData.metadata && typeof thingData.metadata === 'object') {
      thingData.metadata = JSON.stringify(thingData.metadata)
    }
    
    if (thingData.current_state && typeof thingData.current_state === 'object') {
      thingData.current_state = JSON.stringify(thingData.current_state)
    }
    
    return apiHelpers.create(endpoint, thingData)
  },

  /**
   * Update an existing thing
   * @param {string} id - Thing ID
   * @param {Object} thing - Updated thing data
   * @returns {Promise} - Axios promise with updated thing
   */
  updateThing(id, thing) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS, id)
    
    // Process thing data before sending to API
    const thingData = { ...thing }
    
    // Convert JSON objects to strings
    if (thingData.metadata && typeof thingData.metadata === 'object') {
      thingData.metadata = JSON.stringify(thingData.metadata)
    }
    
    if (thingData.current_state && typeof thingData.current_state === 'object') {
      thingData.current_state = JSON.stringify(thingData.current_state)
    }
    
    return apiHelpers.update(endpoint, null, thingData)
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
      expand: 'location_id,edge_id',
      sort: 'created'
    })
    .then(response => {
      // Parse metadata and current_state if needed
      const data = transformResponse(response.data)
      if (data.items && data.items.length > 0) {
        data.items = data.items.map(item => {
          // Parse metadata if it's a string
          if (item.metadata && typeof item.metadata === 'string') {
            try {
              item.metadata = JSON.parse(item.metadata)
            } catch (e) {
              console.warn('Failed to parse metadata for thing:', item.thing_code)
              item.metadata = {}
            }
          }
          
          // Parse current_state if it's a string
          if (item.current_state && typeof item.current_state === 'string') {
            try {
              item.current_state = JSON.parse(item.current_state)
            } catch (e) {
              console.warn('Failed to parse current_state for thing:', item.thing_code)
              item.current_state = {}
            }
          }
          
          return item
        })
      }
      
      return { data }
    })
  },
  
  /**
   * Update thing current state
   * @param {string} id - Thing ID
   * @param {Object} state - State object to update or merge
   * @param {boolean} merge - If true, merge with existing state
   * @returns {Promise} - Axios promise with updated thing
   */
  updateThingState(id, state, merge = true) {
    const endpoint = collectionEndpoint(COLLECTIONS.THINGS, id)
    
    // First get the current thing to access its state
    return this.getThing(id).then(response => {
      const thing = response.data
      let updatedState = state
      
      // If merge is true, merge the new state with the existing
      if (merge && thing.current_state) {
        updatedState = {
          ...(typeof thing.current_state === 'object' ? thing.current_state : {}),
          ...state
        }
      }
      
      // Convert to string for PocketBase storage
      const stateString = JSON.stringify(updatedState)
      
      // Update the last_seen timestamp
      const lastSeen = new Date().toISOString()
      
      // Only update the current_state and last_seen fields
      return apiHelpers.update(endpoint, null, { 
        current_state: stateString,
        last_seen: lastSeen
      })
    })
  },
  
  /**
   * Update thing indoor position coordinates
   * @param {string} id - Thing ID
   * @param {Object} coordinates - x,y coordinates on the floor plan
   * @returns {Promise} - Axios promise with updated thing
   */
  updateThingPosition(id, coordinates) {
    return this.getThing(id).then(response => {
      const thing = response.data
      
      // Create or update metadata
      let metadata = thing.metadata || {}
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata)
        } catch (e) {
          metadata = {}
        }
      }
      
      // Set coordinates
      metadata.coordinates = {
        ...metadata.coordinates,
        x: coordinates.x,
        y: coordinates.y
      }
      
      // Update thing with new metadata
      return this.updateThing(id, { metadata })
    })
  }
}

/**
 * Thing types for dropdown options
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
