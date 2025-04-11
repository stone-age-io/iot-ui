// src/composables/useThingType.js
import { useTypeManagement } from './useTypeManagement'
import { thingTypeService } from '../services'

/**
 * Composable for thing type management
 * Provides thing type specific functionality
 */
export function useThingType() {
  // Route names for navigation
  const routeNames = {
    list: 'thing-types',
    detail: 'thing-type-detail',
    create: 'create-thing-type',
    edit: 'edit-thing-type'
  }
  
  // Use base type management composable
  const baseTypeManagement = useTypeManagement(
    thingTypeService,
    routeNames,
    'Thing Type'
  )
  
  // Get thing type options for dropdowns
  const getTypeOptions = async () => {
    try {
      return await thingTypeService.getTypeOptions()
    } catch (error) {
      console.error('Error fetching thing type options:', error)
      return []
    }
  }
  
  /**
   * Get abbreviated code for a thing type
   * @param {string} typeCode - Thing type code
   * @returns {string} - Abbreviated code
   */
  const getTypeAbbreviation = (typeCode) => {
    return thingTypeService.getTypeAbbreviation(typeCode)
  }
  
  /**
   * Get CSS class for thing type badge
   * @param {string} typeCode - Thing type code
   * @returns {string} - CSS class
   */
  const getTypeClass = (typeCode) => {
    switch (typeCode) {
      case 'reader': return 'bg-blue-100 text-blue-800'
      case 'controller': return 'bg-purple-100 text-purple-800'
      case 'lock': return 'bg-amber-100 text-amber-800'
      case 'temperature-sensor': return 'bg-green-100 text-green-800'
      case 'humidity-sensor': return 'bg-cyan-100 text-cyan-800'
      case 'hvac': return 'bg-teal-100 text-teal-800'
      case 'lighting': return 'bg-yellow-100 text-yellow-800'
      case 'camera': return 'bg-red-100 text-red-800'
      case 'motion-sensor': return 'bg-indigo-100 text-indigo-800'
      case 'occupancy-sensor': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  return {
    // Include all base functionality
    ...baseTypeManagement,
    
    // Additional thing type specific functionality
    getTypeOptions,
    getTypeAbbreviation,
    getTypeClass
  }
}
