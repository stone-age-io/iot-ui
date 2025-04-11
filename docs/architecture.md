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
│   └── index.js         # Central export point
├── stores/              # Pinia state stores
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

### Base Composables

Composables encapsulate reusable logic and follow this pattern:

```javascript
// src/composables/useEntity.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { entityService } from '../services'

/**
 * Composable for entity-related functionality
 * Centralizes entity operations, formatting helpers, and navigation
 */
export function useEntity() {
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

### Entity Composables

The application implements entity-specific composables for each entity type:

- **useEdge**: Encapsulates edge operations and styling
- **useLocation**: Encapsulates location operations and styling
- **useThing**: Encapsulates IoT device operations and styling
- **useClient**: Encapsulates messaging client operations
- **useTopicPermission**: Encapsulates MQTT topic permission operations

### Type Management Composables

Type management utilizes a base composable with specializations:

- **useTypeManagement**: Base reusable composable for all type management
- **useEdgeType**: Specialized for edge type operations
- **useEdgeRegion**: Specialized for edge region operations
- **useLocationType**: Specialized for location type operations
- **useThingType**: Specialized for thing type operations

### Form Composables

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

Form composables include:

- **useEdgeForm**: Form handling for edge entities
- **useLocationForm**: Form handling for location entities
- **useThingForm**: Form handling for thing entities
- **useTypeForm**: Generic form handling for all type entities
- **useProfileForm**: Form handling for user profile

### Utility Composables

The application includes several utility composables:

- **useConfirmation**: Manages confirmation dialogs
- **useDeleteConfirmation**: Specialized for delete confirmations
- **useDashboard**: Handles dashboard data and activities
- **useMessages**: Manages device messages and status
- **useNatsMessages**: Handles NATS message subscriptions and display
- **useNatsSettings**: Manages NATS connection settings
- **useUserProfile**: Handles user profile operations

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

  // CRUD Operations
  getList(params = {}) { /* ... */ }
  getById(id) { /* ... */ }
  create(entity) { /* ... */ }
  update(id, entity) { /* ... */ }
  delete(id) { /* ... */ }

  // Utility methods
  parseJsonFields(entity) { /* ... */ }
  stringifyJsonFields(entity) { /* ... */ }
  transformParams(transformedParams, originalParams) { /* ... */ }
}
```

### Entity Services

Entity services extend the BaseService to provide entity-specific functionality:

1. **EdgeService**: Manages edge entities
2. **LocationService**: Manages location entities
3. **ThingService**: Manages thing entities
4. **ClientService**: Manages messaging client entities
5. **TopicPermissionService**: Manages topic permission entities
6. **UserService**: Manages user profile operations

### Type Services

Type services manage entity type definitions:

1. **TypeService**: Base service for all type entities
2. **EdgeTypeService**: Manages edge type definitions
3. **EdgeRegionService**: Manages edge region definitions
4. **LocationTypeService**: Manages location type definitions
5. **ThingTypeService**: Manages thing type definitions

### Utility Services

Utility services provide additional functionality:

1. **apiHelpers**: Axios wrapper for API requests
2. **natsService**: Manages NATS messaging connections
3. **natsConfigService**: Manages NATS configuration storage
4. **natsConnectionManager**: Manages NATS connection lifecycle
5. **toastService**: Centralizes toast notifications

### Central Service Export

All services are exported from a central index.js:

```javascript
// src/services/index.js
import { apiHelpers } from './api';

// Entity services
import { edgeService, edgeRegions, edgeTypes, validateEdgeCode, generateEdgeCode } from './edge/edgeService';
import { locationService, locationTypes, parseLocationPath, validateLocationCode, generateLocationCode, locationLevels, locationZones } from './location/locationService';
import { thingService, thingTypes, validateThingCode, generateThingCode, getThingTypeAbbreviation } from './thing/thingService';
import { clientService, generateClientUsername, generateSecurePassword } from './client/clientService';
import { topicPermissionService, validateTopic } from './topic-permission/topicPermissionService';
import { userService } from './user/userService';

// Type management services
import { edgeTypeService } from './type/edgeTypeService';
import { edgeRegionService } from './type/edgeRegionService';
import { locationTypeService } from './type/locationTypeService';
import { thingTypeService } from './type/thingTypeService';

// NATS services
import natsService from './nats/natsService';
import { natsConfigService } from './nats/natsConfigService';

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
  userService,
  
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
  validateTopic,
  
  // Type management services
  edgeTypeService,
  edgeRegionService,
  locationTypeService,
  thingTypeService,
  
  // NATS services
  natsService,
  natsConfigService
};
```

## View Patterns

Views follow consistent patterns based on their purpose:

### List Views

```vue
<!-- Example ListView using Composables -->
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
import DataTable from '../../components/common/DataTable.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Get entity functionality from composable
const { 
  entities,
  loading,
  fetchEntities,
  formatDate,
  deleteEntity,
  navigateToEntityList,
  navigateToEntityDetail,
  navigateToEntityCreate
} = useEntity()

// Get delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Fetch entities on component mount
onMounted(async () => {
  await fetchEntities()
})

// Handle delete operations
// ...
</script>
```

### Detail Views

```vue
<template>
  <div>
    <!-- Loading and Error States -->
    
    <!-- Entity Details -->
    <div v-else-if="entityData">
      <div class="flex justify-between items-start mb-6">
        <!-- Header with entity title -->
        
        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <Button icon="pi pi-pencil" label="Edit" @click="navigateToEntityEdit(entityData.id)" />
          <Button icon="pi pi-trash" label="Delete" @click="handleDeleteClick" />
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="card lg:col-span-2">
          <!-- Entity details -->
        </div>
        
        <!-- Stats/Info Card -->
        <div class="card">
          <!-- Entity metadata -->
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEntity } from '../../composables/useEntity'
import { useDeleteConfirmation } from '../../composables/useConfirmation'
// Other imports...

// Entity functionality
const { 
  loading, 
  error, 
  fetchEntity,
  deleteEntity,
  navigateToEntityList,
  navigateToEntityEdit
} = useEntity()

// Load entity on mount
onMounted(async () => {
  const id = route.params.id
  if (id) {
    const data = await fetchEntity(id)
    if (data) {
      entityData.value = data
    }
  }
})

// Handle delete operations
// ...
</script>
```

### Create Views

```vue
<template>
  <div>
    <PageHeader title="Create Entity" subtitle="Add a new entity">
      <template #actions>
        <Button label="Cancel" icon="pi pi-times" @click="$router.back()" />
      </template>
    </PageHeader>
    
    <div class="card">
      <EntityForm
        title="Entity Information"
        :loading="loading"
        submit-label="Create Entity"
        @submit="submitForm"
        @cancel="$router.back()"
      >
        <!-- Form fields -->
      </EntityForm>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { useEntityForm } from '../../composables/useEntityForm'
import { entityService } from '../../services'
// Other imports...

// Use the entity form composable
const { 
  entity, 
  v$, 
  loading, 
  submitForm 
} = useEntityForm('create')
</script>
```

### Edit Views

```vue
<template>
  <div>
    <!-- Loading and Error States -->
    
    <!-- Entity Edit Form -->
    <div v-else>
      <PageHeader title="Edit Entity" :subtitle="`Updating ${entity.name}`">
        <template #actions>
          <Button label="Cancel" icon="pi pi-times" @click="$router.back()" />
        </template>
      </PageHeader>
      
      <div class="card">
        <EntityForm
          title="Entity Information"
          :loading="loading"
          submit-label="Save Changes"
          @submit="submitForm"
          @cancel="$router.back()"
        >
          <!-- Form fields -->
        </EntityForm>
      </div>
      
      <!-- Toast for success/error messages -->
      <Toast />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEntity } from '../../composables/useEntity'
import { useEntityForm } from '../../composables/useEntityForm'
// Other imports...

// Get entity data fetching functionality
const { fetchEntity, error } = useEntity()

// Use the entity form composable in edit mode
const { 
  entity, 
  v$, 
  loading, 
  loadEntity,
  submitForm 
} = useEntityForm('edit')

// Initial loading state
const initialLoading = ref(true)

// Fetch entity data on component mount
onMounted(async () => {
  const id = route.params.id
  if (id) {
    try {
      const entityData = await fetchEntity(id)
      if (entityData) {
        loadEntity(entityData)
      }
    } finally {
      initialLoading.value = false
    }
  }
})
</script>
```

### Type Management Views

Type management views follow a consistent pattern across all entity types (EdgeType, EdgeRegion, LocationType, ThingType):

1. **TypeListView**: Shows a table of all type definitions with actions
2. **TypeDetailView**: Displays detailed information about a type definition
3. **TypeCreateView**: Form for creating new type definitions
4. **TypeEditView**: Form for editing existing type definitions (code is read-only)

These views leverage the common `useTypeManagement` and `useTypeForm` composables, with specialized composables like `useEdgeType`, `useLocationType`, etc. for type-specific functionality.

## API Interaction Pattern

API interactions are managed via the service layer and composables:

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
4. **Global Handler**: Catches uncaught errors in the Axios interceptors

Example error handling pattern:

```javascript
try {
  // API operation
} catch (error) {
  console.error('Error description:', error)
  error.value = 'User-friendly error message'
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: 'User-friendly error message',
    life: 3000
  })
} finally {
  loading.value = false
}
```

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

## Type System Extensions

The application has been extended with a comprehensive type system for managing different entity types:

1. **Edge Types**: Define different types of edge nodes (e.g., Building, Data Center)
2. **Edge Regions**: Define geographic regions for edges (e.g., North America, Europe)
3. **Location Types**: Define types of locations (e.g., Meeting Room, Work Area)
4. **Thing Types**: Define types of IoT devices (e.g., Temperature Sensor, Camera)

Each type system follows a consistent pattern:
- Create/Edit/List/Detail views
- Type-specific styling and display in the UI
- Code generation and validation
- Usage tracking (showing how many entities use each type)

## UI Consistency Patterns

The application maintains consistent UI patterns across all entity types:

1. **List Views**: DataTable with search, pagination, and row actions
2. **Detail Views**: Header with actions + grid layout with detailed information
3. **Form Views**: EntityForm component with consistent field layouts
4. **Confirmation Dialogs**: Consistent confirmation for destructive actions
5. **Toast Notifications**: Consistent feedback for user actions
6. **Loading States**: Spinner for loading, error messages for failures
7. **Style Previews**: Visual previews of how types will appear in the UI

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

## Conclusion

This architecture document provides a comprehensive overview of the IoT Platform UI codebase organization and design patterns. By following these established patterns, developers can maintain consistency and improve maintainability when extending the application with new features.

The architecture is based on Vue 3's Composition API, emphasizing reusable composables, a strong service layer, and consistent UI patterns across the application. This approach promotes separation of concerns and makes the codebase more maintainable and extensible.
