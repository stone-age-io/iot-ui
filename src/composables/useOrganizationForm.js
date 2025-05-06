// src/composables/useOrganizationForm.js
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers, alphaNum } from '@vuelidate/validators'
import { useRouter } from 'vue-router'
import { organizationService } from '../services/organization/organizationService'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for organization form handling
 * Manages form state, validation, and submission
 * 
 * @param {string} mode - 'create' or 'edit'
 * @returns {Object} - Form methods and state
 */
export function useOrganizationForm(mode = 'create') {
  const router = useRouter()
  const { performOperation } = useApiOperation()
  
  // Form data with defaults
  const organization = ref({
    id: '',
    name: '',
    code: '',
    description: '',
    settings: {}
  })
  
  // Loading state
  const loading = ref(false)
  
  // Define validation rules
  const rules = {
    name: { 
      required: helpers.withMessage('Name is required', required)
    },
    code: { 
      required: helpers.withMessage('Code is required', required),
      alphaNum: helpers.withMessage('Code can only contain letters and numbers', alphaNum)
    },
    description: {}
  }
  
  // Initialize Vuelidate
  const v$ = useVuelidate(rules, organization)
  
  /**
   * Load organization data for editing
   * @param {Object} organizationData - Organization data to load
   */
  const loadOrganization = (organizationData) => {
    if (!organizationData) return
    
    organization.value = {
      id: organizationData.id || '',
      name: organizationData.name || '',
      code: organizationData.code || '',
      description: organizationData.description || '',
      settings: organizationData.settings || {}
    }
  }
  
  /**
   * Generate organization code from name
   */
  const generateCode = () => {
    if (!organization.value.name) return
    
    // Generate code from name (lowercase, no spaces, alphanumeric only)
    const baseCode = organization.value.name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
    
    organization.value.code = baseCode
  }
  
  /**
   * Handle form submission
   * @returns {Promise<boolean>} - Success status
   */
  const submitForm = async () => {
    // Validate form
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    return performOperation(
      () => mode === 'create' 
        ? organizationService.create(organization.value)
        : organizationService.update(organization.value.id, organization.value),
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} organization`,
        successMessage: `Organization ${organization.value.name} has been ${mode === 'create' ? 'created' : 'updated'}`,
        onSuccess: (response) => {
          // Navigate to organization detail or list
          router.push({ name: mode === 'create' ? 'organizations' : 'organization-detail', params: { id: response.data.id } })
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
    organization.value = {
      id: '',
      name: '',
      code: '',
      description: '',
      settings: {}
    }
    v$.value.$reset()
  }
  
  /**
   * Validate organization settings to ensure it's proper JSON
   * @param {Object|string} settings - Settings to validate (either object or JSON string)
   * @returns {Object} - Valid settings object or empty object if invalid
   */
  const validateSettings = (settings) => {
    // If no settings provided, use the current organization settings
    let settingsToValidate = settings || organization.value.settings
    
    // If settings is already an object, it's valid
    if (typeof settingsToValidate === 'object' && settingsToValidate !== null) {
      return settingsToValidate;
    }
    
    // If it's a string, try to parse it
    if (typeof settingsToValidate === 'string') {
      try {
        return JSON.parse(settingsToValidate);
      } catch (e) {
        console.error("Invalid settings JSON format:", e);
        return {};
      }
    }
    
    // Default to empty object for any other case
    return {};
  }
  
  return {
    organization,
    v$,
    loading,
    loadOrganization,
    generateCode,
    submitForm,
    resetForm,
    validateSettings
  }
}
