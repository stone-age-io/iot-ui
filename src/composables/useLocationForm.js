// src/composables/useLocationForm.js
import { ref, computed, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useRouter, useRoute } from 'vue-router'
import { 
  locationService, 
  locationTypeOptions,
  generateLocationCode, 
  validateLocationCode,
  computeLocationPath
} from '../services'
import { edgeService } from '../services'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'
import { useToast } from 'primevue/usetoast'

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
  const toast = useToast()
  const { performOperation } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Load location types
  typesStore.loadLocationTypes()
  
  // Form data with defaults
  const location = ref({
    id: '',
    edge_id: route.query.edge_id || '',
    parent_id: route.query.parent_id || '', 
    type: '',    // Type like 'floor', 'room', etc.
    number: '',  // Number identifier like '1', '101', etc.
    code: '',    // Generated as {type}-{number}
    name: '',
    path: '',
    description: '',
    metadata: {} // JSON metadata object
  })
  
  // Metadata as a string for the form input
  const metadataString = ref('{}')
  
  // Metadata validation error
  const metadataError = ref(null)
  
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
    type: { 
      required: helpers.withMessage('Type is required', required)
    },
    number: { 
      required: helpers.withMessage('Number identifier is required', required)
    },
    description: {}
  }
  
  // Add create-specific validation rules
  if (mode === 'create') {
    rules.edge_id = { required: helpers.withMessage('Edge is required', required) }
    rules.code = { 
      required: helpers.withMessage('Code is required', required),
      validFormat: helpers.withMessage(
        'Code must follow format: {type}-{number}', 
        validateLocationCode
      )
    }
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
        sort: 'path',
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
   * Validate metadata JSON
   * @returns {boolean} - True if valid
   */
  const validateMetadata = () => {
    metadataError.value = null
    
    // Empty string is considered valid (empty object)
    if (!metadataString.value.trim()) {
      location.value.metadata = {}
      return true
    }
    
    try {
      const parsed = JSON.parse(metadataString.value)
      
      // Make sure it's an object (not an array or primitive)
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        metadataError.value = 'Metadata must be a valid JSON object'
        return false
      }
      
      // Store the parsed object
      location.value.metadata = parsed
      return true
    } catch (error) {
      metadataError.value = 'Invalid JSON format: ' + error.message
      return false
    }
  }
  
  /**
   * Update metadataString from location.metadata
   */
  const updateMetadataString = () => {
    try {
      metadataString.value = JSON.stringify(location.value.metadata || {}, null, 2)
    } catch (error) {
      console.error('Error stringifying metadata:', error)
      metadataString.value = '{}'
    }
  }
  
  /**
   * Load location data for editing
   * @param {Object} locationData - Location data to load
   */
  const loadLocation = (locationData) => {
    if (!locationData) return
    
    // Parse the location code into type and number
    const codeParts = parseLocationCode(locationData.code)
    
    location.value = {
      id: locationData.id || '',
      edge_id: locationData.edge_id || '',
      parent_id: locationData.parent_id || '',
      type: codeParts.type || '',
      number: codeParts.number || '',
      code: locationData.code || '',
      name: locationData.name || '',
      path: locationData.path || '',
      description: locationData.description || '',
      metadata: locationData.metadata || {}
    }
    
    // Update metadata string for the form
    updateMetadataString()
    
    // If in edit mode, fetch potential parents
    if (mode === 'edit' && locationData.id) {
      fetchPotentialParents(locationData.id)
    }
  }
  
  /**
   * Parse a location code into type and number parts
   * @param {string} code - Location code like 'floor-1' or 'room-101'
   * @returns {Object} - Object with type and number properties
   */
  const parseLocationCode = (code) => {
    if (!code) return { type: '', number: '' }
    
    // Find the last hyphen to split on
    const lastHyphenIndex = code.lastIndexOf('-')
    if (lastHyphenIndex === -1) return { type: code, number: '' }
    
    return {
      type: code.substring(0, lastHyphenIndex),
      number: code.substring(lastHyphenIndex + 1)
    }
  }
  
  /**
   * Generate location code when type or number changes
   */
  const updateCode = () => {
    if (location.value.type && location.value.number) {
      location.value.code = generateLocationCode(
        location.value.type,
        location.value.number
      )
      
      // Also update the path
      updatePath()
    }
  }
  
  /**
   * Update path based on parent-child relationship
   */
  const updatePath = () => {
    if (location.value.code) {
      // If has parent, path should be parent.path/location.code
      if (location.value.parent_id) {
        const parent = potentialParents.value.find(p => p.id === location.value.parent_id)
        if (parent) {
          location.value.path = computeLocationPath(parent.path, location.value.code)
          return
        }
      }
      
      // If no parent, path is just the code
      location.value.path = location.value.code
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
    // First validate metadata
    if (!validateMetadata()) {
      toast.add({
        severity: 'error',
        summary: 'Invalid Metadata',
        detail: metadataError.value,
        life: 5000
      })
      return false
    }
    
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
      path: location.value.path,
      description: location.value.description,
      metadata: location.value.metadata // Include metadata
    }
    
    // Store type info in metadata
    if (!locationData.metadata) locationData.metadata = {}
    locationData.metadata.type_info = {
      type: location.value.type,
      number: location.value.number
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
      type: '',
      number: '',
      code: '',
      name: '',
      path: '',
      description: '',
      metadata: {}
    }
    metadataString.value = '{}'
    metadataError.value = null
    v$.value.$reset()
    circularReferenceError.value = false
  }
  
  // Watch for changes to type or number to update code
  watch([
    () => location.value.type, 
    () => location.value.number
  ], () => {
    updateCode()
  })
  
  // Watch for changes to parent_id to update path and validate
  watch(() => location.value.parent_id, () => {
    updatePath()
    
    if (mode === 'edit' && location.value.id) {
      checkParentValidity()
    }
  })
  
  // Watch for metadataString changes to update location.metadata
  watch(metadataString, () => {
    validateMetadata()
  }, { debounce: 500 })
  
  return {
    location,
    metadataString,
    metadataError,
    v$,
    loading,
    edges,
    edgesLoading,
    potentialParents,
    parentsLoading,
    circularReferenceError,
    locationTypes,
    loadLocation,
    fetchEdges,
    fetchPotentialParents,
    updateCode,
    updatePath,
    getEdgeName,
    getEdgeCode,
    getParentDisplay,
    validateMetadata,
    updateMetadataString,
    submitForm,
    resetForm,
    parseLocationCode
  }
}
