// src/composables/useLocationType.js
import { useTypeManagement } from './useTypeManagement'
import { locationTypeService } from '../services'

/**
 * Composable for location type management
 * Provides location type specific functionality
 */
export function useLocationType() {
  // Route names for navigation
  const routeNames = {
    list: 'location-types',
    detail: 'location-type-detail',
    create: 'create-location-type',
    edit: 'edit-location-type'
  }
  
  // Use base type management composable
  const baseTypeManagement = useTypeManagement(
    locationTypeService,
    routeNames,
    'Location Type'
  )
  
  // Get location type options for dropdowns
  const getTypeOptions = async () => {
    try {
      return await locationTypeService.getTypeOptions()
    } catch (error) {
      console.error('Error fetching location type options:', error)
      return []
    }
  }
  
  /**
   * Get CSS class for location type badge
   * @param {string} typeCode - Location type code
   * @returns {string} - CSS class
   */
  const getTypeClass = (typeCode) => {
    // Simplified mapping - can be extended with more types
    switch (typeCode) {
      case 'entrance': return 'bg-blue-100 text-blue-800'
      case 'work-area': return 'bg-green-100 text-green-800'
      case 'meeting-room': return 'bg-purple-100 text-purple-800'
      case 'break-area': return 'bg-amber-100 text-amber-800'
      case 'reception': return 'bg-indigo-100 text-indigo-800'
      case 'security': return 'bg-red-100 text-red-800'
      case 'server-room': return 'bg-cyan-100 text-cyan-800'
      case 'utility-room': return 'bg-teal-100 text-teal-800'
      case 'storage': return 'bg-gray-100 text-gray-800'
      case 'entrance-hall': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  return {
    // Include all base functionality
    ...baseTypeManagement,
    
    // Additional location type specific functionality
    getTypeOptions,
    getTypeClass
  }
}
