// src/composables/useThingForm.js
import { ref, computed, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useToast } from 'primevue/usetoast'
import { useRouter, useRoute } from 'vue-router'
import { 
  thingService, 
  locationService,
  generateThingCode, 
  validateThingCode, 
  getThingTypeAbbreviation 
} from '../services'

/**
 * Composable for thing form handling
 * Manages form state, validation, and submission
 * 
 * @param {string} mode - 'create' or 'edit'
 * @returns {Object} - Form methods and state
 */
export function useThingForm(mode = 'create') {
  const toast = useToast()
  const router = useRouter()
  const route = useRoute()
  
  // Form data with defaults
  const thing = ref({
    id: '',
    location_id: route.query.location_id || '',
    thing_type: '',
    number: null,
    thing_code: '',
    name: '',
    description: '',
    active: true,
    metadata: {}
  })
  
  // Locations data for dropdown
  const locations = ref([])
  const locationsLoading = ref(false)
  const selectedLocationCode = ref('')
  
  // Loading state
  const loading = ref(false)
  
  // Define validation rules
  const rules = {
    name: { required: helpers.withMessage('Name is required', required) },
    description: {}
  }
  
  // Add create-specific validation rules
  if (mode === 'create') {
    rules.location_id = { required: helpers.withMessage('Location is required', required) }
    rules.thing_type = { required: helpers.withMessage('Thing type is required', required) }
    rules.number = { required: helpers.withMessage('Number is required', required) }
    rules.thing_code = { 
      required: helpers.withMessage('Code is required', required),
      validFormat: helpers.withMessage(
        'Code must follow format: [type]-[location]-[number]', 
        validateThingCode
      )
    }
  }
  
  // Initialize Vuelidate
  const v$ = useVuelidate(rules, thing)
  
  /**
   * Fetch locations for dropdown
   * @param {Object} params - Optional query parameters
   */
  const fetchLocations = async (params = {}) => {
    locationsLoading.value = true
    try {
      // If edge_id is provided as a query param, filter locations by edge
      const queryParams = {}
      if (route.query.edge_id) {
        queryParams.edge_id = route.query.edge_id
      }
      
      // Merge with any additional params
      Object.assign(queryParams, params)
      
      const response = await locationService.getLocations(queryParams)
      locations.value = response.data.items || []
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load locations',
        life: 3000
      })
    } finally {
      locationsLoading.value = false
    }
  }
  
  /**
   * Load thing data for editing
   * @param {Object} thingData - Thing data to load
   */
  const loadThing = (thingData) => {
    if (!thingData) return
    
    thing.value = {
      id: thingData.id || '',
      location_id: thingData.location_id || '',
      thing_type: thingData.thing_type || '',
      thing_code: thingData.thing_code || '',
      name: thingData.name || '',
      description: thingData.description || '',
      active: thingData.active ?? true,
      metadata: thingData.metadata || {}
    }
    
    // Update selected location code
    updateLocationCode()
  }
  
  /**
   * Update selected location code when location changes
   */
  const updateLocationCode = () => {
    const location = locations.value.find(loc => loc.id === thing.value.location_id)
    if (location) {
      // Extract the identifier part from the location code
      // Format is typically level-zone-identifier
      const parts = location.code.split('-')
      selectedLocationCode.value = parts.length > 2 ? parts[2] : parts[0]
      
      // Update the thing code if all required fields are present
      updateCode()
    }
  }
  
  /**
   * Generate thing code when type, location, or number changes
   */
  const updateCode = () => {
    if (thing.value.thing_type && selectedLocationCode.value && thing.value.number) {
      const typeAbbreviation = getThingTypeAbbreviation(thing.value.thing_type)
      
      thing.value.thing_code = generateThingCode(
        typeAbbreviation,
        selectedLocationCode.value,
        thing.value.number
      )
    }
  }
  
  /**
   * Helper for displaying location name in dropdown
   */
  const getLocationName = (locationId) => {
    const location = locations.value.find(loc => loc.id === locationId)
    return location ? location.name : locationId
  }
  
  /**
   * Helper for displaying location code in dropdown
   */
  const getLocationCode = (locationId) => {
    const location = locations.value.find(loc => loc.id === locationId)
    return location ? location.code : ''
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
    // Prepare data for API - Map form fields to API fields
    const thingData = {
      name: thing.value.name,
      description: thing.value.description,
      active: thing.value.active
    }
    
    // Add fields for create mode - map to the correct API field names
    if (mode === 'create') {
      thingData.location_id = thing.value.location_id
      thingData.type = thing.value.thing_type  // Changed from thing_type to type
      thingData.code = thing.value.thing_code  // Changed from thing_code to code
    }
    
    let response
    
    if (mode === 'create') {
      // Create new thing
      response = await thingService.createThing(thingData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Thing ${thingData.code} has been created`,
        life: 3000
      })
    } else {
      // Update existing thing
      response = await thingService.updateThing(thing.value.id, thingData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Thing ${thing.value.thing_code} has been updated`,
        life: 3000
      })
    }
    
    // Navigate to thing detail view
    router.push({ name: 'thing-detail', params: { id: response.data.id } })
    return true
  } catch (error) {
    console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} thing:`, error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to ${mode === 'create' ? 'create' : 'update'} thing. Please try again.`,
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
    thing.value = {
      id: '',
      location_id: route.query.location_id || '',
      thing_type: '',
      number: null,
      thing_code: '',
      name: '',
      description: '',
      active: true,
      metadata: {}
    }
    v$.value.$reset()
  }
  
  // Update location code when location_id changes
  watch(() => thing.value.location_id, () => {
    updateLocationCode()
  })
  
  return {
    thing,
    v$,
    loading,
    locations,
    locationsLoading,
    selectedLocationCode,
    loadThing,
    fetchLocations,
    updateLocationCode,
    updateCode,
    getLocationName,
    getLocationCode,
    submitForm,
    resetForm
  }
}
