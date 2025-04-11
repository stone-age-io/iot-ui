// src/composables/useEdgeRegion.js
import { useTypeManagement } from './useTypeManagement'
import { edgeRegionService } from '../services'

/**
 * Composable for edge region management
 * Provides edge region specific functionality
 */
export function useEdgeRegion() {
  // Route names for navigation
  const routeNames = {
    list: 'edge-regions',
    detail: 'edge-region-detail',
    create: 'create-edge-region',
    edit: 'edit-edge-region'
  }
  
  // Use base type management composable
  const baseTypeManagement = useTypeManagement(
    edgeRegionService,
    routeNames,
    'Edge Region'
  )
  
  // Get edge region options for dropdowns
  const getRegionOptions = async () => {
    try {
      return await edgeRegionService.getRegionOptions()
    } catch (error) {
      console.error('Error fetching edge region options:', error)
      return []
    }
  }
  
  return {
    // Include all base functionality
    ...baseTypeManagement,
    
    // Additional edge region specific functionality
    getRegionOptions
  }
}
