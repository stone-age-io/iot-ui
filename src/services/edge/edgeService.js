// src/services/edge/edgeService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint 
} from '../pocketbase-config'

/**
 * Service for Edge entity operations
 */
export class EdgeService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.EDGES, 
      collectionEndpoint,
      {
        jsonFields: ['metadata'],
        expandFields: []
      }
    )
  }
  
  /**
   * Get a paginated list of edges with metadata
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with data
   */
  getEdges(params = {}) {
    return this.getList(params)
  }
  
  /**
   * Get a single edge by ID
   * @param {string} id - Edge ID
   * @returns {Promise} - Axios promise with edge data
   */
  getEdge(id) {
    return this.getById(id)
  }
  
  /**
   * Create a new edge
   * @param {Object} edge - Edge data
   * @returns {Promise} - Axios promise with created edge
   */
  createEdge(edge) {
    return this.create(edge)
  }
  
  /**
   * Update an existing edge
   * @param {string} id - Edge ID
   * @param {Object} edge - Updated edge data
   * @returns {Promise} - Axios promise with updated edge
   */
  updateEdge(id, edge) {
    return this.update(id, edge)
  }
  
  /**
   * Delete an edge
   * @param {string} id - Edge ID
   * @returns {Promise} - Axios promise
   */
  deleteEdge(id) {
    return this.delete(id)
  }
  
  /**
   * Update edge metadata
   * @param {string} id - Edge ID
   * @param {Object} metadata - Metadata object to update or replace
   * @param {boolean} merge - If true, merge with existing metadata
   * @returns {Promise} - Axios promise with updated edge
   */
  updateEdgeMetadata(id, metadata, merge = true) {
    // First get the current edge to access its metadata
    return this.getEdge(id).then(response => {
      const edge = response.data
      let updatedMetadata = metadata
      
      // If merge is true, merge the new metadata with the existing
      if (merge && edge.metadata) {
        updatedMetadata = {
          ...edge.metadata,
          ...metadata
        }
      }
      
      // Only update the metadata field
      return this.update(id, { metadata: updatedMetadata })
    })
  }
  
  /**
   * Custom parameter transformation for edge specific filters
   * @override
   */
  transformParams(transformedParams, originalParams) {
    // Add specific fields to expand or filter
    if (originalParams.withMetadata) {
      transformedParams.fields = 'id,code,name,type,region,metadata,created,updated,active,description'
    }
  }
}

// Create instance
export const edgeService = new EdgeService()

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
