// src/composables/useEdgeForm.js
import { ref, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, helpers } from '@vuelidate/validators'
import { useRouter } from 'vue-router'
import { edgeService, validateEdgeCode, generateEdgeCode } from '../services'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'

/**
 * Composable for edge form handling
 * Manages form state, validation, and submission
 * 
 * @param {string} mode - 'create' or 'edit'
 * @returns {Object} - Form methods and state
 */
export function useEdgeForm(mode = 'create') {
  const router = useRouter()
  const { performOperation } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Load edge types and regions
  typesStore.loadEdgeTypes()
  typesStore.loadEdgeRegions()
  
  // Access edge types and regions from the store
  const edgeTypes = computed(() => typesStore.edgeTypes)
  const edgeRegions = computed(() => typesStore.edgeRegions)
  
  // Form data with defaults
  const edge = ref({
    id: '',
    type: '',
    region: '',
    number: null,
    code: '',
    name: '',
    description: '',
    active: true,
    metadata: {}
  })
  
  // Loading state
  const loading = ref(false)
  
  // Define validation rules
  const rules = {
    name: { 
      required: helpers.withMessage('Name is required', required),
      minLength: helpers.withMessage('Name must be at least 3 characters', minLength(3))
    },
    description: {}
  }
  
  // Add create-specific validation rules
  if (mode === 'create') {
    rules.type = { required: helpers.withMessage('Type is required', required) }
    rules.region = { required: helpers.withMessage('Region is required', required) }
    rules.number = { required: helpers.withMessage('Number is required', required) }
    rules.code = { 
      required: helpers.withMessage('Code is required', required),
      validFormat: helpers.withMessage(
        'Code must follow format: [type]-[region]-[number]', 
        validateEdgeCode
      )
    }
  }
  
  // Initialize Vuelidate
  const v$ = useVuelidate(rules, edge)
  
  /**
   * Load edge data for editing
   * @param {Object} edgeData - Edge data to load
   */
  const loadEdge = (edgeData) => {
    if (!edgeData) return
    
    edge.value = {
      id: edgeData.id || '',
      code: edgeData.code || '',
      type: edgeData.type || '',
      region: edgeData.region || '',
      name: edgeData.name || '',
      description: edgeData.description || '',
      active: edgeData.active ?? true,
      metadata: edgeData.metadata || {},
      number: extractNumberFromCode(edgeData.code)
    }
  }
  
  /**
   * Extract number part from edge code
   * @param {string} code - Edge code (format: type-region-number)
   * @returns {number|null} - Extracted number or null
   */
  const extractNumberFromCode = (code) => {
    if (!code) return null
    const parts = code.split('-')
    if (parts.length !== 3) return null
    
    const num = parseInt(parts[2], 10)
    return isNaN(num) ? null : num
  }
  
  /**
   * Generate edge code from type, region, and number
   */
  const updateCode = () => {
    if (edge.value.type && edge.value.region && edge.value.number) {
      edge.value.code = generateEdgeCode(
        edge.value.type,
        edge.value.region,
        edge.value.number
      )
    }
  }
  
  /**
   * Validate metadata to ensure it's proper JSON
   * This function can be called externally to validate before form submission
   * @param {Object|string} metadata - Metadata to validate (either object or JSON string)
   * @returns {Object} - Valid metadata object or empty object if invalid
   */
  const validateMetadata = (metadata) => {
    // If no metadata is provided, use the current edge metadata
    let metadataToValidate = metadata || edge.value.metadata
    
    // If metadata is already an object, it's valid
    if (typeof metadataToValidate === 'object' && metadataToValidate !== null) {
      return metadataToValidate;
    }
    
    // If it's a string, try to parse it
    if (typeof metadataToValidate === 'string') {
      try {
        return JSON.parse(metadataToValidate);
      } catch (e) {
        console.error("Invalid metadata JSON format:", e);
        return {};
      }
    }
    
    // Default to empty object for any other case
    return {};
  }

  /**
   * Handle form submission
   * @returns {Promise<boolean>} - Success status
   */
  const submitForm = async () => {
    // Validate form
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    // Ensure metadata is valid
    edge.value.metadata = validateMetadata(edge.value.metadata)
    
    // Extract relevant data for API
    const edgeData = {
      code: edge.value.code,
      name: edge.value.name,
      description: edge.value.description,
      active: edge.value.active,
      metadata: edge.value.metadata // Include metadata in API payload
    }
    
    // Add type and region for create mode
    if (mode === 'create') {
      edgeData.type = edge.value.type
      edgeData.region = edge.value.region
    }

    return performOperation(
      () => mode === 'create' 
        ? edgeService.create(edgeData)
        : edgeService.update(edge.value.id, edgeData),
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} edge`,
        successMessage: `Edge ${edge.value.code} has been ${mode === 'create' ? 'created' : 'updated'}`,
        onSuccess: (response) => {
          // Navigate to edge detail view
          router.push({ name: 'edge-detail', params: { id: response.data.id } })
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
    edge.value = {
      id: '',
      type: '',
      region: '',
      number: null,
      code: '',
      name: '',
      description: '',
      active: true,
      metadata: {}
    }
    v$.value.$reset()
  }
  
  return {
    edge,
    v$,
    loading,
    edgeTypes,
    edgeRegions,
    loadEdge,
    updateCode,
    submitForm,
    resetForm,
    validateMetadata
  }
}
