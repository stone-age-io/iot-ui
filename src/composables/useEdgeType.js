// src/composables/useEdgeType.js
import { useTypeManagement } from './useTypeManagement'
import { edgeTypeService } from '../services'

/**
 * Composable for edge type management
 * Provides edge type specific functionality
 */
export function useEdgeType() {
  // Route names for navigation
  const routeNames = {
    list: 'edge-types',
    detail: 'edge-type-detail',
    create: 'create-edge-type',
    edit: 'edit-edge-type'
  }
  
  // Use base type management composable
  const baseTypeManagement = useTypeManagement(
    edgeTypeService,
    routeNames,
    'Edge Type'
  )
  
  // Get edge type options for dropdowns
  const getTypeOptions = async () => {
    try {
      return await edgeTypeService.getTypeOptions()
    } catch (error) {
      console.error('Error fetching edge type options:', error)
      return []
    }
  }
  
  return {
    // Include all base functionality
    ...baseTypeManagement,
    
    // Additional edge type specific functionality
    getTypeOptions
  }
}
