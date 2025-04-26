// src/composables/useThingForm.js
import { ref, computed, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useRouter, useRoute } from 'vue-router'
import { 
  thingService, 
  locationService,
  generateThingCode, 
  validateThingCode, 
  getThingTypeAbbreviation 
} from '../services'
import { useApiOperation } from './useApiOperation'
import { useTypesStore } from '../stores/types'

/**
 * Composable for thing form handling
 * Manages form state, validation, and submission
 * 
 * @param {string} mode - 'create' or 'edit'
 * @returns {Object} - Form methods and state
 */
export function useThingForm(mode = 'create') {
  const router = useRouter()
  const route = useRoute()
  const { performOperation } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Load thing types from the central store
  typesStore.loadThingTypes()
  
  // Form data with defaults
  const thing = ref({
    id: '',
    location_id: route.query.location_id || '',
    type: '',
    number: null,
    code: '',
    name: '',
    description: '',
    active: true,
    metadata: {}
  })
  
  // Locations data for dropdown
  const locations = ref([])
  const locationsLoading = ref(false)
  const selectedLocationCode = ref('')
  
  // Get thing types from the store via computed property
  const thingTypes = computed(() => typesStore.thingTypes)
  
  // Loading state
  const loading = ref(false)
  
  /**
   * Define validation rules
   * Different rules for create vs edit mode
   */
  const rules = {
    name: { required: helpers.withMessage('Name is required', required) },
    description: {}
  }
  
  // Add create-specific validation rules
  if (mode === 'create') {
    rules.location_id = { required: helpers.withMessage('Location is required', required) }
    rules.type = { required: helpers.withMessage('Thing type is required', required) }
    rules.number = { required: helpers.withMessage('Number is required', required) }
    rules.code = { 
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
    return performOperation(
      () => {
        // If edge_id is provided as a query param, filter locations by edge
        const queryParams = {}
        if (route.query.edge_id) {
          queryParams.edge_id = route.query.edge_id
        }
        
        // Merge with any additional params
        Object.assign(queryParams, params)
        
        return locationService.getList(queryParams)
      },
      {
        loadingRef: locationsLoading,
        errorRef: null,
        errorMessage: 'Failed to load locations',
        onSuccess: (response) => {
          locations.value = response.data.items || []
          return locations.value
        }
      }
    )
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
      type: thingData.type || '',
      code: thingData.code || '',
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
    if (thing.value.type && selectedLocationCode.value && thing.value.number) {
      const typeAbbreviation = getThingTypeAbbreviation(thing.value.type)
      
      thing.value.code = generateThingCode(
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
    
    // Prepare data for API
    const thingData = {
      name: thing.value.name,
      description: thing.value.description,
      active: thing.value.active
    }
    
    // Add fields for create mode
    if (mode === 'create') {
      thingData.location_id = thing.value.location_id
      thingData.type = thing.value.type
      thingData.code = thing.value.code
    }
    
    return performOperation(
      () => mode === 'create' 
        ? thingService.createThing(thingData)
        : thingService.updateThing(thing.value.id, thingData),
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} thing`,
        successMessage: `Thing ${mode === 'create' ? thingData.code : thing.value.code} has been ${mode === 'create' ? 'created' : 'updated'}`,
        onSuccess: (response) => {
          // Navigate to thing detail view
          router.push({ name: 'thing-detail', params: { id: response.data.id } })
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
    thing.value = {
      id: '',
      location_id: route.query.location_id || '',
      type: '',
      number: null,
      code: '',
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
    thingTypes, // Expose thing types from the store
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
