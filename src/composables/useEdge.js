// src/composables/useEdge.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { edgeService, validateEdgeCode, generateEdgeCode } from '../services'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'

/**
 * Composable for edge-related functionality
 * Centralizes edge operations, formatting helpers, and navigation
 */
export function useEdge() {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performDelete } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Ensure edge types and regions are loaded
  typesStore.loadEdgeTypes()
  typesStore.loadEdgeRegions()
  
  // Common state
  const edges = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Edge types and regions from the store
  const edgeTypes = computed(() => typesStore.edgeTypes)
  const edgeRegions = computed(() => typesStore.edgeRegions)
  
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
   * @param {string} regionCode - Region code
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
   * Get CSS class for region badge
   * @param {string} regionCode - Region code
   * @returns {string} - CSS class
   */
  const getRegionClass = (regionCode) => {
    return typesStore.getEdgeRegionClass(regionCode)
  }
  
  /**
   * Get a summary of metadata for display
   * @param {Object} metadata - Metadata object
   * @returns {string} - Summary text
   */
  const getMetadataSummary = (metadata) => {
    if (!metadata || typeof metadata !== 'object') {
      return 'No metadata'
    }
    
    const keys = Object.keys(metadata)
    if (keys.length === 0) {
      return 'Empty metadata'
    }
    
    // Display a summary of the first few keys
    const displayKeys = keys.slice(0, 2)
    const summary = displayKeys.map(key => {
      const value = metadata[key]
      return `${key}: ${typeof value === 'object' ? '{...}' : value}`
    }).join(', ')
    
    return keys.length > 2 ? `${summary}, +${keys.length - 2} more` : summary
  }
  
  /**
   * Check if an edge has metadata
   * @param {Object} edge - Edge object
   * @returns {boolean} - True if metadata exists
   */
  const hasMetadata = (edge) => {
    return edge && 
           edge.metadata && 
           typeof edge.metadata === 'object' && 
           Object.keys(edge.metadata).length > 0
  }
  
  /**
   * Fetch all edges with optional filtering
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of edges
   */
  const fetchEdges = async (params = {}) => {
    return performOperation(
      () => edgeService.getList({ 
        withMetadata: true,
        sort: '-created',
        ...params
      }),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load edges',
        onSuccess: (response) => {
          edges.value = response.data.items || []
          return edges.value
        }
      }
    )
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
        entityIdentifier: code
      }
    )
  }
  
  /**
   * Open Grafana dashboard for an edge
   * @param {string} edgeId - Edge ID
   */
  const openInGrafana = (edgeId) => {
    const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'https://grafana.domain.com'
    const dashboardUrl = `${grafanaUrl}/d/edge-overview/edge-overview?var-edge_id=${edgeId}`
    window.open(dashboardUrl, '_blank')
  }
  
  // Navigation methods
  const navigateToEdgeList = () => router.push({ name: 'edges' })
  const navigateToEdgeDetail = (id) => router.push({ name: 'edge-detail', params: { id } })
  const navigateToEdgeEdit = (id) => router.push({ name: 'edit-edge', params: { id } })
  const navigateToEdgeCreate = () => router.push({ name: 'create-edge' })
  const navigateToLocations = (edgeId) => router.push({ name: 'locations', query: { edge: edgeId } })
  const navigateToThings = (edgeId) => router.push({ name: 'things', query: { edge: edgeId } })
  
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
    getMetadataSummary,
    hasMetadata,
    validateEdgeCode,
    generateEdgeCode,
    
    // Operations
    fetchEdges,
    fetchEdge,
    deleteEdge,
    openInGrafana,
    
    // Navigation
    navigateToEdgeList,
    navigateToEdgeDetail,
    navigateToEdgeEdit,
    navigateToEdgeCreate,
    navigateToLocations,
    navigateToThings
  }
}
