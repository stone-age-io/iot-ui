# useApiOperation

## Overview

The `useApiOperation` composable is the foundation of the IoT UI's API interaction layer. It centralizes API operation handling including loading states, error management, toast notifications, and cache invalidation. This composable ensures consistent behavior across all API operations in the application.

## Location

```
src/composables/useApiOperation.js
```

## Purpose

- **Standardize API Operations**: Consistent patterns for all API calls
- **Loading State Management**: Automatic loading state handling
- **Error Management**: Centralized error handling with user feedback
- **Cache Integration**: Automatic cache invalidation after data mutations
- **Toast Notifications**: Standardized success/error notifications
- **Organization Context**: Automatic organization scoping

## Dependencies

```javascript
import { useToast } from 'primevue/usetoast'
import { useCacheStore } from '@/stores/cacheStore'
```

## Returns

```javascript
{
  performOperation: Function,
  performCreate: Function,
  performUpdate: Function,
  performDelete: Function
}
```

---

## Methods

### performOperation(operation, options)

The core method that executes any API operation with standardized handling.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | `Function` | Yes | Function that returns a Promise (API call) |
| `options` | `Object` | Yes | Configuration options for the operation |

**Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `loadingRef` | `Ref<boolean>` | No | `null` | Vue ref for loading state |
| `errorRef` | `Ref<string\|null>` | No | `null` | Vue ref for error state |
| `errorMessage` | `string` | No | `'Operation failed'` | Default error message |
| `successMessage` | `string` | No | `null` | Success message for toast |
| `collection` | `string` | No | `null` | Collection name for cache invalidation |
| `onSuccess` | `Function` | No | `null` | Success callback function |
| `onError` | `Function` | No | `null` | Error callback function |

**Returns:** `Promise<any>` - Result from the operation or null on error

**Usage:**

```javascript
import { useApiOperation } from '@/composables/useApiOperation'

export function useEntity() {
  const { performOperation } = useApiOperation()
  const loading = ref(false)
  const error = ref(null)
  
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
}
```

### performCreate(operation, options)

Specialized method for create operations with entity-specific messaging.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | `Function` | Yes | Create operation function |
| `options` | `Object` | Yes | Configuration options |

**Additional Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `entityName` | `string` | No | `'item'` | Name of entity being created |
| `entityIdentifier` | `string` | No | `null` | Identifier value (e.g., code, name) |
| `collection` | `string` | No | `null` | Collection name for cache updates |

**Success Message:** Automatically generates message like "Edge ABC123 has been created"

**Usage:**

```javascript
const createEdge = async (edgeData) => {
  return performCreate(
    () => edgeService.create(edgeData),
    {
      loadingRef: loading,
      entityName: 'Edge',
      entityIdentifier: edgeData.code,
      collection: 'edges',
      onSuccess: (response) => {
        router.push({ name: 'edge-detail', params: { id: response.data.id } })
        return response.data
      }
    }
  )
}
```

### performUpdate(operation, options)

Specialized method for update operations with entity-specific messaging.

**Parameters:** Same as `performCreate` but for update operations.

**Success Message:** Automatically generates message like "Edge ABC123 has been updated"

**Usage:**

```javascript
const updateEdge = async (id, edgeData) => {
  return performUpdate(
    () => edgeService.update(id, edgeData),
    {
      loadingRef: loading,
      entityName: 'Edge',
      entityIdentifier: edgeData.code,
      collection: 'edges'
    }
  )
}
```

### performDelete(operation, options)

Specialized method for delete operations with entity-specific messaging.

**Parameters:** Same as `performCreate` but for delete operations.

**Success Message:** Automatically generates message like "Edge ABC123 has been deleted"

**Usage:**

```javascript
const deleteEdge = async (id, code) => {
  return performDelete(
    () => edgeService.delete(id),
    {
      loadingRef: loading,
      entityName: 'Edge',
      entityIdentifier: code,
      collection: 'edges'
    }
  )
}
```

---

## Features

### Automatic Loading State Management

The composable automatically manages loading states:

```javascript
// Loading is set to true when operation starts
loadingRef.value = true

try {
  const response = await operation()
  // Loading set to false on success
  loadingRef.value = false
} catch (error) {
  // Loading set to false on error
  loadingRef.value = false
}
```

### Cache Integration

When a `collection` is specified, the composable automatically:
- Invalidates the collection cache after successful mutations
- Triggers background refresh for cached data
- Maintains cache consistency across the application

```javascript
// Cache invalidation after successful create/update/delete
if (collection && cacheStore) {
  cacheStore.invalidateCollection(collection)
}
```

### Toast Notifications

Automatic toast notifications for user feedback:

**Success Toast:**
- Only shown for non-cached responses
- Uses provided `successMessage` or auto-generated message
- Green severity with 3-second duration

**Error Toast:**
- Always shown on operation failure
- Uses provided `errorMessage` or generic message
- Red severity with 3-second duration

### Error Handling

Comprehensive error handling with:
- Console logging of errors for debugging
- User-friendly error messages
- Error state management
- Graceful fallback on failure

```javascript
try {
  const response = await operation()
  return response
} catch (err) {
  console.error(`Error: ${errorMessage}`, err)
  
  if (errorRef) {
    errorRef.value = errorMessage
  }
  
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: errorMessage,
    life: 3000
  })
  
  return onError ? onError(err) : null
}
```

---

## Integration Examples

### With Entity Composables

```javascript
// src/composables/useEdge.js
import { useApiOperation } from './useApiOperation'

export function useEdge() {
  const { performOperation, performCreate, performDelete } = useApiOperation()
  
  const fetchEdges = async () => {
    return performOperation(
      () => edgeService.getList({ expand: 'type_id,region_id' }),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load edges',
        collection: 'edges'
      }
    )
  }
  
  const createEdge = async (edgeData) => {
    return performCreate(
      () => edgeService.create(edgeData),
      {
        loadingRef: loading,
        entityName: 'Edge',
        entityIdentifier: edgeData.code,
        collection: 'edges'
      }
    )
  }
}
```

### With Form Composables

```javascript
// Form submission pattern
export function useEntityForm(mode = 'create') {
  const { performOperation } = useApiOperation()
  const loading = ref(false)
  
  const submitForm = async () => {
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    return performOperation(
      () => mode === 'create' 
        ? entityService.create(entity.value)
        : entityService.update(entity.value.id, entity.value),
      {
        loadingRef: loading,
        errorMessage: `Failed to ${mode} entity`,
        successMessage: `Entity has been ${mode}d`,
        collection: 'entities',
        onSuccess: (response) => {
          router.push({ name: 'entity-detail', params: { id: response.data.id } })
          return true
        }
      }
    )
  }
}
```

### With Service Layer

The composable works seamlessly with all service layer methods:

```javascript
// Works with any service method that returns a Promise
const operations = [
  () => edgeService.getList(),
  () => locationService.getById(id),
  () => thingService.create(data),
  () => userService.updateProfile(profile),
  () => clientService.delete(id)
]

operations.forEach(operation => {
  performOperation(operation, { loadingRef: loading })
})
```

---

## Best Practices

### 1. Always Specify Collection for Mutations

```javascript
// ✅ Good - cache will be invalidated
await performCreate(
  () => service.create(data),
  {
    collection: 'entities',
    entityName: 'Entity'
  }
)

// ❌ Missing collection - cache won't update
await performCreate(
  () => service.create(data),
  { entityName: 'Entity' }
)
```

### 2. Provide Meaningful Error Messages

```javascript
// ✅ Good - specific error message
await performOperation(
  () => service.complexOperation(),
  {
    errorMessage: 'Failed to process complex operation. Please try again.',
    loadingRef: loading
  }
)

// ❌ Generic - not helpful to user
await performOperation(
  () => service.complexOperation(),
  { loadingRef: loading }
)
```

### 3. Use Appropriate Specialized Methods

```javascript
// ✅ Good - use specialized methods for CRUD
await performCreate(() => service.create(data), options)
await performUpdate(() => service.update(id, data), options)
await performDelete(() => service.delete(id), options)

// ❌ Less optimal - missing automatic messaging
await performOperation(() => service.create(data), options)
```

### 4. Handle Success Callbacks Appropriately

```javascript
// ✅ Good - navigation after successful creation
await performCreate(
  () => service.create(data),
  {
    onSuccess: (response) => {
      router.push({ name: 'detail', params: { id: response.data.id } })
      return response.data
    }
  }
)

// ✅ Good - data processing after fetch
await performOperation(
  () => service.getList(),
  {
    onSuccess: (response) => {
      items.value = response.data.items || []
      return items.value
    }
  }
)
```

### 5. Combine with Reactive Data

```javascript
// ✅ Good - combine with useReactiveData for optimal caching
const entitiesData = useReactiveData({
  collection: 'entities',
  operation: 'list',
  fetchFunction: async (options = {}) => {
    return performOperation(
      () => entityService.getList(options),
      {
        errorMessage: 'Failed to load entities',
        collection: 'entities'
      }
    )
  }
})
```

---

## Error Scenarios

The composable handles various error scenarios:

### Network Errors
```javascript
// Axios network error
{
  code: 'NETWORK_ERROR',
  message: 'Network Error',
  // Toast: "Failed to load data"
}
```

### API Errors
```javascript
// 404 Not Found
{
  response: { status: 404, data: { message: 'Record not found' } }
  // Toast: Custom error message
}

// 403 Forbidden
{
  response: { status: 403, data: { message: 'Access denied' } }
  // Toast: Custom error message
}
```

### Validation Errors
```javascript
// 400 Bad Request with validation errors
{
  response: { 
    status: 400, 
    data: { 
      message: 'Validation failed',
      errors: { name: 'Name is required' }
    }
  }
  // Toast: "Failed to create entity"
}
```

---

## Testing

### Unit Testing

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useApiOperation } from '@/composables/useApiOperation'

describe('useApiOperation', () => {
  let mockToast, mockCacheStore
  
  beforeEach(() => {
    mockToast = { add: vi.fn() }
    mockCacheStore = { invalidateCollection: vi.fn() }
  })
  
  it('should handle successful operations', async () => {
    const { performOperation } = useApiOperation()
    const mockOperation = vi.fn().mockResolvedValue({ data: 'test' })
    const loading = ref(false)
    
    const result = await performOperation(mockOperation, {
      loadingRef: loading,
      successMessage: 'Success'
    })
    
    expect(result).toEqual({ data: 'test' })
    expect(mockToast.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success',
      detail: 'Success',
      life: 3000
    })
  })
  
  it('should handle operation errors', async () => {
    const { performOperation } = useApiOperation()
    const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'))
    const loading = ref(false)
    const error = ref(null)
    
    const result = await performOperation(mockOperation, {
      loadingRef: loading,
      errorRef: error,
      errorMessage: 'Operation failed'
    })
    
    expect(result).toBeNull()
    expect(error.value).toBe('Operation failed')
    expect(mockToast.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error', 
      detail: 'Operation failed',
      life: 3000
    })
  })
})
```

The `useApiOperation` composable is the cornerstone of the IoT UI's API interaction layer, providing consistent, reliable, and user-friendly API operation handling throughout the application.
