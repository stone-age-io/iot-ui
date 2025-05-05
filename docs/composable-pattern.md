# Composable Pattern Implementation

## Overview

The IoT Platform makes extensive use of Vue.js composables as a core architectural pattern. Composables are functions that encapsulate and reuse stateful logic, following Vue's Composition API approach. This pattern promotes code reuse, separation of concerns, and enhances maintainability.

## Core Composable Architecture

The application builds on two central composable patterns that should be integrated into all entity-based components:

1. **API Operation Handling**: Using `useApiOperation` for consistent API interactions
2. **Reactive Data Caching**: Using `useReactiveData` for efficient data caching and state management

These patterns work together to provide a comprehensive approach to data management.

## Key Composables

### API Operation Composable

The `useApiOperation` composable standardizes all API interactions with consistent loading states, error handling, and success notifications. This is a key architectural improvement that centralizes API operation handling across the application:

```javascript
// src/composables/useApiOperation.js
export function useApiOperation() {
  const toast = useToast()
  const cacheStore = useCacheStore()

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
      
      // Update cache store timestamp if collection is specified
      if (collection && response && !response.skipCacheUpdate) {
        cacheStore.updateTimestamp(collection)
      }
      
      // Skip loading indicator immediately if response is from cache
      if (response?.fromCache && loadingRef) {
        loadingRef.value = false
      }

      // Show success toast if provided (only for non-cache responses)
      if (successMessage && !response?.fromCache) {
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

      // Return a default value or rethrow
      return null
    } finally {
      // Reset loading state if not already done for cached responses
      if (loadingRef && !(response?.fromCache)) {
        loadingRef.value = false
      }
      
      // End refresh state in cache store if it was started
      if (cacheStore.isRefreshing) {
        cacheStore.endRefresh()
      }
    }
  }
  
  // Specialized operation functions (create, update, delete) follow...
  
  return {
    performOperation,
    performCreate,
    performUpdate,
    performDelete
  }
}
```

### Reactive Data Composable

The `useReactiveData` composable integrates with the cache system to provide reactive data management:

```javascript
// src/composables/useReactiveData.js
export function useReactiveData(options) {
  const {
    collection,
    operation,
    id = null,
    fetchFunction,
    processData = data => data
  } = options
  
  // API operation composable for loading/error handling
  const { performOperation } = useApiOperation()
  
  // Get the cache store
  const cacheStore = useCacheStore()
  
  // Local state
  const loading = ref(true)
  const error = ref(null)
  const initialLoadComplete = ref(false)
  const data = ref(null)
  
  // Get timestamp from the cache store
  const timestamp = computed(() => cacheStore.lastUpdated[collection])
  
  /**
   * Load data from API (initial load)
   */
  const loadData = async () => {/* ... */}
  
  /**
   * Refresh data (manual refresh)
   * @param {boolean} skipCache - Whether to skip cache and force fresh data
   */
  const refreshData = async (skipCache = true) => {/* ... */}
  
  /**
   * Manually update the data in the reactive state and cache store
   */
  const updateData = (newData) => {/* ... */}
  
  // Automatic cache updates and component lifecycle management...
  
  return {
    data,
    loading,
    error,
    refreshData,
    updateData,
    timestamp
  }
}
```

## Standard Entity Composable Pattern

Entity composables should follow this standard pattern, integrating both `useApiOperation` and `useReactiveData`:

```javascript
// Example: Entity Composable Template
export function useEntity() {
  const router = useRouter()
  const { performOperation, performDelete } = useApiOperation()
  
  // Common state
  const loading = ref(false)
  const error = ref(null)
  
  // Set up reactive data from the cache store
  const entitiesData = useReactiveData({
    collection: 'entities',  // The collection name for caching
    operation: 'list',       // Operation type (list or detail)
    fetchFunction: fetchEntitiesRaw,  // Raw fetch function
    processData: data => data?.items || []  // Data processing function
  })
  
  // Expose entities as a computed property from reactive cache
  const entities = computed(() => entitiesData.data.value || [])
  
  /**
   * Raw function to fetch entities - used internally by useReactiveData
   * @param {Object} options - Fetch options including skipCache flag
   * @returns {Promise<Object>} - Response from API
   */
  async function fetchEntitiesRaw(options = {}) {
    return await entityService.getList({
      ...options,
      skipCache: options?.skipCache
    })
  }
  
  /**
   * Fetch all entities with optional filtering
   * Maintains backward compatibility while using the reactive cache
   * 
   * @param {Object} params - Optional query params
   * @returns {Promise<Array>} - List of entities
   */
  const fetchEntities = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // If user explicitly wants fresh data or provides filters
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
   * Fetch a single entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<Object>} - Entity data
   */
  const fetchEntity = async (id) => {
    if (!id) {
      error.value = 'Invalid entity ID'
      return null
    }
    
    return performOperation(
      () => entityService.getById(id),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load entity details',
        collection: 'entities', // Specify collection for cache updates
        onSuccess: (response) => response.data
      }
    )
  }
  
  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @param {string} code - Entity code for display
   * @returns {Promise<boolean>} - Success status
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
        collection: 'entities', // Specify collection for cache updates
        onSuccess: async () => {
          // Force refresh to update the UI
          await entitiesData.refreshData(true)
          return true
        }
      }
    )
  }
  
  // Other CRUD operations and navigation methods...
  
  return {
    // State
    entities,
    loading,
    error,
    
    // Operations
    fetchEntities,
    fetchEntity,
    deleteEntity,
    // ...other operations
  }
}
```

This pattern ensures:
- Consistent API operation handling through `useApiOperation`
- Efficient cache management with `useReactiveData`
- Reactive UI updates when data changes
- Reduced network traffic by using cached data where appropriate
- Automatic cache invalidation when data is modified

## Entity-Specific Composables

Each entity type should have a dedicated composable that follows the standard pattern:

### Edge Entities

```javascript
// src/composables/useEdge.js
export function useEdge() {
  // Integration with useApiOperation and useReactiveData
  // Edge-specific functions and state management
}
```

### Location Entities

```javascript
// src/composables/useLocation.js
export function useLocation() {
  // Integration with useApiOperation and useReactiveData
  // Location-specific functions and state management
}
```

### Thing Entities

```javascript
// src/composables/useThing.js
export function useThing() {
  // Integration with useApiOperation and useReactiveData
  // Thing-specific functions and state management
}
```

### Organization Management

```javascript
// src/composables/useOrganization.js
export function useOrganization() {
  // Integration with useApiOperation and useReactiveData
  // Organization-specific functions and state management
}
```

### Type Management

```javascript
// src/composables/useTypeManagement.js
export function useTypeManagement(typeService, routeNames, entityName) {
  // Base implementation for all type management
  // Integration with useApiOperation and useReactiveData
  // Type management common functions
}
```

## Form Composables

Form composables leverage the `useApiOperation` pattern for submission handling, but typically don't need `useReactiveData` since forms represent transient state:

```javascript
// Example: Form Composable
export function useEntityForm(mode = 'create') {
  const { performOperation } = useApiOperation()
  
  // Form data and validation
  const entity = ref({ /* ... */ })
  const v$ = useVuelidate(rules, entity)
  const loading = ref(false)
  
  // Form submission with API operation handling
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
        successMessage: `Entity has been ${mode === 'create' ? 'created' : 'updated'}`,
        collection: 'entities', // For cache invalidation
        onSuccess: (response) => {
          router.push({ name: 'entity-detail', params: { id: response.data.id } })
          return true
        },
        onError: () => false
      }
    )
  }
  
  // ...other form methods
}
```

## Utility Composables

Utility composables provide specialized functionality:

- `useTheme`: Manages theme settings and provides theme-aware styling
- `useConfirmation`: Handles confirmation dialogs and user prompts
- `useDataTable`: Manages PrimeVue DataTable state and operations
- `useFloorPlanMap`: Handles floor plan visualization
- `useGlobalMap`: Manages global map visualization with markers
- `useMessages`: Manages device messages and states
- `useNatsMessages`: Handles NATS message subscriptions

## Composable Integration with Views

Views should use composables to access functionality rather than directly calling services:

```javascript
// Example component using composables
import { defineComponent } from 'vue'
import { useEdge } from '@/composables/useEdge'
import { useConfirmation } from '@/composables/useConfirmation'

export default defineComponent({
  setup() {
    // Entity operations
    const { 
      edges, 
      loading, 
      fetchEdges, 
      deleteEdge 
    } = useEdge()
    
    // Confirmation dialog
    const { 
      confirmDelete, 
      deleteDialog 
    } = useConfirmation()
    
    // Initialize
    onMounted(() => {
      fetchEdges()
    })
    
    // Handle delete operation
    const handleDelete = async (edge) => {
      confirmDelete(edge, 'Edge', 'code')
    }
    
    // Delete confirmation handler
    const confirmDeleteEdge = async () => {
      if (deleteDialog.value.item) {
        await deleteEdge(
          deleteDialog.value.item.id, 
          deleteDialog.value.item.code
        )
      }
    }
    
    return {
      edges,
      loading,
      handleDelete,
      deleteDialog,
      confirmDeleteEdge
    }
  }
})
```

## Benefits of the Composable Pattern

1. **Code Reuse**: Logic is encapsulated and reused across components
2. **Separation of Concerns**: Business logic is separated from UI components
3. **Testability**: Composables can be tested independently
4. **Maintainability**: Each composable has a single responsibility
5. **Flexibility**: Composables can be composed together for complex functionality
6. **Type Safety**: TypeScript integration is enhanced with well-defined return types
7. **Performance**: Reactive caching reduces API calls and improves user experience
8. **Consistency**: Standardized patterns for API operations and error handling

## Type Management Integration

Entity composables integrate with the `useTypesStore` for consistent type handling:

```javascript
// Excerpt from useEdge.js
export function useEdge() {
  const typesStore = useTypesStore()
  
  // Load edge types and regions
  typesStore.loadEdgeTypes()
  typesStore.loadEdgeRegions()
  
  // Use computed properties from store
  const edgeTypes = computed(() => typesStore.edgeTypes)
  const edgeRegions = computed(() => typesStore.edgeRegions)
  
  // Helper functions using store data
  const getTypeName = (typeCode) => {
    return typesStore.getTypeName(typeCode, 'edgeTypes')
  }
  
  // Rest of composable...
}
```

## Best Practices

1. **Always use `useApiOperation` for API interactions**
   - This ensures consistent loading states, error handling, and user feedback

2. **Use `useReactiveData` for entity collections**
   - Provides efficient caching and reactive updates

3. **Follow the standard entity composable pattern**
   - Implement both the raw fetch function and the public fetch function
   - Use computed properties to expose reactive data

4. **Specify collection names for cache invalidation**
   - Always include the `collection` parameter in `performOperation` calls

5. **Force cache refreshes after mutations**
   - Call `refreshData(true)` after create/update/delete operations

6. **Keep composables focused on a single entity type**
   - Each entity type should have its own dedicated composable

7. **Leverage centralized stores for shared data**
   - Use Pinia stores for data that needs to be shared across multiple composables

## Conclusion

The composable pattern is fundamental to the IoT Platform's architecture. It provides a clean, maintainable approach to managing complex state and operations while promoting code reuse. By organizing functionality into focused composables that leverage both `useApiOperation` and `useReactiveData`, the application achieves a logical separation of concerns that makes the codebase easier to maintain and extend.
