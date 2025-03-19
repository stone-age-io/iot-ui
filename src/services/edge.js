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
   * Get a paginated list of edges with metadata
   * @param {Object} params - Query parameters for pagination, sorting, filtering
   * @returns {Promise} - Axios promise with edges data
   */
  getEdges(params = {}) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES)
    const transformedParams = transformPaginationParams(params)
    
    // Add specific fields to expand or filter
    if (params.withMetadata) {
      transformedParams.fields = 'id,code,name,type,region,metadata,created,updated,active,description'
    }
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        // Transform the response to match our expected format
        const data = transformResponse(response.data)
        
        // Parse metadata JSON if needed
        if (data.items && data.items.length > 0) {
          data.items = data.items.map(item => {
            if (item.metadata && typeof item.metadata === 'string') {
              try {
                item.metadata = JSON.parse(item.metadata)
              } catch (e) {
                console.warn('Failed to parse metadata for edge:', item.code)
                item.metadata = {}
              }
            }
            return item
          })
        }
        
        return { data }
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
      .then(response => {
        // Parse metadata if needed
        if (response.data && response.data.metadata && typeof response.data.metadata === 'string') {
          try {
            response.data.metadata = JSON.parse(response.data.metadata)
          } catch (e) {
            console.warn('Failed to parse metadata for edge:', response.data.code)
            response.data.metadata = {}
          }
        }
        return response
      })
  },

  /**
   * Create a new edge
   * @param {Object} edge - Edge data
   * @returns {Promise} - Axios promise with created edge
   */
  createEdge(edge) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES)
    
    // Process edge data before sending to API
    const edgeData = { ...edge }
    
    // Convert metadata to string if it's an object
    if (edgeData.metadata && typeof edgeData.metadata === 'object') {
      edgeData.metadata = JSON.stringify(edgeData.metadata)
    }
    
    return apiHelpers.create(endpoint, edgeData)
  },

  /**
   * Update an existing edge
   * @param {string} id - Edge ID
   * @param {Object} edge - Updated edge data
   * @returns {Promise} - Axios promise with updated edge
   */
  updateEdge(id, edge) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES, id)
    
    // Process edge data before sending to API
    const edgeData = { ...edge }
    
    // Convert metadata to string if it's an object
    if (edgeData.metadata && typeof edgeData.metadata === 'object') {
      edgeData.metadata = JSON.stringify(edgeData.metadata)
    }
    
    return apiHelpers.update(endpoint, null, edgeData)
  },

  /**
   * Delete an edge
   * @param {string} id - Edge ID
   * @returns {Promise} - Axios promise
   */
  deleteEdge(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES, id)
    return apiHelpers.delete(endpoint)
  },
  
  /**
   * Update edge metadata
   * @param {string} id - Edge ID
   * @param {Object} metadata - Metadata object to update or replace
   * @param {boolean} merge - If true, merge with existing metadata
   * @returns {Promise} - Axios promise with updated edge
   */
  updateEdgeMetadata(id, metadata, merge = true) {
    const endpoint = collectionEndpoint(COLLECTIONS.EDGES, id)
    
    // First get the current edge to access its metadata
    return this.getEdge(id).then(response => {
      const edge = response.data
      let updatedMetadata = metadata
      
      // If merge is true, merge the new metadata with the existing
      if (merge && edge.metadata) {
        updatedMetadata = {
          ...(typeof edge.metadata === 'object' ? edge.metadata : {}),
          ...metadata
        }
      }
      
      // Convert to string for PocketBase storage
      const metadataString = JSON.stringify(updatedMetadata)
      
      // Only update the metadata field
      return apiHelpers.update(endpoint, null, { metadata: metadataString })
    })
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
