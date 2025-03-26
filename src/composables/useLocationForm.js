// src/composables/useLocationForm.js
import { ref, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { 
  locationService, 
  locationTypes, 
  locationLevels, 
  locationZones,
  generateLocationCode, 
  validateLocationCode 
} from '../services'
import { edgeService } from '../services'

/**
 * Composable for location form handling
 * Manages form state, validation, and submission
 * 
 * @param {string} mode - 'create' or 'edit'
 * @returns {Object} - Form methods and state
 */
export function useLocationForm(mode = 'create') {
  const toast = useToast()
  const router = useRouter()
  
  // Form data with defaults
  const location = ref({
    id: '',
    edge_id: '',
    level: '',
    zone: '',
    identifier: '',
    code: '',
    name: '',
    type: '',
    path: '',
    description: '',
    metadata: {}
  })
  
  // Edges data for dropdown
  const edges = ref([])
  const edgesLoading = ref(false)
  
  // Loading state
  const loading = ref(false)
  
  // Define validation rules
  const rules = {
    name: { 
      required: helpers.withMessage('Name is required', required)
    },
    description: {}
  }
  
  // Add create-specific validation rules
  if (mode === 'create') {
    rules.edge_id = { required: helpers.withMessage('Edge is required', required) }
    rules.level = { required: helpers.withMessage('Level is required', required) }
    rules.zone = { required: helpers.withMessage('Zone is required', required) }
    rules.identifier = { required: helpers.withMessage('Identifier is required', required) }
    rules.code = { 
      required: helpers.withMessage('Code is required', required),
      validFormat: helpers.withMessage(
        'Code must follow format: [level]-[zone]-[identifier]', 
        validateLocationCode
      )
    }
    rules.type = { required: helpers.withMessage('Type is required', required) }
    rules.path = { required: helpers.withMessage('Path is required', required) }
  }
  
  // Initialize Vuelidate
  const v$ = useVuelidate(rules, location)
  
  /**
   * Fetch edges for the dropdown
   */
  const fetchEdges = async () => {
    edgesLoading.value = true
    try {
      const response = await edgeService.getEdges()
      edges.value = response.data.items || []
    } catch (error) {
      console.error('Error fetching edges:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load edges',
        life: 3000
      })
    } finally {
      edgesLoading.value = false
    }
  }
  
  /**
   * Load location data for editing
   * @param {Object} locationData - Location data to load
   */
  const loadLocation = (locationData) => {
    if (!locationData) return
    
    location.value = {
      id: locationData.id || '',
      edge_id: locationData.edge_id || '',
      level: locationData.level || '',
      zone: locationData.zone || '',
      identifier: locationData.identifier || '',
      code: locationData.code || '',
      name: locationData.name || '',
      type: locationData.type || '',
      path: locationData.path || '',
      description: locationData.description || '',
      metadata: locationData.metadata || {}
    }
  }
  
  /**
   * Generate location code when level, zone, or identifier changes
   */
  const updateCode = () => {
    if (location.value.level && location.value.zone && location.value.identifier) {
      location.value.code = generateLocationCode(
        location.value.level,
        location.value.zone,
        location.value.identifier
      )
      
      // Also update the path
      updatePathFromLevelZone()
    }
  }
  
  /**
   * Update path based on level, zone, and identifier
   */
  const updatePathFromLevelZone = () => {
    if (location.value.level && location.value.zone && location.value.identifier) {
      // Basic path structure: level/zone/identifier
      location.value.path = `${location.value.level}/${location.value.zone}/${location.value.identifier}`
    }
  }
  
  /**
   * Helper for displaying edge name in dropdown
   * @param {string} edgeId - Edge ID
   * @returns {string} - Edge name
   */
  const getEdgeName = (edgeId) => {
    const edge = edges.value.find(edge => edge.id === edgeId)
    return edge ? edge.name : edgeId
  }
  
  /**
   * Helper for displaying edge code in dropdown
   * @param {string} edgeId - Edge ID
   * @returns {string} - Edge code
   */
  const getEdgeCode = (edgeId) => {
    const edge = edges.value.find(edge => edge.id === edgeId)
    return edge ? edge.code : ''
  }
  
  /**
   * Handle form submission
   * @returns {Promise<boolean>} - Success status
   */
  const submitForm = async () => {
    // Validate form
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    loading.value = true
    
    try {
      // Extract relevant data for API
      const locationData = {
        edge_id: location.value.edge_id,
        code: location.value.code,
        name: location.value.name,
        type: location.value.type,
        path: location.value.path,
        description: location.value.description
      }
      
      let response
      
      if (mode === 'create') {
        // Create new location
        response = await locationService.createLocation(locationData)
        
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Location ${locationData.code} has been created`,
          life: 3000
        })
      } else {
        // Update existing location
        response = await locationService.updateLocation(location.value.id, locationData)
        
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Location ${location.value.code} has been updated`,
          life: 3000
        })
      }
      
      // Navigate to location detail view
      router.push({ name: 'location-detail', params: { id: response.data.id } })
      return true
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} location:`, error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to ${mode === 'create' ? 'create' : 'update'} location. Please try again.`,
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    location.value = {
      id: '',
      edge_id: '',
      level: '',
      zone: '',
      identifier: '',
      code: '',
      name: '',
      type: '',
      path: '',
      description: '',
      metadata: {}
    }
    v$.value.$reset()
  }
  
  // Watch for changes to level, zone, or identifier to update code
  watch([
    () => location.value.level, 
    () => location.value.zone, 
    () => location.value.identifier
  ], () => {
    updateCode()
  })
  
  return {
    location,
    v$,
    loading,
    edges,
    edgesLoading,
    locationTypes,
    locationLevels,
    locationZones,
    loadLocation,
    fetchEdges,
    updateCode,
    updatePathFromLevelZone,
    getEdgeName,
    getEdgeCode,
    submitForm,
    resetForm
  }
}
