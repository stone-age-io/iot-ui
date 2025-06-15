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
│   ├── type/            # Type management services
│   ├── nats/            # NATS messaging services
│   ├── user/            # User profile services
│   ├── organization/    # Organization services
│   ├── audit/           # Audit log services
│   └── config/          # Configuration services
├── stores/              # Pinia state stores
├── utils/               # Utility functions
└── views/               # Page components
    ├── Auth/            # Authentication views
    ├── Entities/        # Entity management views
    │   ├── Edges/       # Edge management
    │   ├── Locations/   # Location management
    │   └── Things/      # IoT device management
    ├── Messaging/       # Messaging system views
    │   ├── Clients/     # Client management
    │   └── TopicPermissions/ # Permission management
    ├── Profile/         # User profile views
    ├── Settings/        # User settings views
    └── Types/           # Type definition views
        ├── EdgeTypes/   # Edge type management
        ├── EdgeRegions/ # Edge region management
        ├── LocationTypes/ # Location type management
        └── ThingTypes/  # Thing type management
```

### Key Architecture Principles

1. **Component-Based Design**: The UI is built using reusable Vue components with clear responsibilities.
2. **Composition API**: Vue 3 Composition API with `<script setup>` syntax for all components.
3. **Composable Functions**: Reusable logic extracted into composable functions.
4. **Service Layer**: API interactions are encapsulated in service modules that extend a base service class.
5. **State Management**: Application state is managed using Pinia stores and local state in composables.
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

### API Operation Composable

The application uses a centralized API operation handler composable that standardizes API interactions across all entity composables:

```javascript
// src/composables/useApiOperation.js
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

/**
 * Composable for handling common API operations
 * Provides a consistent way to handle loading states, errors, and toast notifications
 * @returns {Object} - API operation handler functions
 */
export function useApiOperation() {
  const toast = useToast()

  /**
   * Perform an API operation with consistent loading state and error handling
   * @param {Function} operation - Async function that performs the API call
   * @param {Object} options - Operation options
   * @param {Ref} options.loadingRef - Loading state ref
   * @param {Ref} options.errorRef - Error state ref
   * @param {string} options.errorMessage - User-friendly error message
   * @param {string} options.successMessage - Success message to display (optional)
   * @param {Function} options.onSuccess - Callback for successful operation (optional)
   * @param {Function} options.onError - Callback for failed operation (optional)
   * @param {string} options.collection - Collection name for cache updates (optional)
   * @returns {Promise<any>} - Result of the operation
   */
  const performOperation = async (operation, options) => {
    const {
      loadingRef,
      errorRef,
      errorMessage = 'Operation failed',
      successMessage,
      onSuccess,
      onError,
      collection
    } = options

    // Set loading state
    if (loadingRef) loadingRef.value = true
    if (errorRef) errorRef.value = null

    try {
      // Perform the operation
      const response = await operation()

      // Show success toast if provided
      if (successMessage) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: successMessage,
          life: 3000
        })
      }

      // Call success callback if provided
      if (onSuccess) {
        return onSuccess(response)
      }

      return response
    } catch (err) {
      console.error(`Error: ${errorMessage}`, err)

      // Set error state
      if (errorRef) {
        errorRef.value = errorMessage
      }

      // Show error toast
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000
      })

      // Call error callback if provided
      if (onError) {
        return onError(err)
      }

      return null
    } finally {
      // Reset loading state
      if (loadingRef) loadingRef.value = false
    }
  }

  /**
   * Specialized operation handlers for common operation types
   */
  const performCreate = async (operation, options) => {
    const {
      entityName = 'item',
      entityIdentifier,
      collection,
      ...restOptions
    } = options

    return performOperation(operation, {
      successMessage: entityIdentifier 
        ? `${entityName} ${entityIdentifier} has been created`
        : `${entityName} has been created`,
      collection,
      ...restOptions
    })
  }

  const performUpdate = async (operation, options) => {
    const {
      entityName = 'item',
      entityIdentifier,
      collection,
      ...restOptions
    } = options

    return performOperation(operation, {
      successMessage: entityIdentifier 
        ? `${entityName} ${entityIdentifier} has been updated`
        : `${entityName} has been updated`,
      collection,
      ...restOptions
    })
  }

  const performDelete = async (operation, options) => {
    const {
      entityName = 'item',
      entityIdentifier,
      collection,
      ...restOptions
    } = options

    return performOperation(operation, {
      successMessage: entityIdentifier 
        ? `${entityName} ${entityIdentifier} has been deleted`
        : `${entityName} has been deleted`,
      onSuccess: () => true,
      collection,
      ...restOptions
    })
  }

  return {
    performOperation,
    performCreate,
    performUpdate,
    performDelete
  }
}
```

This pattern centralizes:
- Loading state management
- Error handling and user feedback
- Toast notifications
- Success and error callbacks
- Cache invalidation

### Entity Composables

Entity composables use the `useApiOperation` composable for standardized API interactions:

```javascript
// src/composables/useEntity.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApiOperation } from './useApiOperation'
import { useReactiveData } from './useReactiveData'

/**
 * Composable for entity-related functionality
 * Centralizes entity operations, formatting helpers, and navigation
 */
export function useEntity() {
  const router = useRouter()
  const { performOperation, performDelete } = useApiOperation()
  
  // Common state
  const loading = ref(false)
  const error = ref(null)
  
  // Set up reactive data from the cache store
  const entitiesData = useReactiveData({
    collection: 'entities',
    operation: 'list',
    fetchFunction: fetchEntitiesRaw,
    processData: data => data?.items || []
  })
  
  // Expose entities as a computed property from reactive cache
  const entities = computed(() => entitiesData.data.value || [])
  
  /**
   * Raw function to fetch entities - used internally by useReactiveData
   */
  async function fetchEntitiesRaw(options = {}) {
    return await entityService.getList({
      ...options,
      skipCache: options?.skipCache
    })
  }
  
  /**
   * Fetch all entities with optional filtering
   */
  const fetchEntities = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const skipCache = params.skipCache || Object.keys(params).length > 0
      
      if (skipCache || Object.keys(params).length > 0) {
        // For filtered queries, use direct API call
        const response = await entityService.getList({
          ...params,
          skipCache
        })
        
        // Update the cache with this response
        if (response && response.data) {
          entitiesData.updateData(response)
          return response.data.items || []
        }
        return []
      } else {
        // Use the reactive data system for standard fetches
        await entitiesData.refreshData(skipCache)
        return entities.value
      }
    } catch (err) {
      console.error('Error in fetchEntities:', err)
      error.value = 'Failed to load entities'
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Delete an entity
   */
  const deleteEntity = async (id, code) => {
    return performDelete(
      () => entityService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to delete entity',
        entityName: 'Entity',
        entityIdentifier: code,
        collection: 'entities',
        onSuccess: async () => {
          // Force refresh to update the UI
          await entitiesData.refreshData(true)
          return true
        }
      }
    )
  }
  
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
    deleteEntity,
    
    // Navigation
    navigateToEntityList,
    navigateToEntityDetail
  }
}
```

The application implements entity-specific composables for each entity type:

- **useEdge**: Encapsulates edge operations and styling
- **useLocation**: Encapsulates location operations and styling
- **useThing**: Encapsulates IoT device operations and styling
- **useClient**: Encapsulates messaging client operations
- **useTopicPermission**: Encapsulates MQTT topic permission operations
- **useOrganization**: Encapsulates organization operations

### Form Composables

Form composables also leverage the `useApiOperation` composable for standardized form submission:

```javascript
// src/composables/useEntityForm.js
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useRouter } from 'vue-router'
import { entityService } from '../services'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for entity form handling
 * Manages form state, validation, and submission
 */
export function useEntityForm(mode = 'create') {
  const router = useRouter()
  const { performOperation } = useApiOperation()
  
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
  
  // Handle form submission
  const submitForm = async () => {
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    return performOperation(
      () => mode === 'create' 
        ? entityService.create(entity.value)
        : entityService.update(entity.value.id, entity.value),
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} entity`,
        successMessage: `Entity ${entity.value.name} has been ${mode === 'create' ? 'created' : 'updated'}`,
        collection: 'entities',
        onSuccess: (response) => {
          router.push({ name: 'entity-detail', params: { id: response.data.id } })
          return true
        },
        onError: () => false
      }
    )
  }
  
  return {
    entity,
    v$,
    loading,
    submitForm
  }
}
```

### Type Management Composables

Type management utilizes a base composable with specializations:

- **useTypeManagement**: Base reusable composable for all type management
- **useEdgeType**: Specialized for edge type operations
- **useEdgeRegion**: Specialized for edge region operations
- **useLocationType**: Specialized for location type operations
- **useThingType**: Specialized for thing type operations

### Utility Composables

The application includes several utility composables:

- **useApiOperation**: Centralizes API operation handling
- **useConfirmation**: Manages confirmation dialogs
- **useDeleteConfirmation**: Specialized for delete confirmations
- **useDashboard**: Handles dashboard data and activities
- **useMessages**: Manages device messages and status
- **useNatsMessages**: Handles NATS message subscriptions and display
- **useNatsSettings**: Manages NATS connection settings
- **useUserProfile**: Handles user profile operations
- **useReactiveData**: Manages reactive data with caching
- **useTheme**: Theme-related utilities

## Service Layer Pattern

### Base Service Class

The application uses a BaseService class for common CRUD operations:

```javascript
// src/services/base/BaseService.js
import { apiHelpers } from '../api'
import configService from '../config/configService'
import { generateUUIDv7 } from '../../utils/uuidUtils'

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

  // CRUD Operations
  getList(params = {}) { /* ... */ }
  getById(id) { /* ... */ }
  
  async create(entity) {
    // Get current organization ID and automatically add it
    const authData = this.getUserAuthData()
    const currentOrgId = authData?.currentOrgId
    
    const entityData = { ...entity }
    
    // Add organization_id if not already provided and we have a current org
    if (currentOrgId && !entityData.organization_id) {
      entityData.organization_id = currentOrgId
    }
    
    // Generate a UUIDv7 for the entity if ID is not already specified
    const entityWithId = {
      ...entityData,
      id: entityData.id || generateUUIDv7()
    }
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(entityWithId)
    
    const response = await apiHelpers.create(endpoint, processedData)
    
    // Clear cache after creation
    await this.clearCache()
    
    return response
  }
  
  async update(id, entity) { /* ... */ }
  async delete(id) { /* ... */ }

  // Utility methods
  parseJsonFields(entity) { /* ... */ }
  stringifyJsonFields(entity) { /* ... */ }
  transformParams(transformedParams, originalParams) { /* ... */ }
}
```

The BaseService provides:

- Standardized CRUD operations
- Automatic organization_id injection on creation
- UUIDv7 generation for new entities
- JSON field parsing and stringification
- Query parameter transformation
- Cache management integration

### Entity Services

Entity services extend the BaseService to provide entity-specific functionality:

```javascript
// Example: Entity Service
export class ThingService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.THINGS, 
      collectionEndpoint,
      {
        jsonFields: ['metadata', 'current_state'],
        expandFields: ['location_id', 'edge_id']
      }
    )
  }
  
  // Entity-specific methods only
  getThingsByLocation(locationId) { /* ... */ }
  updateThingState(id, state, merge = true) { /* ... */ }
  updateThingPosition(id, coordinates) { /* ... */ }
}
```

Entity services focus on providing only entity-specific functionality:

1. **EdgeService**: Edge-specific operations
2. **LocationService**: Location-specific operations
3. **ThingService**: Thing-specific operations
4. **ClientService**: Client-specific operations
5. **TopicPermissionService**: Topic permission-specific operations
6. **UserService**: User profile-specific operations
7. **OrganizationService**: Organization-specific operations

### Type Services

Type services manage entity type definitions using the same pattern:

1. **TypeService**: Base service for all type entities
2. **EdgeTypeService**: Edge type-specific functionality
3. **EdgeRegionService**: Edge region-specific functionality
4. **LocationTypeService**: Location type-specific functionality
5. **ThingTypeService**: Thing type-specific functionality

### Configuration Service

The ConfigService centralizes all configuration and URL construction:

```javascript
// src/services/config/configService.js
class ConfigService {
  constructor() {
    this.env = {
      API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/pb',
      // ... other environment variables
    }
  }
  
  getApiBaseUrl() {
    return this.env.API_URL
  }
  
  getCollectionEndpoint(collection, recordId = null) {
    const base = `/api/collections/${collection}/records`
    return recordId ? `${base}/${recordId}` : base
  }
  
  getFileUrl(collection, recordId, filename, params = {}) {
    let fileUrl = `${this.env.API_URL}/api/files/${collection}/${recordId}/${filename}`
    
    const queryParams = new URLSearchParams(params)
    if (queryParams.toString()) {
      fileUrl += `?${queryParams.toString()}`
    }
    
    return fileUrl
  }
}
```

## API Interaction Pattern

The application uses a standardized pattern for API interactions:

### Service Layer
- BaseService handles common CRUD operations
- Entity services provide entity-specific operations
- ConfigService manages all URL construction
- Parameter transformation follows a strategy pattern

### Composable Layer
- useApiOperation provides standardized operation handling
- Entity composables use useApiOperation for API interactions
- Loading states and error handling are consistent
- Toast notifications follow a standard pattern

### Component Layer
- Components use composables instead of calling services directly
- Components focus on UI rendering and user interaction
- Business logic is delegated to composables

This pattern ensures:
- Consistent loading state management
- Standardized error handling
- Uniform user feedback through toast notifications
- DRY code by removing duplicate API handling

## Error Handling

The application uses a consistent approach to error handling through the `useApiOperation` composable:

```javascript
// Standard error handling pattern
const fetchEntities = async (params = {}) => {
  return performOperation(
    () => entityService.getList(params),
    {
      loadingRef: loading,
      errorRef: error,
      errorMessage: 'Failed to load entities',
      collection: 'entities',
      onSuccess: (response) => {
        entities.value = response.data.items || []
        return entities.value
      }
    }
  )
}
```

This ensures:
1. **Service Layer**: Handles API errors with consistent error transformation
2. **Composable Layer**: Manages error state and provides user feedback
3. **Component Layer**: Displays appropriate error messages to users
4. **Global Handler**: Catches uncaught errors in the Axios interceptors

## View Patterns

Views follow consistent patterns based on their purpose:

### List Views

```vue
<template>
  <div>
    <PageHeader title="Entities" subtitle="Manage your entities">
      <template #actions>
        <Button 
          label="Create Entity" 
          icon="pi pi-plus" 
          @click="navigateToEntityCreate" 
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable 
        :items="entities"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['name', 'code']"
        title="Entities"
        empty-message="No entities found"
        @row-click="(data) => navigateToEntityDetail(data.id)"
        :paginated="true"
        :rows="10"
      >
        <!-- Table customizations -->
      </DataTable>
    </div>
    
    <!-- Confirmation Dialog -->
    <ConfirmationDialog />
    
    <!-- Toast -->
    <Toast />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useEntity } from '../../composables/useEntity'
import { useDeleteConfirmation } from '../../composables/useConfirmation'

// Get entity functionality from composable
const { 
  entities,
  loading,
  fetchEntities,
  deleteEntity,
  navigateToEntityDetail,
  navigateToEntityCreate
} = useEntity()

// Get delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Fetch entities on component mount
onMounted(async () => {
  await fetchEntities()
})
</script>
```

### Detail Views

Detail views follow a similar pattern with standardized loading and error handling via composables.

### Create and Edit Views

Form views use the specialized form composables for handling form state, validation, and submission through the standardized API operation pattern.

## State Management

The application uses a combination of approaches for state management:

1. **Pinia Stores**: For global state (auth, settings, types, cache)
2. **Composables**: For entity-specific state and operations
3. **Component State**: For UI-specific state that doesn't need to be shared

## Best Practices

The architecture enforces several best practices:

1. **DRY Principle**: Common patterns in `useApiOperation` and BaseService prevent code duplication.

2. **Single Responsibility**: Entity services focus on entity-specific functionality with common CRUD operations handled by the BaseService.

3. **Consistent Error Handling**: The standardized error handling in `useApiOperation` provides a uniform approach across the application.

4. **Automatic Organization Context**: The BaseService automatically adds organization_id to created entities.

5. **Separation of Concerns**: 
   - Services handle data access and API interactions
   - Composables manage state and provide business logic
   - Views focus on UI rendering and user interaction

6. **Extension Over Modification**: Base classes and composables are extended rather than modified or duplicated.

7. **Toast Notification Standardization**: The toast notification pattern in `useApiOperation` ensures consistent user feedback.

8. **Centralized Configuration**: ConfigService manages all URL construction and environment variables.

## Feature Development Workflow

When adding a new feature or entity:

1. **Define Service**:
   - Create a new directory in `services/` for the entity
   - Implement entity service extending BaseService
   - Configure JSON fields and expand fields if needed
   - Export from central `services/index.js`

2. **Create Composables**:
   - Create entity composable using `useApiOperation`
   - Create form composable for form handling
   - Integrate with `useReactiveData` for caching

3. **Implement Views**:
   - Create List, Detail, Create, and Edit views
   - Use composables for data and logic

4. **Register Routes**:
   - Add routes to router configuration

5. **Update Navigation**:
   - Add navigation items to sidebar as needed

## Conclusion

This architecture document provides a comprehensive overview of the IoT Platform UI codebase organization and design patterns. By following these established patterns, developers can maintain consistency and improve maintainability when extending the application with new features.

The architecture is based on Vue 3's Composition API, emphasizing reusable composables, a strong service layer with automatic organization context, centralized API operation handling, and consistent UI patterns across the application. This approach promotes separation of concerns and makes the codebase more maintainable and extensible while following DRY principles.
