# IoT Platform UI: Architecture Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Recent Improvements](#recent-improvements)
4. [Service Layer](#service-layer)
    - [Base Service Pattern](#base-service-pattern)
    - [Field Mapping](#field-mapping)
    - [Entity Services](#entity-services)
5. [Composables](#composables)
    - [API Operation Pattern](#api-operation-pattern)
    - [Entity Composables](#entity-composables)
    - [Form Composables](#form-composables)
    - [Utility Composables](#utility-composables)
6. [Integration Patterns](#integration-patterns)
    - [Composable-Service Integration](#composable-service-integration)
    - [View-Composable Integration](#view-composable-integration)
7. [Best Practices](#best-practices)

## Introduction

This document provides detailed information about the architecture of the IoT Platform UI, with a focus on the composables and service layer that form the backbone of the application. The architecture has been recently improved to enhance maintainability, reduce duplication, and provide consistent patterns across the codebase.

The improved architecture follows Vue 3's Composition API patterns and implements a structured approach to API interactions through a streamlined service layer.

## Architecture Overview

The application is built with a clear separation of concerns:

- **Views**: Page components connected to routes
- **Components**: Reusable UI elements
- **Composables**: Reusable business logic using Vue's Composition API
- **Services**: Encapsulated API interactions
- **Stores**: Global state management with Pinia

## Recent Improvements

The codebase has undergone several significant improvements to enhance maintainability and reduce code duplication:

1. **Common API Operation Handler** - A new `useApiOperation` composable centralizes API operation handling, including loading states, error management, and toast notifications.

2. **Removal of Duplicate Entity Service Methods** - Service methods that simply passed through to the base service without adding functionality have been removed to reduce redundancy.

3. **Enhanced Field Mapping in BaseService** - The BaseService now includes standardized field mapping between API and client fields, ensuring consistency across all services.

## Service Layer

### Base Service Pattern

All entity services are built upon a common BaseService class that provides standard CRUD operations and handles field mapping.

```javascript
// src/services/base/BaseService.js
export class BaseService {
  constructor(collectionName, collectionEndpoint, options = {}) {
    this.collectionName = collectionName;
    this.collectionEndpoint = collectionEndpoint;
    this.options = {
      jsonFields: [], // Fields to be parsed/stringified as JSON
      expandFields: [], // Fields to expand in queries
      fieldMappings: {}, // Field mappings between API and client fields
      ...options
    };
  }

  // CRUD Operations
  getList(params = {}) { /* ... */ }
  getById(id) { /* ... */ }
  create(entity) { /* ... */ }
  update(id, entity) { /* ... */ }
  delete(id) { /* ... */ }

  // Field mapping methods
  mapApiToClientFields(apiData) { /* ... */ }
  mapClientToApiFields(clientData) { /* ... */ }

  // Utility methods
  parseJsonFields(entity) { /* ... */ }
  stringifyJsonFields(entity) { /* ... */ }
  transformParams(transformedParams, originalParams) { /* ... */ }
}
```

The BaseService provides:

- Standardized CRUD operations (getList, getById, create, update, delete)
- JSON field parsing and stringification
- Field mapping between API and client formats
- Query parameter transformation
- Extension points for entity-specific services

### Field Mapping

A key improvement is the standardized field mapping mechanism in the BaseService. This allows for consistent handling of field names between the API and client:

```javascript
// Field mapping example in ThingService
constructor() {
  super(
    COLLECTIONS.THINGS, 
    collectionEndpoint,
    {
      jsonFields: ['metadata', 'current_state'],
      expandFields: ['location_id', 'edge_id'],
      fieldMappings: {
        'code': 'thing_code',
        'type': 'thing_type'
      }
    }
  )
}
```

The mapping system:
- Automatically converts API field names to client field names when retrieving data
- Converts client field names back to API field names when sending data
- Works seamlessly with all CRUD operations
- Reduces the need for custom mapping code in entity services

### Entity Services

Entity services extend the BaseService to provide entity-specific functionality while leveraging the base functionality:

```javascript
// Example: Simplified ThingService
export class ThingService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.THINGS, 
      collectionEndpoint,
      {
        jsonFields: ['metadata', 'current_state'],
        expandFields: ['location_id', 'edge_id'],
        fieldMappings: {
          'code': 'thing_code',
          'type': 'thing_type'
        }
      }
    )
  }
  
  // Entity-specific methods only
  getThingsByLocation(locationId) { /* ... */ }
  updateThingState(id, state, merge = true) { /* ... */ }
  updateThingPosition(id, coordinates) { /* ... */ }
}
```

Entity services now:
- Avoid duplicating CRUD methods already provided by BaseService
- Focus on providing only entity-specific functionality
- Use field mappings to handle API/client field name differences
- Override transformParams when needed for entity-specific query transformations

## Composables

### API Operation Pattern

A major improvement is the introduction of the `useApiOperation` composable, which centralizes API operation handling across all entity composables:

```javascript
// src/composables/useApiOperation.js
export function useApiOperation() {
  const toast = useToast()

  const performOperation = async (operation, options) => {
    const {
      loadingRef,
      errorRef,
      errorMessage = 'Operation failed',
      successMessage,
      onSuccess,
      onError
    } = options

    // Set loading state
    if (loadingRef) loadingRef.value = true
    if (errorRef) errorRef.value = null

    try {
      // Perform the operation
      const response = await operation()

      // Handle success
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
      // Handle error
      console.error(`Error: ${errorMessage}`, err)
      if (errorRef) errorRef.value = errorMessage
      
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

  // Specialized operation handlers
  const performCreate = async (operation, options) => { /* ... */ }
  const performUpdate = async (operation, options) => { /* ... */ }
  const performDelete = async (operation, options) => { /* ... */ }

  return {
    performOperation,
    performCreate,
    performUpdate,
    performDelete
  }
}
```

This pattern:
- Centralizes loading state management
- Standardizes error handling
- Provides consistent toast notifications
- Supports success and error callbacks
- Offers specialized versions for common operations (create, update, delete)

### Entity Composables

Entity composables now use the `useApiOperation` composable to handle API interactions:

```javascript
// Example: Simplified useEdge.js
export function useEdge() {
  const router = useRouter()
  const { performOperation, performDelete } = useApiOperation()
  
  // State
  const edges = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // CRUD operations with streamlined API handling
  const fetchEdges = async (params = {}) => {
    return performOperation(
      () => edgeService.getList({ 
        withMetadata: true,
        sort: '-created',
        ...params
      }),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load edges',
        onSuccess: (response) => {
          edges.value = response.data.items || []
          return edges.value
        }
      }
    )
  }
  
  const deleteEdge = async (id, code) => {
    return performDelete(
      () => edgeService.delete(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to delete edge',
        entityName: 'Edge',
        entityIdentifier: code
      }
    )
  }
  
  // ...other methods
  
  return {
    // State and methods
  }
}
```

Benefits of this approach:
- Reduces boilerplate code for API operations
- Ensures consistent handling of loading states and errors
- Provides standardized user feedback via toast notifications
- Makes composables more focused on business logic rather than API interaction details

### Form Composables

Form composables leverage the same `useApiOperation` pattern for submission handling:

```javascript
// Example: Simplified useEdgeForm.js
export function useEdgeForm(mode = 'create') {
  const { performOperation } = useApiOperation()
  
  // Form data and validation
  const edge = ref({ /* ... */ })
  const v$ = useVuelidate(rules, edge)
  const loading = ref(false)
  
  // Form submission with simplified API handling
  const submitForm = async () => {
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    const edgeData = { /* ... */ }
    
    return performOperation(
      () => mode === 'create' 
        ? edgeService.create(edgeData)
        : edgeService.update(edge.value.id, edgeData),
      {
        loadingRef: loading,
        errorRef: null,
        errorMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} edge`,
        successMessage: `Edge ${edge.value.code} has been ${mode === 'create' ? 'created' : 'updated'}`,
        onSuccess: (response) => {
          router.push({ name: 'edge-detail', params: { id: response.data.id } })
          return true
        },
        onError: () => false
      }
    )
  }
  
  // ...other methods
  
  return {
    // Form state and methods
  }
}
```

### Utility Composables

Utility composables provide specialized functionality such as confirmation dialogs, dashboard data, and settings management:

- `useConfirmation` / `useDeleteConfirmation`: Manages confirmation dialogs
- `useDashboard`: Aggregates data for dashboard views
- `useNatsSettings` / `useNatsMessages`: Manages NATS messaging settings and subscriptions
- `useMessages`: Handles device messages and states
- `useTypeManagement`: Base composable for all type management

These utility composables also benefit from the `useApiOperation` pattern when they interact with services.

## Integration Patterns

### Composable-Service Integration

Composables interact with services using the `useApiOperation` pattern:

```javascript
const fetchItems = async (params = {}) => {
  return performOperation(
    () => itemService.getItems(params),
    {
      loadingRef: loading,
      errorRef: error,
      errorMessage: 'Failed to load items',
      onSuccess: (response) => {
        items.value = response.data.items || [];
        return items.value;
      }
    }
  );
};
```

### View-Composable Integration

Views use composables to access functionality and state:

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useEntity } from '../../composables/useEntity';

// Use the entity composable
const { 
  entities, 
  loading, 
  fetchEntities,
  navigateToEntityDetail
} = useEntity();

// Initialize filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Fetch data on mount
onMounted(() => {
  fetchEntities();
});
</script>
```

## Best Practices

The improved architecture enforces several best practices:

1. **DRY Principle**: Avoid duplicating code by using the common patterns in `useApiOperation` and BaseService field mapping.

2. **Single Responsibility**: Entity services focus on entity-specific functionality instead of duplicating CRUD operations.

3. **Consistent Error Handling**: Use the standardized error handling in `useApiOperation` instead of implementing custom error handling.

4. **Field Mapping**: Use the field mapping mechanism in BaseService to handle differences between API and client field names.

5. **Separation of Concerns**: 
   - Services handle data access and API interactions
   - Composables manage state and provide business logic
   - Views focus on UI rendering and user interaction

6. **Extension Over Modification**: Extend base classes and composables instead of modifying them or duplicating their functionality.

7. **Toast Notification Standardization**: Use the toast notification pattern in `useApiOperation` for consistent user feedback.

8. **Avoid Direct Dependencies**: Composables should not directly depend on specific view components, and views should not directly use services.

By following these patterns, the IoT Platform UI codebase achieves greater maintainability, reduced duplication, and a more consistent developer experience.
