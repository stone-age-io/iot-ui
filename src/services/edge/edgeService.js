// src/services/edge/edgeService.js
import { BaseService } from '../base/BaseService'
import { 
  COLLECTIONS, 
  collectionEndpoint 
} from '../pocketbase-config'
import { edgeTypeService, edgeRegionService } from '../type/typeServices'

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
   * Update edge metadata
   * @param {string} id - Edge ID
   * @param {Object} metadata - Metadata object to update or replace
   * @param {boolean} merge - If true, merge with existing metadata
   * @returns {Promise} - Axios promise with updated edge
   */
  updateEdgeMetadata(id, metadata, merge = true) {
    // First get the current edge to access its metadata
    return this.getById(id).then(response => {
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
   * Get edge types from EdgeTypeService
   * @returns {Promise<Array>} - Array of edge type options
   */
  async getEdgeTypes() {
    return await edgeTypeService.getTypeOptions()
  }
  
  /**
   * Get edge regions from EdgeRegionService
   * @returns {Promise<Array>} - Array of edge region options
   */
  async getEdgeRegions() {
    return await edgeRegionService.getRegionOptions()
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
    
    // Add filter for type if provided
    if (originalParams.type) {
      transformedParams.filter = transformedParams.filter 
        ? `${transformedParams.filter} && type="${originalParams.type}"`
        : `type="${originalParams.type}"`
    }
    
    // Add filter for region if provided
    if (originalParams.region) {
      transformedParams.filter = transformedParams.filter 
        ? `${transformedParams.filter} && region="${originalParams.region}"`
        : `region="${originalParams.region}"`
    }
  }
}

// Create instance
export const edgeService = new EdgeService()

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

// Export edge types/regions references for backward compatibility
// These will now be loaded dynamically from the service
export const edgeTypes = []
export const edgeRegions = []

// Dynamic loading of edge types and regions
// We initialize them empty and will load them in components when needed
const initializeEdgeTypes = async () => {
  try {
    const types = await edgeService.getEdgeTypes()
    edgeTypes.splice(0, edgeTypes.length, ...types)
  } catch (error) {
    console.error('Error initializing edge types:', error)
  }
}

const initializeEdgeRegions = async () => {
  try {
    const regions = await edgeService.getEdgeRegions()
    edgeRegions.splice(0, edgeRegions.length, ...regions)
  } catch (error) {
    console.error('Error initializing edge regions:', error)
  }
}

// Initialize types and regions
initializeEdgeTypes()
initializeEdgeRegions()
