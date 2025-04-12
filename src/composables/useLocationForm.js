// src/composables/useLocationForm.js
import { ref, computed, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useRouter, useRoute } from 'vue-router'
import { 
  locationService, 
  locationLevels, 
  locationZones,
  generateLocationCode, 
  validateLocationCode 
} from '../services'
import { edgeService } from '../services'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'

/**
 * Composable for location form handling
 * Manages form state, validation, and submission
 * 
 * @param {string} mode - 'create' or 'edit'
 * @returns {Object} - Form methods and state
 */
export function useLocationForm(mode = 'create') {
  const router = useRouter()
  const route = useRoute()
  const { performOperation } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Load location types
  typesStore.loadLocationTypes()
  
  // Form data with defaults
  const location = ref({
    id: '',
    edge_id: route.query.edge_id || '',
    parent_id: route.query.parent_id || '', 
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
  
  // Location types from store
  const locationTypes = computed(() => typesStore.locationTypes)
  
  // Edges data for dropdown
  const edges = ref([])
  const edgesLoading = ref(false)
  
  // Parent locations data for dropdown
  const potentialParents = ref([])
  const parentsLoading = ref(false)
  const circularReferenceError = ref(false)
  
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
   * Fetch edges for dropdown
   * @param {Object} params - Optional query parameters
   */
  const fetchEdges = async (params = {}) => {
    return performOperation(
      () => {
        // If edge_id is provided as a query param, filter locations by edge
        const queryParams = {}
        if (route.query.edge_id) {
          queryParams.edge_id = route.query.edge_id
        }
        
        // Merge with any additional params
        Object.assign(queryParams, params)
        
        return edgeService.getList(queryParams)
      },
      {
        loadingRef: edgesLoading,
        errorRef: null,
        errorMessage: 'Failed to load edges',
        onSuccess: (response) => {
          edges.value = response.data.items || []
          return edges.value
        }
      }
    )
  }
  
  /**
   * Fetch potential parent locations for dropdown
   * @param {string} currentId - Current location ID (for edit mode to exclude self)
   */
  const fetchPotentialParents = async (currentId = null) => {
    return performOperation(
      () => locationService.getList({
        sort: 'name',
        expand: 'parent_id'
      }),
      {
        loadingRef: parentsLoading,
        errorRef: null,
        errorMessage: 'Failed to load potential parent locations',
        onSuccess: (response) => {
          // Filter out the current location (if in edit mode) and any children
          if (currentId) {
            // Remove self and any locations that have this one as a parent (direct children)
            potentialParents.value = (response.data.items || []).filter(loc => 
              loc.id !== currentId && loc.parent_id !== currentId
            )
          } else {
            potentialParents.value = response.data.items || []
          }
          return potentialParents.value
        }
      }
    )
  }
  
  /**
   * Check for circular references when selecting a parent
   * @param {string} parentId - Potential parent ID
   */
  const checkParentValidity = async () => {
    const currentId = location.value.id
    const parentId = location.value.parent_id
    
    // Skip check if we don't have both IDs
    if (!currentId || !parentId) {
      circularReferenceError.value = false
      return
    }
    
    return performOperation(
      () => locationService.isCircularReference(currentId, parentId),
      {
        loadingRef: false,
        errorRef: null,
        errorMessage: 'Error checking parent validity',
        onSuccess: (isCircular) => {
          circularReferenceError.value = isCircular
          
          if (isCircular) {
            toast.add({
              severity: 'warn',
              summary: 'Invalid Selection',
              detail: 'Cannot select this parent as it would create a circular reference',
              life: 5000
            })
          }
          
          return isCircular
        },
        onError: () => {
          // Default to false on error
          circularReferenceError.value = false
          return false
        }
      }
    )
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
      parent_id: locationData.parent_id || '',
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
    
    // If in edit mode, fetch potential parents
    if (mode === 'edit' && locationData.id) {
      fetchPotentialParents(locationData.id)
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
   * Helper for displaying parent location in dropdown
   * @param {string} parentId - Parent location ID
   * @returns {Object} - Parent location display info
   */
  const getParentDisplay = (parentId) => {
    const parent = potentialParents.value.find(loc => loc.id === parentId)
    if (!parent) return { name: '', code: '' }
    
    return {
      name: parent.name,
      code: parent.code
    }
  }
  
  /**
   * Handle form submission
   * @returns {Promise<boolean>} - Success status
   */
  const submitForm = async () => {
    // Check for circular references
    if (mode === 'edit' && location.value.parent_id) {
      await checkParentValidity()
      if (circularReferenceError.value) {
        return false
      }
    }
    
    // Validate form
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    // Extract relevant data for API
    const locationData = {
      edge_id: location.value.edge_id,
      parent_id: location.value.parent_id || '', // Include parent_id
      code: location.value.code,
      name: location.value.name,
      type: location.value.type,
      path: location.value.path,
      description: location.value.description
    }
    
    return performOperation(
      () => mode === 'create' 
        ? locationService.create(locationData)
        : locationService.update(location.value.id, locationData),
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} location`,
        successMessage: `Location ${location.value.code} has been ${mode === 'create' ? 'created' : 'updated'}`,
        onSuccess: (response) => {
          // Navigate to location detail view
          router.push({ name: 'location-detail', params: { id: response.data.id } })
          return true
        },
        onError: () => false
      }
    )
  }
  
  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    location.value = {
      id: '',
      edge_id: route.query.edge_id || '',
      parent_id: route.query.parent_id || '',
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
    circularReferenceError.value = false
  }
  
  // Watch for changes to level, zone, or identifier to update code
  watch([
    () => location.value.level, 
    () => location.value.zone, 
    () => location.value.identifier
  ], () => {
    updateCode()
  })
  
  // Watch for changes to parent_id to validate
  watch(() => location.value.parent_id, () => {
    if (mode === 'edit' && location.value.id) {
      checkParentValidity()
    }
  })
  
  return {
    location,
    v$,
    loading,
    edges,
    edgesLoading,
    potentialParents,
    parentsLoading,
    circularReferenceError,
    locationTypes,
    locationLevels,
    locationZones,
    loadLocation,
    fetchEdges,
    fetchPotentialParents,
    updateCode,
    updatePathFromLevelZone,
    getEdgeName,
    getEdgeCode,
    getParentDisplay,
    submitForm,
    resetForm
  }
}
