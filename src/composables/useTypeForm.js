// src/composables/useTypeForm.js
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useRouter } from 'vue-router'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'

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
  const router = useRouter()
  const { performOperation } = useApiOperation()
  const typesStore = useTypesStore()
  
  const { 
    mode = 'create', 
    entityName, 
    routeNames, 
    validateCode = null 
  } = options || {}
  
  // Determine which store collection to refresh
  const storeCollectionName = getStoreCollectionName(entityName)
  
  /**
   * Determine the store collection name based on entity name
   * @param {string} name - Entity name (Edge Type, Location Type, etc.)
   * @returns {string} - Store collection name
   */
  function getStoreCollectionName(name) {
    if (name.includes('Edge Type')) return 'edgeTypes'
    if (name.includes('Edge Region')) return 'edgeRegions' 
    if (name.includes('Location Type')) return 'locationTypes'
    if (name.includes('Thing Type')) return 'thingTypes'
    return null
  }
  
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
    
    const typeData = {
      type: type.value.type,
      code: type.value.code,
      description: type.value.description
    }
    
    // Use appropriate operation based on mode
    const operation = mode === 'create' 
      ? async () => {
          // Check if code is already in use
          const isCodeInUse = await typeService.isCodeInUse(typeData.code)
          
          if (isCodeInUse) {
            throw new Error(`Code "${typeData.code}" is already in use. Please choose a different code.`)
          }
          
          return typeService.createType(typeData)
        }
      : async () => {
          // Check if code is already in use (excluding current type)
          if (typeData.code) {
            const isCodeInUse = await typeService.isCodeInUse(typeData.code, type.value.id)
            
            if (isCodeInUse) {
              throw new Error(`Code "${typeData.code}" is already in use. Please choose a different code.`)
            }
          }
          
          return typeService.updateType(type.value.id, typeData)
        }
    
    return performOperation(
      operation,
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} ${entityName.toLowerCase()}`,
        successMessage: `${entityName} "${type.value.type}" has been ${mode === 'create' ? 'created' : 'updated'}`,
        collection: storeCollectionName ? `${storeCollectionName.toLowerCase()}` : null,
        onSuccess: async (response) => {
          // Refresh the types store collection to make the updated type immediately available
          if (storeCollectionName) {
            await typesStore.refreshTypeCollection(storeCollectionName)
          }
          
          // Navigate to type list view
          router.push({ name: routeNames.list })
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
