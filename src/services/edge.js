// Updated src/services/edge.js
import { apiHelpers } from './api'
import { 
  COLLECTIONS, 
  collectionEndpoint, 
  transformResponse,
  transformPaginationParams 
} from './pocketbase-config'

// Edge service with CRUD operations
export const edgeService = {
  /**
   * Get a paginated list of edges
   * @param {Object} params - Query parameters for pagination, sorting, filtering
   * @returns {Promise} - Axios promise with edges data
   */
  getEdges(params = {}) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES)
    const transformedParams = transformPaginationParams(params)
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        return { data: transformResponse(response.data) }
      })
  },

  /**
   * Get a single edge by ID
   * @param {string} id - Edge ID
   * @returns {Promise} - Axios promise with edge data
   */
  getEdge(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES, id)
    return apiHelpers.getById(endpoint)
  },

  /**
   * Create a new edge
   * @param {Object} edge - Edge data
   * @returns {Promise} - Axios promise with created edge
   */
  createEdge(edge) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES)
    return apiHelpers.create(endpoint, edge)
  },

  /**
   * Update an existing edge
   * @param {string} id - Edge ID
   * @param {Object} edge - Updated edge data
   * @returns {Promise} - Axios promise with updated edge
   */
  updateEdge(id, edge) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES, id)
    return apiHelpers.update(endpoint, null, edge)
  },

  /**
   * Delete an edge
   * @param {string} id - Edge ID
   * @returns {Promise} - Axios promise
   */
  deleteEdge(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES, id)
    return apiHelpers.delete(endpoint)
  }
}

/**
 * Edge regions for dropdown options
 */
export const edgeRegions = [
  { label: 'North America', value: 'na' },
  { label: 'Europe', value: 'eu' },
  { label: 'Asia Pacific', value: 'ap' },
  { label: 'South America', value: 'sa' },
  { label: 'Africa', value: 'af' },
  { label: 'Middle East', value: 'me' },
  { label: 'Australia', value: 'aus' }
]

/**
 * Edge types for dropdown options
 */
export const edgeTypes = [
  { label: 'Building', value: 'bld' },
  { label: 'Data Center', value: 'dc' },
  { label: 'Warehouse', value: 'wh' },
  { label: 'Campus', value: 'camp' }
]

/**
 * Validate edge code format: [type]-[region]-[number]
 * @param {string} code - Edge code to validate
 * @returns {boolean} - True if valid
 */
export const validateEdgeCode = (code) => {
  if (!code) return false
  const pattern = /^[a-z]{2,4}-[a-z]{2,4}-\d{3,4}$/
  return pattern.test(code)
}

/**
 * Generate an edge code from type, region, and number
 * @param {string} type - Edge type code
 * @param {string} region - Region code
 * @param {number} number - Sequence number
 * @returns {string} - Formatted edge code
 */
export const generateEdgeCode = (type, region, number) => {
  if (!type || !region || !number) return ''
  const paddedNumber = String(number).padStart(3, '0')
  return `${type}-${region}-${paddedNumber}`
}
