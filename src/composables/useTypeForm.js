// src/composables/useTypeForm.js
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

/**
 * Composable for type form handling
 * Manages form state, validation, and submission for type entities
 * 
 * @param {Object} typeService - Service for type operations
 * @param {Object} options - Form options
 * @param {string} options.mode - 'create' or 'edit'
 * @param {string} options.entityName - Display name for the entity
 * @param {Object} options.routeNames - Route names for navigation
 * @param {Function} options.validateCode - Function to validate code format
 * @returns {Object} - Form methods and state
 */
export function useTypeForm(typeService, options) {
  const toast = useToast()
  const router = useRouter()
  
  const { 
    mode = 'create', 
    entityName, 
    routeNames, 
    validateCode = null 
  } = options || {}
  
  // Form data with defaults
  const type = ref({
    id: '',
    type: '',
    code: '',
    description: ''
  })
  
  // Loading state
  const loading = ref(false)
  
  // Define validation rules
  const rules = {
    type: { 
      required: helpers.withMessage(`${entityName} name is required`, required)
    },
    description: {}
  }
  
  // Add create-specific validation rules
  if (mode === 'create') {
    rules.code = { 
      required: helpers.withMessage('Code is required', required)
    }
    
    // Add code format validation if provided
    if (validateCode) {
      rules.code.validFormat = helpers.withMessage(
        'Invalid code format',
        validateCode
      )
    }
  }
  
  // Initialize Vuelidate
  const v$ = useVuelidate(rules, type)
  
  /**
   * Load type data for editing
   * @param {Object} typeData - Type data to load
   */
  const loadType = (typeData) => {
    if (!typeData) return
    
    type.value = {
      id: typeData.id || '',
      type: typeData.type || '',
      code: typeData.code || '',
      description: typeData.description || ''
    }
  }
  
  /**
   * Generate a code based on the type name
   * For creating suggested codes
   */
  const generateCode = () => {
    if (!type.value.type) return
    
    // Generate code from type
    // Convert to lowercase, remove special chars, replace spaces with hyphens
    const baseCode = type.value.type
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    
    // For edge types and regions, abbreviate to 2-4 chars
    if (entityName === 'Edge Type' || entityName === 'Edge Region') {
      // Generate abbreviation (first chars of words or first 3-4 chars)
      const words = type.value.type.split(/\s+/)
      if (words.length > 1) {
        // Multiple words - use first letter of each word
        type.value.code = words.map(w => w[0].toLowerCase()).join('')
      } else {
        // Single word - use first 3-4 chars
        type.value.code = baseCode.substring(0, Math.min(4, baseCode.length))
      }
    } else {
      // For location and thing types, use kebab-case
      type.value.code = baseCode
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
      const typeData = {
        type: type.value.type,
        code: type.value.code,
        description: type.value.description
      }
      
      let response
      
      if (mode === 'create') {
        // Create new type
        response = await typeService.createType(typeData)
        
        if (!response) {
          return false
        }
        
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `${entityName} "${typeData.type}" has been created`,
          life: 3000
        })
      } else {
        // Update existing type
        response = await typeService.updateType(type.value.id, typeData)
        
        if (!response) {
          return false
        }
        
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `${entityName} "${type.value.type}" has been updated`,
          life: 3000
        })
      }
      
      // Navigate to type list view
      router.push({ name: routeNames.list })
      return true
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} ${entityName.toLowerCase()}:`, error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to ${mode === 'create' ? 'create' : 'update'} ${entityName.toLowerCase()}. Please try again.`,
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
    type.value = {
      id: '',
      type: '',
      code: '',
      description: ''
    }
    v$.value.$reset()
  }
  
  return {
    type,
    v$,
    loading,
    loadType,
    generateCode,
    submitForm,
    resetForm
  }
}
