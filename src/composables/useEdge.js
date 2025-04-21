// src/composables/useEdge.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  edgeService, 
  validateEdgeCode, 
  generateEdgeCode
} from '../services'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'
import { useReactiveData } from './useReactiveData'

/**
 * Composable for edge-related functionality
 * Centralizes edge operations, formatting helpers, and navigation
 * Enhanced to use the reactive data cache system
 */
export function useEdge() {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performDelete } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Load edge types and regions
  typesStore.loadEdgeTypes()
  typesStore.loadEdgeRegions()
  
  // Common state
  const loading = ref(false)
  const error = ref(null)
  
  // Edge types and regions from the store
  const edgeTypes = computed(() => typesStore.edgeTypes)
  const edgeRegions = computed(() => typesStore.edgeRegions)
  
  // Set up reactive data from the cache store
  // This maintains backward compatibility while using the reactive cache
  const edgesData = useReactiveData({
    collection: 'edges',
    operation: 'list',
    fetchFunction: fetchEdgesRaw,
    processData: data => data?.items || []
  })
  
  // Expose edges as a computed property that returns from reactive cache
  const edges = computed(() => edgesData.data.value || [])
  
  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return dayjs(dateString).format('MMM D, YYYY HH:mm')
  }
  
  /**
   * Get edge type display name
   * @param {string} typeCode - Edge type code
   * @returns {string} - Display name
   */
  const getTypeName = (typeCode) => {
    return typesStore.getTypeName(typeCode, 'edgeTypes')
  }
  
  /**
   * Get edge region display name
   * @param {string} regionCode - Edge region code
   * @returns {string} - Display name
   */
  const getRegionName = (regionCode) => {
    return typesStore.getTypeName(regionCode, 'edgeRegions')
  }
  
  /**
   * Get CSS class for edge type badge
   * @param {string} typeCode - Edge type code
   * @returns {string} - CSS class
   */
  const getTypeClass = (typeCode) => {
    return typesStore.getEdgeTypeClass(typeCode)
  }
  
  /**
   * Get CSS class for edge region badge
   * @param {string} regionCode - Edge region code
   * @returns {string} - CSS class
   */
  const getRegionClass = (regionCode) => {
    return typesStore.getEdgeRegionClass(regionCode)
  }
  
  /**
   * Raw function to fetch edges - used internally by useReactiveData
   * @param {Object} options - Fetch options including skipCache flag
   * @returns {Promise<Object>} - Response from API
   */
  async function fetchEdgesRaw(options = {}) {
    return await edgeService.getList({
      ...options,
      skipCache: options?.skipCache
    })
  }
  
  /**
   * Fetch all edges with optional filtering
   * Maintains backward compatibility while using the reactive cache
   * 
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of edges
   */
  const fetchEdges = async (params = {}) => {
    // For regular fetch, delegate to the real API call through useReactiveData
    loading.value = true
    error.value = null
    
    try {
      // If user explicitly wants fresh data or provides filters
      const skipCache = params.skipCache || Object.keys(params).length > 0
      
      // Wait for the data to be fetched/refreshed
      await edgesData.refreshData(skipCache)
      
      // Return edges from reactive state
      return edges.value
    } catch (err) {
      console.error('Error in fetchEdges:', err)
      error.value = 'Failed to load edges'
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Fetch a single edge by ID
   * @param {string} id - Edge ID
   * @returns {Promise<Object>} - Edge data
   */
  const fetchEdge = async (id) => {
    if (!id) {
      error.value = 'Invalid edge ID'
      return null
    }
    
    return performOperation(
      () => edgeService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load edge details',
        collection: 'edges', // Specify collection for cache updates
        onSuccess: (response) => {
          // Parse metadata if it's a string
          if (response.data.metadata && typeof response.data.metadata === 'string') {
            try {
              response.data.metadata = JSON.parse(response.data.metadata)
            } catch (e) {
              console.warn('Failed to parse metadata for edge:', response.data.code)
              response.data.metadata = {}
            }
          }
          return response.data
        }
      }
    )
  }
  
  /**
   * Create a new edge
   * @param {Object} edge - Edge data
   * @returns {Promise<Object>} - Created edge
   */
  const createEdge = async (edge) => {
    return performOperation(
      () => edgeService.create(edge),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to create edge',
        successMessage: `Edge ${edge.code} has been created`,
        collection: 'edges', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Update an existing edge
   * @param {string} id - Edge ID
   * @param {Object} edge - Updated edge data
   * @returns {Promise<Object>} - Updated edge
   */
  const updateEdge = async (id, edge) => {
    return performOperation(
      () => edgeService.update(id, edge),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to update edge',
        successMessage: `Edge ${edge.code} has been updated`,
        collection: 'edges', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Delete an edge
   * @param {string} id - Edge ID
   * @param {string} code - Edge code for display
   * @returns {Promise<boolean>} - Success status
   */
  const deleteEdge = async (id, code) => {
    return performDelete(
      () => edgeService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to delete edge',
        entityName: 'Edge',
        entityIdentifier: code,
        collection: 'edges' // Specify collection for cache updates
      }
    )
  }
  
  /**
   * Update edge metadata
   * @param {string} id - Edge ID
   * @param {Object} metadata - Metadata to update or replace
   * @param {boolean} merge - Whether to merge with existing metadata
   * @returns {Promise<Object>} - Updated edge
   */
  const updateEdgeMetadata = async (id, metadata, merge = true) => {
    return performOperation(
      () => edgeService.updateEdgeMetadata(id, metadata, merge),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to update edge metadata',
        successMessage: 'Edge metadata has been updated',
        collection: 'edges', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  // Navigation methods
  const navigateToEdgeList = (query = {}) => router.push({ name: 'edges', query })
  const navigateToEdgeDetail = (id) => router.push({ name: 'edge-detail', params: { id } })
  const navigateToEdgeEdit = (id) => router.push({ name: 'edit-edge', params: { id } })
  const navigateToEdgeCreate = (query = {}) => router.push({ name: 'create-edge', query })
  const navigateToLocations = (edgeId) => router.push({ name: 'locations', query: { edge: edgeId } })
  const navigateToCreateLocation = (edgeId) => router.push({ name: 'create-location', query: { edge_id: edgeId } })
  
  return {
    // State
    edges,
    loading,
    error,
    edgeTypes,
    edgeRegions,
    
    // Helpers
    formatDate,
    getTypeName,
    getRegionName,
    getTypeClass,
    getRegionClass,
    validateEdgeCode,
    generateEdgeCode,
    
    // Operations
    fetchEdges,
    fetchEdge,
    createEdge,
    updateEdge,
    deleteEdge,
    updateEdgeMetadata,
    
    // Navigation
    navigateToEdgeList,
    navigateToEdgeDetail,
    navigateToEdgeEdit,
    navigateToEdgeCreate,
    navigateToLocations,
    navigateToCreateLocation
  }
}
