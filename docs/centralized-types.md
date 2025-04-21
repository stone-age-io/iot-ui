# Centralized Type Management

## Overview

The IoT Platform implements a centralized type management system through a dedicated Pinia store. This approach provides a single source of truth for all entity type data (edge types, edge regions, location types, and thing types), enabling consistent access to type information across the application and reducing redundant API calls.

## Key Components

The type management system consists of these primary components:

1. **Types Store**: Centralized Pinia store for all entity types
2. **Type Services**: API services for each type category
3. **Type Composables**: Specialized composables for working with type data
4. **Form Integration**: Dropdown fields and validation using centralized types

## Types Store

The heart of the type management system is the `useTypesStore` Pinia store:

```javascript
// src/stores/types.js
export const useTypesStore = defineStore('types', () => {
  // State for all entity types
  const edgeTypes = ref([])
  const edgeRegions = ref([])
  const locationTypes = ref([])
  const thingTypes = ref([])

  // Loading states
  const loading = ref({
    edgeTypes: false,
    edgeRegions: false,
    locationTypes: false,
    thingTypes: false
  })

  // Error states
  const error = ref({
    edgeTypes: null,
    edgeRegions: null,
    locationTypes: null,
    thingTypes: null
  })

  // Computed properties for aggregate status
  const isLoading = computed(() => 
    loading.value.edgeTypes || 
    loading.value.edgeRegions || 
    loading.value.locationTypes || 
    loading.value.thingTypes
  )

  const hasError = computed(() => 
    error.value.edgeTypes || 
    error.value.edgeRegions || 
    error.value.locationTypes || 
    error.value.thingTypes
  )

  // Type loading actions
  async function loadEdgeTypes() {
    // Return cached types if available
    if (edgeTypes.value.length > 0) return edgeTypes.value
    
    loading.value.edgeTypes = true
    error.value.edgeTypes = null
    
    try {
      const types = await edgeTypeService.getTypeOptions()
      edgeTypes.value = types
      return types
    } catch (err) {
      console.error('Error loading edge types:', err)
      error.value.edgeTypes = 'Failed to load edge types'
      return []
    } finally {
      loading.value.edgeTypes = false
    }
  }

  // Similar functions for other type collections...

  /**
   * Load all type collections at once
   * @returns {Promise<Array>} - All type collections
   */
  async function loadAllTypes() {
    return Promise.all([
      loadEdgeTypes(),
      loadEdgeRegions(),
      loadLocationTypes(),
      loadThingTypes()
    ])
  }

  /**
   * Refresh a specific type collection's data by forcing a refetch from API
   * @param {string} collection - Collection name
   * @returns {Promise<Array>} - Refreshed data
   */
  async function refreshTypeCollection(collection) {
    console.log(`Refreshing type collection: ${collection}`)
    switch (collection) {
      case 'edgeTypes':
        edgeTypes.value = [] // Reset cache
        return loadEdgeTypes() // Force reload
      // Similar cases for other collections...
    }
  }

  /**
   * Get type name from code
   * @param {string} typeCode - Type code
   * @param {string} collection - Collection name
   * @returns {string} - Type name or code if not found
   */
  function getTypeName(typeCode, collection) {
    if (!typeCode) return ''
    
    // Get the appropriate collection
    let types
    switch (collection) {
      case 'edgeTypes':
        types = edgeTypes.value
        break
      case 'edgeRegions':
        types = edgeRegions.value
        break
      case 'locationTypes':
        types = locationTypes.value
        break
      case 'thingTypes':
        types = thingTypes.value
        break
      default:
        return typeCode
    }
    
    // Find matching type
    const type = types.find(t => t.value === typeCode)
    return type ? type.label : typeCode
  }

  // Helper functions for type styling
  function getEdgeTypeClass(typeCode) {/* ... */}
  function getEdgeRegionClass(regionCode) {/* ... */}
  function getLocationTypeClass(typeCode) {/* ... */}
  function getThingTypeClass(typeCode) {/* ... */}

  return {
    // State
    edgeTypes,
    edgeRegions,
    locationTypes,
    thingTypes,
    loading,
    error,
    isLoading,
    hasError,
    
    // Actions
    loadEdgeTypes,
    loadEdgeRegions,
    loadLocationTypes,
    loadThingTypes,
    loadAllTypes,
    resetTypes,
    refreshTypeCollection,
    
    // Helpers
    getTypeName,
    getEdgeTypeClass,
    getEdgeRegionClass,
    getLocationTypeClass,
    getThingTypeClass
  }
})
```

## Type Services

Each type category has a dedicated service that interacts with the API:

```javascript
// src/services/type/edgeTypeService.js (inferred from code)
export const edgeTypeService = {
  /**
   * Get edge type options for dropdowns
   * @returns {Promise<Array>} - Edge type options
   */
  async getTypeOptions() {
    try {
      const response = await apiService.get('/edge-types', { 
        params: { sort: 'type' } 
      })
      
      // Format data for dropdown usage
      return response.data.items.map(type => ({
        value: type.code,
        label: type.type
      }))
    } catch (error) {
      console.error('Error fetching edge type options:', error)
      throw error
    }
  },
  
  // Other service methods...
}
```

Similar services exist for edge regions, location types, and thing types.

## Type Composables

Specialized composables provide entity-specific type functionality:

```javascript
// src/composables/useEdgeType.js
export function useEdgeType() {
  // Route names for navigation
  const routeNames = {
    list: 'edge-types',
    detail: 'edge-type-detail',
    create: 'create-edge-type',
    edit: 'edit-edge-type'
  }
  
  // Use base type management composable
  const baseTypeManagement = useTypeManagement(
    edgeTypeService,
    routeNames,
    'Edge Type'
  )
  
  // Get edge type options for dropdowns
  const getTypeOptions = async () => {
    try {
      return await edgeTypeService.getTypeOptions()
    } catch (error) {
      console.error('Error fetching edge type options:', error)
      return []
    }
  }
  
  return {
    // Include all base functionality
    ...baseTypeManagement,
    
    // Additional edge type specific functionality
    getTypeOptions
  }
}
```

The base type management composable provides shared functionality:

```javascript
// src/composables/useTypeManagement.js
export function useTypeManagement(typeService, routeNames, entityName) {
  const router = useRouter()
  const toast = useToast()
  const { performOperation, performCreate, performUpdate, performDelete } = useApiOperation()
  const typesStore = useTypesStore()
  
  // Determine the store collection name based on entityName
  const storeCollectionName = getStoreCollectionName(entityName)
  
  // Common state
  const types = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // CRUD operations and helpers...
  
  return {
    // State
    types,
    loading,
    error,
    
    // Helpers
    formatDate,
    validateCode,
    
    // Operations
    fetchTypes,
    fetchType,
    createType,
    updateType,
    deleteType,
    
    // Navigation
    navigateToTypeList,
    navigateToTypeDetail,
    navigateToTypeEdit,
    navigateToTypeCreate
  }
}
```

## Integration with Entity Composables

Entity composables integrate with the types store:

```javascript
// src/composables/useEdge.js
export function useEdge() {
  const typesStore = useTypesStore()
  
  // Load edge types and regions
  typesStore.loadEdgeTypes()
  typesStore.loadEdgeRegions()
  
  // Edge types and regions from the store
  const edgeTypes = computed(() => typesStore.edgeTypes)
  const edgeRegions = computed(() => typesStore.edgeRegions)
  
  // Helper functions
  const getTypeName = (typeCode) => {
    return typesStore.getTypeName(typeCode, 'edgeTypes')
  }
  
  const getRegionName = (regionCode) => {
    return typesStore.getTypeName(regionCode, 'edgeRegions')
  }
  
  const getTypeClass = (typeCode) => {
    return typesStore.getEdgeTypeClass(typeCode)
  }
  
  const getRegionClass = (regionCode) => {
    return typesStore.getEdgeRegionClass(regionCode)
  }
  
  // Rest of composable...
  
  return {
    // Include types in return values
    edgeTypes,
    edgeRegions,
    getTypeName,
    getRegionName,
    getTypeClass,
    getRegionClass,
    // ...other return values
  }
}
```

## Form Integration

Form composables use the types store for dropdown options:

```javascript
// src/composables/useEdgeForm.js
export function useEdgeForm(mode = 'create') {
  const router = useRouter()
  const route = useRoute()
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
  
  // Rest of form handling...
  
  return {
    edge,
    v$,
    loading,
    edgeTypes,        // Expose types for template
    edgeRegions,      // Expose regions for template
    loadEdge,
    updateCode,
    submitForm,
    resetForm
  }
}
```

In the form template, these are used in dropdowns:

```vue
<!-- src/views/Entities/Edges/EdgeCreateView.vue (inferred) -->
<template>
  <form @submit.prevent="submitForm">
    <!-- Type dropdown -->
    <div class="form-field">
      <label for="type">Edge Type</label>
      <Dropdown
        id="type"
        v-model="edge.type"
        :options="edgeTypes"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Edge Type"
        :class="{ 'p-invalid': v$.type.$error }"
        @change="updateCode"
      />
      <small v-if="v$.type.$error" class="p-error">{{ v$.type.$errors[0].$message }}</small>
    </div>
    
    <!-- Similar fields for region and other properties -->
  </form>
</template>
```

## Store Initialization

The types store is preloaded during application startup:

```javascript
// src/main.js
// Function to preload essential application data
const preloadAppData = async () => {
  if (storesInitialized) {
    console.log('Stores already initialized, skipping preload')
    return
  }
  
  try {
    console.log('Preloading application data...')
    
    // Initialize stores
    const typesStore = useTypesStore()
    
    // Load all type collections for form dropdowns
    await typesStore.loadAllTypes()
    
    console.log('Application data preloaded successfully')
    storesInitialized = true
  } catch (error) {
    console.warn('Error during data preloading:', error)
    // Continue even if preloading fails to avoid blocking the user
  }
}

// Preload data after authentication
router.beforeEach(async (to, from, next) => {
  // For auth routes when user is authenticated
  if (requiresAuth && authStore.isAuthenticated) {
    // Check token validity
    const isValid = await authStore.checkToken()
    
    if (!isValid) {
      // Token is invalid, redirect to login
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    
    // Token is valid, preload if needed
    await preloadAppData()
    
    // Continue navigation
    next()
    return
  }
  
  // Handle other cases...
})
```

## Cache Refreshing and Type Changes

When types are modified, the store is updated to ensure consistency:

```javascript
// src/composables/useTypeForm.js
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
      
      // Refresh the types store collection to make the new type immediately available
      if (storeCollectionName) {
        await typesStore.refreshTypeCollection(storeCollectionName)
      }
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
      
      // Refresh the types store collection to make the updated type immediately available
      if (storeCollectionName) {
        await typesStore.refreshTypeCollection(storeCollectionName)
      }
    }
    
    // Navigate to type list view
    router.push({ name: routeNames.list })
    return true
  } catch (error) {
    // Error handling...
  } finally {
    loading.value = false
  }
}
```

## Type Validation and Generation

The system includes utilities for validating and generating type codes:

```javascript
// src/services/edge.js (inferred)
/**
 * Validate edge code format
 * @param {string} code - Edge code to validate
 * @returns {boolean} - True if valid
 */
export function validateEdgeCode(code) {
  if (!code) return false
  
  // Format: [type]-[region]-[number]
  // Example: bld-na-1
  const pattern = /^[a-z]{2,4}-[a-z]{2,4}-\d+$/
  return pattern.test(code)
}

/**
 * Generate edge code from components
 * @param {string} type - Edge type code
 * @param {string} region - Edge region code
 * @param {number} number - Edge number
 * @returns {string} - Generated edge code
 */
export function generateEdgeCode(type, region, number) {
  if (!type || !region || !number) return ''
  return `${type}-${region}-${number}`
}
```

## Type Styling Helpers

The types store provides consistent styling helpers:

```javascript
// src/stores/types.js
function getEdgeTypeClass(typeCode) {
  // Map of type codes to CSS classes - Updated with dark mode support
  const classMap = {
    'bld': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'srv': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'gw': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'hst': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }
  
  return classMap[typeCode] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}
```

These are used in templates:

```vue
<!-- src/components/Edge/EdgeTypesBadge.vue (inferred) -->
<template>
  <span :class="[
    'inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium',
    getTypeClass(typeCode)
  ]">
    {{ getTypeName(typeCode) }}
  </span>
</template>

<script setup>
import { useTypesStore } from '../../stores/types'

const props = defineProps({
  typeCode: {
    type: String,
    required: true
  }
})

const typesStore = useTypesStore()
const getTypeClass = (code) => typesStore.getEdgeTypeClass(code)
const getTypeName = (code) => typesStore.getTypeName(code, 'edgeTypes')
</script>
```

## Benefits of Centralized Type Management

1. **Single Source of Truth**: All type data is managed in one place
2. **Reduced API Calls**: Types are loaded once per session
3. **Consistent Styling**: Type-specific styling is centralized
4. **Code Reuse**: Type helpers are used across the application
5. **Type Safety**: Type validation is consistent
6. **Performance**: Cached types reduce load times
7. **Maintainability**: Changes to type handling are made in one place

## Conclusion

The IoT Platform's centralized type management system exemplifies good architecture by providing a single source of truth for entity type data. This approach reduces redundant API calls, ensures consistent type handling, and improves the developer experience by making type data easily accessible throughout the application.
