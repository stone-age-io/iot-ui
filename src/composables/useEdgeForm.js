// src/composables/useEdgeForm.js
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, helpers } from '@vuelidate/validators'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { edgeService, generateEdgeCode, validateEdgeCode } from '../services'

/**
 * Composable for edge form handling
 * Manages form state, validation, and submission
 * 
 * @param {string} mode - 'create' or 'edit'
 * @returns {Object} - Form methods and state
 */
export function useEdgeForm(mode = 'create') {
  const toast = useToast()
  const router = useRouter()
  
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
      metadata: edgeData.metadata || {}
    }
  }
  
  /**
   * Generate edge code when type, region, or number changes
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
      const edgeData = {
        code: edge.value.code,
        name: edge.value.name,
        description: edge.value.description,
        active: edge.value.active
      }
      
      // Add fields for create mode
      if (mode === 'create') {
        edgeData.type = edge.value.type
        edgeData.region = edge.value.region
      }
      
      let response
      
      if (mode === 'create') {
        // Create new edge
        response = await edgeService.createEdge(edgeData)
        
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Edge ${edgeData.code} has been created`,
          life: 3000
        })
      } else {
        // Update existing edge
        response = await edgeService.updateEdge(edge.value.id, edgeData)
        
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Edge ${edge.value.code} has been updated`,
          life: 3000
        })
      }
      
      // Navigate to edge detail view
      router.push({ name: 'edge-detail', params: { id: response.data.id } })
      return true
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} edge:`, error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to ${mode === 'create' ? 'create' : 'update'} edge. Please try again.`,
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
    loadEdge,
    updateCode,
    submitForm,
    resetForm
  }
}
