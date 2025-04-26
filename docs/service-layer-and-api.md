# Service Layer and API Interactions

## Overview

The IoT Platform implements a sophisticated service layer that abstracts API interactions and standardizes CRUD operations. This service architecture ensures consistent API handling while reducing code duplication and improving maintainability.

## Base Service Pattern

At the foundation of the service layer is the `BaseService` class, which provides common functionality for all entity services:

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
  getList(params = {}) {
    // Transform parameters if needed
    const transformedParams = this.transformParams({
      // Default params
      page: 1,
      perPage: 50,
      sort: '-created',
      ...params
    }, params)
    
    return apiHelpers.get(this.collectionEndpoint(), {
      params: transformedParams
    }).then(response => {
      return this.processResponse(response)
    })
  }
  
  getById(id) {
    return apiHelpers.get(`${this.collectionEndpoint()}/${id}`).then(response => {
      return this.processResponse(response)
    })
  }
  
  create(entity) {
    // Stringify JSON fields
    const preparedEntity = this.stringifyJsonFields(entity)
    
    return apiHelpers.post(this.collectionEndpoint(), preparedEntity).then(response => {
      return this.processResponse(response)
    })
  }
  
  update(id, entity) {
    // Stringify JSON fields
    const preparedEntity = this.stringifyJsonFields(entity)
    
    return apiHelpers.patch(`${this.collectionEndpoint()}/${id}`, preparedEntity).then(response => {
      return this.processResponse(response)
    })
  }
  
  delete(id) {
    return apiHelpers.delete(`${this.collectionEndpoint()}/${id}`)
  }

  // Process API response
  processResponse(response) {
    // Handle array responses (lists)
    if (response.data && Array.isArray(response.data.items)) {
      response.data.items = response.data.items.map(item => {
        // Parse JSON fields
        return this.parseJsonFields(item)
      })
    } 
    // Handle single item responses
    else if (response.data) {
      // Parse JSON fields
      response.data = this.parseJsonFields(response.data)
    }
    
    return response
  }

  // JSON field handling
  parseJsonFields(entity) {
    const result = { ...entity }
    
    // Parse specified JSON fields
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field])
        } catch (error) {
          console.warn(`Failed to parse ${field} as JSON:`, error)
          result[field] = {}
        }
      }
    })
    
    return result
  }
  
  stringifyJsonFields(entity) {
    const result = { ...entity }
    
    // Stringify specified JSON fields
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'object') {
        result[field] = JSON.stringify(result[field])
      }
    })
    
    return result
  }

  // Parameter transformation
  transformParams(transformedParams, originalParams) {
    // Handle expansion fields
    if (this.options.expandFields.length > 0 && !originalParams.expand) {
      transformedParams.expand = this.options.expandFields.join(',')
    }
    
    return transformedParams
  }
}
```

This BaseService provides:

1. **Standardized CRUD Operations**: Common methods for all entities
2. **JSON Handling**: Automatic parsing and stringification of JSON fields
3. **Parameter Transformation**: Consistent handling of query parameters

## Entity Services

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
  
  // Entity-specific methods
  getThingsByLocation(locationId) { /* ... */ }
  updateThingState(id, state, merge = true) { /* ... */ }
  updateThingPosition(id, coordinates) { /* ... */ }
}
```

Entity services rely on the BaseService for standard CRUD operations and focus on providing only entity-specific functionality:

1. **EdgeService**: Edge-specific operations
2. **LocationService**: Location-specific operations
3. **ThingService**: Thing-specific operations
4. **ClientService**: Client-specific operations
5. **TopicPermissionService**: Topic permission-specific operations
6. **UserService**: User profile-specific operations

### Type Services

Type services manage entity type definitions using the same pattern:

1. **TypeService**: Base service for all type entities
2. **EdgeTypeService**: Edge type-specific functionality
3. **EdgeRegionService**: Edge region-specific functionality
4. **LocationTypeService**: Location type-specific functionality
5. **ThingTypeService**: Thing type-specific functionality

### Utility Services

Utility services provide additional functionality:

1. **apiHelpers**: Axios wrapper for API requests
2. **natsService**: Manages NATS messaging connections
3. **natsConfigService**: Manages NATS configuration storage
4. **natsConnectionManager**: Manages NATS connection lifecycle

## API Interaction Pattern

The application uses a standardized pattern for API interactions:

### Service Layer
- BaseService handles common CRUD operations
- Entity services provide entity-specific operations
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

Detail views follow a similar pattern with standardized loading and error handling via composables.

### Create and Edit Views

Form views use the specialized form composables for handling form state, validation, and submission through the standardized API operation pattern.

## Best Practices

The architecture enforces several best practices:

1. **DRY Principle**: Common patterns in `useApiOperation` and BaseService help prevent code duplication.

2. **Single Responsibility**: Entity services focus on entity-specific functionality with common CRUD operations handled by the BaseService.

3. **Consistent Error Handling**: The standardized error handling in `useApiOperation` provides a uniform approach across the application.

4. **Separation of Concerns**: 
   - Services handle data access and API interactions
   - Composables manage state and provide business logic
   - Views focus on UI rendering and user interaction

5. **Extension Over Modification**: Base classes and composables are extended rather than modified or duplicated.

6. **Toast Notification Standardization**: The toast notification pattern in `useApiOperation` ensures consistent user feedback.

7. **Avoid Direct Dependencies**: Composables do not directly depend on specific view components, and views do not directly use services.

## Feature Development Workflow

When adding a new feature or entity:

1. **Define Service**:
   - Create a new directory in `services/` for the entity
   - Implement entity service extending BaseService
   - Export from central `services/index.js`

2. **Create Composables**:
   - Create entity composable using `useApiOperation`
   - Create form composable for form handling

3. **Implement Views**:
   - Create List, Detail, Create, and Edit views
   - Use composables for data and logic

4. **Register Routes**:
   - Add routes to router configuration

5. **Update Navigation**:
   - Add navigation items to sidebar as needed

## Conclusion

This architecture document provides a comprehensive overview of the IoT Platform UI codebase organization and design patterns. By following these established patterns, developers can maintain consistency and improve maintainability when extending the application with new features.

The architecture is based on Vue 3's Composition API, emphasizing reusable composables, a strong service layer, centralized API operation handling, and consistent UI patterns across the application. This approach promotes separation of concerns and makes the codebase more maintainable and extensible while following DRY principles.
