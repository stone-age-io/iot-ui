# IoT UI - Architecture Documentation

## Overview

This document describes the architectural patterns, code organization principles, and development conventions used in the IoT Platform Management UI. It serves as a reference guide for understanding the codebase structure and maintaining consistency when adding new features.

## Code Organization

The application follows a feature-based organization with clear separation of concerns:

```
src/
├── assets/              # Static assets and global CSS
├── components/          # Reusable Vue components
│   ├── common/          # Common UI components
│   ├── dashboard/       # Dashboard-specific components
│   └── map/             # Map and geospatial components
├── composables/         # Vue 3 composable functions
├── layouts/             # Page layout components
├── router/              # Vue Router configuration
├── services/            # API services and utilities
│   ├── base/            # Base service classes
│   ├── edge/            # Edge-related services
│   ├── location/        # Location-related services
│   ├── thing/           # Thing-related services
│   ├── client/          # Client-related services
│   ├── topic-permission/# Topic permission services
│   └── index.js         # Central export point
├── stores/              # Pinia state stores
└── views/               # Page components
    ├── Auth/            # Authentication views
    ├── Entities/        # Entity management views
    │   ├── Edges/       # Edge management
    │   ├── Locations/   # Location management
    │   └── Things/      # IoT device management
    └── Messaging/       # Messaging system views
        ├── Clients/     # Client management
        └── TopicPermissions/ # Permission management
```

### Key Architecture Principles

1. **Component-Based Design**: The UI is built using reusable Vue components with clear responsibilities.
2. **Composition API**: Vue 3 Composition API with `<script setup>` syntax for all components.
3. **Composable Functions**: Reusable logic extracted into composable functions.
4. **Service Layer**: API interactions are encapsulated in service modules that extend a base service class.
5. **State Management**: Application state is managed using Pinia stores.
6. **Routing**: Page navigation is handled by Vue Router.
7. **Responsive Design**: UI adapts to different screen sizes using Tailwind CSS.

## Component Patterns

### Component Structure

Components follow the Vue 3 Composition API with `<script setup>` syntax:

```vue
<template>
  <!-- Template HTML with proper structure and semantics -->
</template>

<script setup>
// Imports
import { ref, computed, onMounted } from 'vue'
import { useEdge } from '../composables/useEdge'

// Props and emits
const props = defineProps({
  propName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

// Use composables
const { edges, loading, fetchEdges, getTypeName } = useEdge()

// Local state management
const localState = ref(initialValue)

// Computed properties
const derivedValue = computed(() => {
  return transformation(localState.value)
})

// Lifecycle hooks
onMounted(() => {
  // Initialization code
  fetchEdges()
})

// Methods
const handleAction = () => {
  // Implementation
  emit('update', localState.value)
}
</script>
```

### Component Types

1. **Page Components**: Located in `views/`, represent full pages and are connected to routes.
2. **Layout Components**: Located in `layouts/`, define the structure of pages.
3. **Common Components**: Located in `components/common/`, reusable across the application.
4. **Feature Components**: Located in feature-specific directories, used within specific features.

### Component Naming Conventions

- **PascalCase** for component names
- **Suffix by type**: `*View.vue` for pages, `*Layout.vue` for layouts
- **Prefix by feature**: `Edge*`, `Location*`, etc., for feature components

## Composable Functions Pattern

Composables encapsulate reusable logic and follow this pattern:

```javascript
// src/composables/useEntityName.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { entityService } from '../services'

/**
 * Composable for entity-related functionality
 * Centralizes entity operations, formatting helpers, and navigation
 */
export function useEntityName() {
  const router = useRouter()
  const toast = useToast()
  
  // Common state
  const entities = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Data fetching
  const fetchEntities = async (params = {}) => {
    loading.value = true
    try {
      const response = await entityService.getEntities(params)
      entities.value = response.data.items || []
      return entities.value
    } catch (err) {
      console.error('Error fetching entities:', err)
      error.value = 'Failed to load entities. Please try again.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load entities',
        life: 3000
      })
      return []
    } finally {
      loading.value = false
    }
  }
  
  // Other operations and helpers
  // ...
  
  // Navigation methods
  const navigateToEntityList = () => router.push({ name: 'entities' })
  const navigateToEntityDetail = (id) => router.push({ name: 'entity-detail', params: { id } })
  
  return {
    // State
    entities,
    loading,
    error,
    
    // Operations
    fetchEntities,
    
    // Navigation
    navigateToEntityList,
    navigateToEntityDetail
  }
}
```

## Form Composable Pattern

Forms have their own composable pattern:

```javascript
// src/composables/useEntityForm.js
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { entityService } from '../services'

/**
 * Composable for entity form handling
 * Manages form state, validation, and submission
 * 
 * @param {string} mode - 'create' or 'edit'
 * @returns {Object} - Form methods and state
 */
export function useEntityForm(mode = 'create') {
  const toast = useToast()
  const router = useRouter()
  
  // Form data with defaults
  const entity = ref({
    id: '',
    name: '',
    // other fields
  })
  
  // Loading state
  const loading = ref(false)
  
  // Validation rules
  const rules = {
    name: { required: helpers.withMessage('Name is required', required) }
    // other rules
  }
  
  // Initialize Vuelidate
  const v$ = useVuelidate(rules, entity)
  
  // Load entity data for editing
  const loadEntity = (entityData) => {
    if (!entityData) return
    entity.value = { ...entityData }
  }
  
  // Handle form submission
  const submitForm = async () => {
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    loading.value = true
    
    try {
      let response
      
      if (mode === 'create') {
        response = await entityService.createEntity(entity.value)
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Entity has been created`,
          life: 3000
        })
      } else {
        response = await entityService.updateEntity(entity.value.id, entity.value)
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Entity has been updated`,
          life: 3000
        })
      }
      
      router.push({ name: 'entity-detail', params: { id: response.data.id } })
      return true
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} entity:`, error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to ${mode === 'create' ? 'create' : 'update'} entity. Please try again.`,
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Reset form
  const resetForm = () => {
    entity.value = { id: '', name: '' /* other fields reset */ }
    v$.value.$reset()
  }
  
  return {
    entity,
    v$,
    loading,
    loadEntity,
    submitForm,
    resetForm
  }
}
```

## Service Layer Pattern

### Base Service Class

The application uses a BaseService class for common CRUD operations:

```javascript
// src/services/base/BaseService.js
import { apiHelpers } from '../api'
import { transformResponse, transformPaginationParams } from '../pocketbase-config'

export class BaseService {
  /**
   * Create a new service instance
   * @param {string} collectionName - PocketBase collection name
   * @param {Function} collectionEndpoint - Function to generate endpoints
   * @param {Object} options - Service options
   */
  constructor(collectionName, collectionEndpoint, options = {}) {
    this.collectionName = collectionName
    this.collectionEndpoint = collectionEndpoint
    this.options = {
      // Default options
      jsonFields: [], // Fields to be parsed/stringified as JSON
      expandFields: [], // Fields to expand in queries
      ...options
    }
  }

  /**
   * Get a paginated list of entities
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with data
   */
  getList(params = {}) {
    const endpoint = this.collectionEndpoint(this.collectionName)
    const transformedParams = transformPaginationParams(params)
    
    // Add expand parameter if not already specified
    if (this.options.expandFields.length > 0 && !transformedParams.expand) {
      transformedParams.expand = this.options.expandFields.join(',')
    }
    
    // Apply custom parameter transformations
    this.transformParams(transformedParams, params)
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        const data = transformResponse(response.data)
        
        // Process JSON fields in list items
        if (data.items && data.items.length > 0) {
          data.items = data.items.map(item => this.parseJsonFields(item))
        }
        
        return { data }
      })
  }

  // Other CRUD methods
  // ...
  
  /**
   * Parse JSON fields in an entity
   * @param {Object} entity - Entity object
   * @returns {Object} - Entity with parsed JSON fields
   */
  parseJsonFields(entity) {
    const result = { ...entity }
    
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field])
        } catch (e) {
          console.warn(`Failed to parse ${field} for ${this.collectionName}:`, result.id || result.code)
          result[field] = {}
        }
      }
    })
    
    return result
  }

  /**
   * Stringify JSON fields in an entity
   * @param {Object} entity - Entity object
   * @returns {Object} - Entity with stringified JSON fields
   */
  stringifyJsonFields(entity) {
    const result = { ...entity }
    
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'object') {
        result[field] = JSON.stringify(result[field])
      }
    })
    
    return result
  }

  /**
   * Custom parameter transformation hook
   * @param {Object} transformedParams - Transformed parameters
   * @param {Object} originalParams - Original parameters
   */
  transformParams(transformedParams, originalParams) {
    // Override in subclasses if needed
  }
}
```

### Entity Service Implementation

Services for specific entities extend the BaseService:

```javascript
// src/services/entityType/entityService.js
import { BaseService } from '../base/BaseService'
import { COLLECTIONS, collectionEndpoint } from '../pocketbase-config'

/**
 * Service for Entity operations
 */
export class EntityService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.ENTITY_NAME,
      collectionEndpoint,
      {
        jsonFields: ['metadata'],
        expandFields: ['related_entity_id']
      }
    )
  }
  
  /**
   * Get a paginated list of entities
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with data
   */
  getEntities(params = {}) {
    return this.getList(params)
  }
  
  /**
   * Get a single entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise} - Axios promise with entity data
   */
  getEntity(id) {
    return this.getById(id)
  }
  
  /**
   * Create a new entity
   * @param {Object} entity - Entity data
   * @returns {Promise} - Axios promise with created entity
   */
  createEntity(entity) {
    return this.create(entity)
  }
  
  /**
   * Update an existing entity
   * @param {string} id - Entity ID
   * @param {Object} entity - Updated entity data
   * @returns {Promise} - Axios promise with updated entity
   */
  updateEntity(id, entity) {
    return this.update(id, entity)
  }
  
  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise} - Axios promise
   */
  deleteEntity(id) {
    return this.delete(id)
  }
  
  /**
   * Entity-specific methods
   */
  
  /**
   * Custom parameter transformation for entity-specific filters
   * @override
   */
  transformParams(transformedParams, originalParams) {
    // Add specific filters based on params
    if (originalParams.specialFilter) {
      transformedParams.filter = `some_field="${originalParams.specialFilter}"`
    }
  }
}

// Create instance
export const entityService = new EntityService()

// Additional utility functions and constants
export const entityTypes = [
  { label: 'Type 1', value: 'type1' },
  { label: 'Type 2', value: 'type2' }
]

// Helper functions
export const validateEntityCode = (code) => {
  // Validation logic
}

export const generateEntityCode = (type, identifier) => {
  // Code generation logic
}
```

### Central Service Export

All services are exported from a central index.js:

```javascript
// src/services/index.js
import { apiHelpers } from './api'

// Entity services
import { edgeService, edgeRegions, edgeTypes, validateEdgeCode, generateEdgeCode } from './edge/edgeService'
import { locationService, locationTypes, parseLocationPath, validateLocationCode, generateLocationCode, locationLevels, locationZones } from './location/locationService'
import { thingService, thingTypes, validateThingCode, generateThingCode, getThingTypeAbbreviation } from './thing/thingService'
import { clientService, generateClientUsername, generateSecurePassword } from './client/clientService'
import { topicPermissionService, validateTopic } from './topic-permission/topicPermissionService'

// Export all services and utilities
export {
  // API helpers
  apiHelpers,
  
  // Entity services
  edgeService,
  locationService,
  thingService,
  clientService,
  topicPermissionService,
  
  // Edge utilities
  edgeRegions,
  edgeTypes,
  validateEdgeCode,
  generateEdgeCode,
  
  // Location utilities
  locationTypes,
  parseLocationPath,
  validateLocationCode,
  generateLocationCode,
  locationLevels,
  locationZones,
  
  // Thing utilities
  thingTypes,
  validateThingCode,
  generateThingCode,
  getThingTypeAbbreviation,
  
  // Client utilities
  generateClientUsername,
  generateSecurePassword,
  
  // Topic permission utilities
  validateTopic
}
```

## View Pattern

Views have been updated to use composables and follow a consistent pattern:

1. **ListView**: Uses a composable for data fetching and management, displays a paginated, filterable list of entities
2. **DetailView**: Uses the same composable to fetch a single entity and display its details
3. **CreateView**: Uses a form composable to handle form state, validation, and submission
4. **EditView**: Uses the same form composable for editing an existing entity

```vue
<!-- Example ListView using Composables -->
<template>
  <div class="entity-list">
    <PageHeader title="Entities" />
    
    <DataTable 
      :value="entities"
      :loading="loading"
      v-model:filters="filters"
      :globalFilterFields="['name', 'code']"
    >
      <!-- Table columns -->
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FilterMatchMode } from 'primevue/api'
import { useEntity } from '../../composables/useEntity'
import PageHeader from '../../components/common/PageHeader.vue'
import DataTable from '../../components/common/DataTable.vue'

// Use the entity composable
const { 
  entities, 
  loading, 
  fetchEntities,
  navigateToEntityDetail
} = useEntity()

// Initialize filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

// Fetch data on mount
onMounted(() => {
  fetchEntities()
})
</script>
```

## API Interaction Pattern

API interactions are now managed via the service layer and composables:

1. **Service Layer**: 
   - Base service class handles common CRUD operations
   - Entity-specific services extend the base service
   - JSON field handling is automated based on configuration
   - Parameter transformation is handled via strategy pattern

2. **Composables**:
   - Provide a clean API for components to interact with services
   - Handle loading states and error handling
   - Provide navigation helpers and utility functions
   - Manage UI feedback (toasts, etc.)

3. **Component Layer**:
   - Components use composables instead of calling services directly
   - Components focus on UI rendering and user interaction
   - Business logic is delegated to composables

## Error Handling

The application uses a consistent approach to error handling:

1. **Service Layer**: Handles API errors with consistent error transformation
2. **Composable Layer**: Manages error state and provides user feedback
3. **Component Layer**: Displays appropriate error messages to users
4. **Global Handler**: Catches uncaught errors and provides fallback UI

## State Management

The application uses a combination of approaches for state management:

1. **Pinia Stores**: For global state (auth, settings, etc.)
2. **Composables**: For entity-specific state and operations
3. **Component State**: For UI-specific state that doesn't need to be shared

## Performance Considerations

1. **Lazy Loading**: Routes are lazy-loaded to improve initial load time
2. **Pagination**: Lists use pagination to limit data transfer
3. **Caching**: Frequently accessed data may be cached in composables
4. **Component Optimization**: Heavy components implement performance optimizations

## Feature Development Workflow

When adding a new feature or entity:

1. **Define Service**:
   - Create a new directory in `services/` for the entity
   - Implement entity service extending BaseService
   - Export from central `services/index.js`

2. **Create Composables**:
   - Create entity composable for common operations
   - Create form composable for form handling

3. **Implement Views**:
   - Create List, Detail, Create, and Edit views
   - Use composables for data and logic

4. **Register Routes**:
   - Add routes to router configuration

5. **Update Navigation**:
   - Add navigation items to sidebar as needed

## Testing Strategy

1. **Component Tests**: Test component rendering and interactions
2. **Composable Tests**: Test composable logic in isolation
3. **Service Tests**: Test service modules with mocked API responses
4. **Integration Tests**: Test key user flows across multiple components
5. **E2E Tests**: Test critical paths in a production-like environment

## Naming Conventions

1. **Files**:
   - Components: `PascalCase.vue`
   - Composables: `use[EntityName].js` or `use[Feature].js`
   - Services: `[entityName]Service.js`
   - Service exports: `camelCase` for service instances, `PascalCase` for classes

2. **Variables**:
   - `camelCase` for variables and functions
   - `PascalCase` for components and classes
   - `UPPER_CASE` for constants

3. **CSS**:
   - Tailwind utility classes for most styling
   - Custom classes use `kebab-case`

---
