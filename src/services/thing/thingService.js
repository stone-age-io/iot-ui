// src/services/thing/thingService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint 
} from '../pocketbase-config'

/**
 * Service for Thing entity operations
 */
export class ThingService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.THINGS, 
      collectionEndpoint,
      {
        jsonFields: ['metadata', 'current_state'],
        expandFields: ['location_id', 'edge_id']
      }
    )
  }
  
  /**
   * Get a paginated list of things
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with data
   */
  getThings(params = {}) {
    return this.getList(params)
      .then(response => {
        // Ensure thing_code and thing_type fields exist for forms
        if (response.data && response.data.items) {
          response.data.items = response.data.items.map(item => this.mapApiToFormFields(item))
        }
        return response
      })
  }
  
  /**
   * Get a single thing by ID
   * @param {string} id - Thing ID
   * @returns {Promise} - Axios promise with thing data
   */
  getThing(id) {
    return this.getById(id)
      .then(response => {
        // Ensure thing_code and thing_type fields exist for forms
        if (response.data) {
          response.data = this.mapApiToFormFields(response.data)
        }
        return response
      })
  }
  
  /**
   * Create a new thing
   * @param {Object} thing - Thing data
   * @returns {Promise} - Axios promise with created thing
   */
  createThing(thing) {
    // Map form fields to API fields before creating
    const apiData = this.mapFormToApiFields(thing)
    return this.create(apiData)
      .then(response => {
        // Map back to form fields for consistency
        if (response.data) {
          response.data = this.mapApiToFormFields(response.data)
        }
        return response
      })
  }
  
  /**
   * Update an existing thing
   * @param {string} id - Thing ID
   * @param {Object} thing - Updated thing data
   * @returns {Promise} - Axios promise with updated thing
   */
  updateThing(id, thing) {
    // Map form fields to API fields before updating
    const apiData = this.mapFormToApiFields(thing)
    return this.update(id, apiData)
      .then(response => {
        // Map back to form fields for consistency
        if (response.data) {
          response.data = this.mapApiToFormFields(response.data)
        }
        return response
      })
  }
  
  /**
   * Delete a thing
   * @param {string} id - Thing ID
   * @returns {Promise} - Axios promise
   */
  deleteThing(id) {
    return this.delete(id)
  }
  
  /**
   * Get all things for a specific location
   * @param {string} locationId - Location ID
   * @returns {Promise} - Axios promise with things data
   */
  getThingsByLocation(locationId) {
    return this.getList({ 
      location_id: locationId,
      sort: 'created'
    })
    .then(response => {
      // Ensure thing_code and thing_type fields exist for forms
      if (response.data && response.data.items) {
        response.data.items = response.data.items.map(item => this.mapApiToFormFields(item))
      }
      return response
    })
  }
  
  /**
   * Update thing current state
   * @param {string} id - Thing ID
   * @param {Object} state - State object to update or merge
   * @param {boolean} merge - If true, merge with existing state
   * @returns {Promise} - Axios promise with updated thing
   */
  updateThingState(id, state, merge = true) {
    // First get the current thing to access its state
    return this.getThing(id).then(response => {
      const thing = response.data
      let updatedState = state
      
      // If merge is true, merge the new state with the existing
      if (merge && thing.current_state) {
        updatedState = {
          ...thing.current_state,
          ...state
        }
      }
      
      // Update the last_seen timestamp
      const lastSeen = new Date().toISOString()
      
      // Only update the current_state and last_seen fields
      return this.update(id, { 
        current_state: updatedState,
        last_seen: lastSeen
      })
    })
  }
  
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
  
  /**
   * Map form fields to API fields
   * @param {Object} formData - Form data with thing_code and thing_type
   * @returns {Object} - API data with code and type
   */
  mapFormToApiFields(formData) {
    const apiData = { ...formData }
    
    // Map thing_code to code if present
    if (formData.thing_code !== undefined) {
      apiData.code = formData.thing_code
      delete apiData.thing_code
    }
    
    // Map thing_type to type if present
    if (formData.thing_type !== undefined) {
      apiData.type = formData.thing_type
      delete apiData.thing_type
    }
    
    return apiData
  }
  
  /**
   * Map API fields to form fields
   * @param {Object} apiData - API data with code and type
   * @returns {Object} - Form data with thing_code and thing_type
   */
  mapApiToFormFields(apiData) {
    const formData = { ...apiData }
    
    // Map code to thing_code for consistent form handling
    if (apiData.code !== undefined) {
      formData.thing_code = apiData.code
    }
    
    // Map type to thing_type for consistent form handling
    if (apiData.type !== undefined) {
      formData.thing_type = apiData.type
    }
    
    return formData
  }
  
  /**
   * Custom parameter transformation for thing specific filters
   * @override
   */
  transformParams(transformedParams, originalParams) {
    // Build filter based on params
    const filters = []
    if (originalParams.location_id) {
      filters.push(`location_id="${originalParams.location_id}"`)
    }
    if (originalParams.edge_id) {
      filters.push(`edge_id="${originalParams.edge_id}"`)
    }
    if (originalParams.type) {
      filters.push(`type="${originalParams.type}"`)
    }
    
    // If we have filters, add them to the params
    if (filters.length > 0) {
      transformedParams.filter = filters.join(' && ')
    }
  }
}

// Create instance
export const thingService = new ThingService()

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
