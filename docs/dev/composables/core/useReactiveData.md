# useReactiveData

## Overview

The `useReactiveData` composable provides reactive data management with integrated caching, automatic cache updates, and background refresh capabilities. It works seamlessly with the application's caching strategy to provide optimal performance while maintaining data freshness.

## Location

```
src/composables/useReactiveData.js
```

## Purpose

- **Reactive Data Management**: Provides reactive access to cached data
- **Automatic Caching**: Integrates with the application's cache store
- **Background Refresh**: Keeps data fresh with background updates
- **Cache Invalidation**: Responds to cache invalidation events
- **Loading State Management**: Handles loading states for data fetching
- **Error Handling**: Provides error state management

## Dependencies

```javascript
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useApiOperation } from './useApiOperation'
import { useCacheStore } from '@/stores/cacheStore'
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `Object` | Yes | Configuration options |

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `collection` | `string` | Yes | - | Collection name for caching |
| `operation` | `string` | Yes | - | Operation type ('list' or 'detail') |
| `id` | `string` | No | `null` | Record ID (for detail operations) |
| `fetchFunction` | `Function` | Yes | - | Function to fetch data from API |
| `processData` | `Function` | No | `data => data` | Function to process fetched data |

## Returns

```javascript
{
  data: Ref<any>,
  loading: Ref<boolean>,
  error: Ref<string|null>,
  refreshData: Function,
  updateData: Function,
  timestamp: ComputedRef<string>
}
```

---

## Properties

### data

Reactive reference to the current data.

**Type:** `Ref<any>`

**Description:** Contains the processed data from the last successful fetch operation. Automatically updates when cache is invalidated or data is refreshed.

### loading

Reactive reference to the loading state.

**Type:** `Ref<boolean>`

**Description:** Indicates whether a data fetch operation is currently in progress. Automatically managed during fetch operations.

### error

Reactive reference to the error state.

**Type:** `Ref<string|null>`

**Description:** Contains error message if the last fetch operation failed, or null if successful.

### timestamp

Computed reference to the last update timestamp.

**Type:** `ComputedRef<string>`

**Description:** Timestamp from the cache store indicating when the data was last updated.

---

## Methods

### refreshData(skipCache)

Manually refreshes the data, optionally skipping cache.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `skipCache` | `boolean` | No | `true` | Whether to skip cache and fetch fresh data |

**Returns:** `Promise<void>`

**Usage:**

```javascript
// Refresh with fresh data from API
await refreshData(true)

// Refresh using cache if available
await refreshData(false)
```

### updateData(newData)

Manually updates the reactive data and cache store.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `newData` | `any` | Yes | New data to set |

**Returns:** `void`

**Usage:**

```javascript
// Update data after a successful operation
const newEntity = { id: '123', name: 'Updated Entity' }
updateData(newEntity)
```

---

## Usage Examples

### Basic List Data

```javascript
import { useReactiveData } from '@/composables/useReactiveData'

export function useEdge() {
  // Raw fetch function for edges
  async function fetchEdgesRaw(options = {}) {
    return await edgeService.getList({
      expand: 'type_id,region_id',
      sort: '-created',
      ...options
    })
  }
  
  // Set up reactive data
  const edgesData = useReactiveData({
    collection: 'edges',
    operation: 'list',
    fetchFunction: fetchEdgesRaw,
    processData: data => data?.items || []
  })
  
  // Expose reactive data
  const edges = computed(() => edgesData.data.value || [])
  
  return {
    edges,
    loading: edgesData.loading,
    error: edgesData.error,
    refreshEdges: edgesData.refreshData
  }
}
```

### Detail Data

```javascript
export function useEdgeDetail(edgeId) {
  async function fetchEdgeRaw(options = {}) {
    return await edgeService.getById(edgeId, {
      expand: 'type_id,region_id',
      ...options
    })
  }
  
  const edgeData = useReactiveData({
    collection: 'edges',
    operation: 'detail',
    id: edgeId,
    fetchFunction: fetchEdgeRaw,
    processData: data => data // Single entity, no transformation needed
  })
  
  const edge = computed(() => edgeData.data.value)
  
  return {
    edge,
    loading: edgeData.loading,
    error: edgeData.error,
    refreshEdge: edgeData.refreshData
  }
}
```

### With Data Processing

```javascript
export function useLocation() {
  async function fetchLocationsRaw(options = {}) {
    return await locationService.getList({
      expand: 'edge_id,parent_id',
      sort: 'path',
      ...options
    })
  }
  
  const locationsData = useReactiveData({
    collection: 'locations',
    operation: 'list',
    fetchFunction: fetchLocationsRaw,
    processData: data => {
      // Process and transform the data
      const items = data?.items || []
      return items.map(location => ({
        ...location,
        // Parse metadata if it's a string
        metadata: typeof location.metadata === 'string' 
          ? JSON.parse(location.metadata) 
          : location.metadata,
        // Compute additional properties
        hasChildren: location.children_count > 0,
        displayName: `${location.code} - ${location.name}`
      }))
    }
  })
  
  const locations = computed(() => locationsData.data.value || [])
  
  return {
    locations,
    loading: locationsData.loading,
    refreshLocations: locationsData.refreshData
  }
}
```

---

## Integration with Cache Store

The composable integrates seamlessly with the application's cache store:

### Automatic Cache Watching

```javascript
// Watches for cache invalidation events
watch(timestamp, () => {
  // Cache has been updated, refresh data
  refreshData(false)
}, { immediate: false })
```

### Cache Update Events

```javascript
// Listens for specific cache events
const cacheStore = useCacheStore()

onMounted(() => {
  // Watch for collection-specific cache updates
  cacheStore.$subscribe((mutation, state) => {
    if (mutation.type === 'direct' && 
        mutation.payload.collection === collection) {
      refreshData(false)
    }
  })
})
```

### User-Scoped Caching

The composable respects user-scoped caching to ensure data isolation:

```javascript
// Cache keys automatically include user context
const cacheKey = `${collection}-${operation}-${userId}`
```

---

## Lifecycle Management

### Component Mounting

```javascript
onMounted(() => {
  // Initial data load on component mount
  loadData()
  
  // Set up cache event listeners
  setupCacheListeners()
})
```

### Component Unmounting

```javascript
onUnmounted(() => {
  // Clean up event listeners
  cleanupCacheListeners()
  
  // Clear any pending operations
  clearPendingOperations()
})
```

### Automatic Refresh

```javascript
// Background refresh when data becomes stale
const checkForStaleData = () => {
  const lastUpdate = cacheStore.lastUpdated[collection]
  const now = Date.now()
  const staleThreshold = 5 * 60 * 1000 // 5 minutes
  
  if (now - lastUpdate > staleThreshold) {
    refreshData(true) // Skip cache for fresh data
  }
}
```

---

## Error Handling

The composable provides comprehensive error handling:

### Network Errors

```javascript
try {
  const response = await fetchFunction(options)
  // Success handling
} catch (err) {
  if (err.code === 'NETWORK_ERROR') {
    error.value = 'Network connection failed. Please check your connection.'
  } else {
    error.value = 'Failed to load data. Please try again.'
  }
}
```

### API Errors

```javascript
catch (err) {
  if (err.response?.status === 404) {
    error.value = 'Data not found.'
  } else if (err.response?.status === 403) {
    error.value = 'Access denied.'
  } else {
    error.value = 'An error occurred while loading data.'
  }
}
```

### Recovery Strategies

```javascript
// Automatic retry on network errors
const retryOperation = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (err) {
      if (attempt === maxRetries || !isRetriableError(err)) {
        throw err
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      )
    }
  }
}
```

---

## Performance Optimizations

### Debounced Updates

```javascript
// Debounce rapid cache updates
let updateTimeout = null

const debouncedUpdate = () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  
  updateTimeout = setTimeout(() => {
    refreshData(false)
    updateTimeout = null
  }, 100)
}
```

### Selective Updates

```javascript
// Only update if data has actually changed
const updateData = (newData) => {
  const processedData = processData(newData)
  
  // Compare with current data to avoid unnecessary updates
  if (JSON.stringify(processedData) !== JSON.stringify(data.value)) {
    data.value = processedData
    
    // Update cache store
    cacheStore.setData(collection, operation, id, newData)
  }
}
```

### Memory Management

```javascript
// Clean up large data sets when component unmounts
onUnmounted(() => {
  if (data.value && Array.isArray(data.value) && data.value.length > 1000) {
    data.value = null // Release memory for large datasets
  }
})
```

---

## Best Practices

### 1. Use Appropriate Operation Types

```javascript
// ✅ Good - list operation for collections
const edgesData = useReactiveData({
  collection: 'edges',
  operation: 'list',
  fetchFunction: fetchEdgesRaw
})

// ✅ Good - detail operation for single entities
const edgeData = useReactiveData({
  collection: 'edges',
  operation: 'detail',
  id: edgeId,
  fetchFunction: fetchEdgeRaw
})
```

### 2. Provide Data Processing

```javascript
// ✅ Good - process data for UI consumption
const locationsData = useReactiveData({
  collection: 'locations',
  operation: 'list',
  fetchFunction: fetchLocationsRaw,
  processData: data => {
    return data?.items?.map(item => ({
      ...item,
      displayName: `${item.code} - ${item.name}`,
      metadata: typeof item.metadata === 'string' 
        ? JSON.parse(item.metadata) 
        : item.metadata
    })) || []
  }
})

// ❌ Less optimal - no data processing
const locationsData = useReactiveData({
  collection: 'locations',
  operation: 'list',
  fetchFunction: fetchLocationsRaw
})
```

### 3. Handle Loading States

```javascript
// ✅ Good - expose loading state
const { data: edges, loading } = useReactiveData(options)

// In template
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="edges.length === 0">No data found</div>
  <EdgeList v-else :edges="edges" />
</template>
```

### 4. Use Computed References

```javascript
// ✅ Good - computed reference for reactive updates
const edges = computed(() => edgesData.data.value || [])

// ❌ Avoid - direct reference doesn't maintain reactivity
const edges = edgesData.data.value
```

### 5. Combine with API Operations

```javascript
// ✅ Good - combine with useApiOperation for mutations
export function useEdge() {
  const { performCreate } = useApiOperation()
  
  const edgesData = useReactiveData({
    collection: 'edges',
    operation: 'list',
    fetchFunction: fetchEdgesRaw
  })
  
  const createEdge = async (edgeData) => {
    const result = await performCreate(
      () => edgeService.create(edgeData),
      {
        collection: 'edges', // Will trigger cache invalidation
        entityName: 'Edge'
      }
    )
    
    // Cache is automatically updated via performCreate
    return result
  }
  
  return {
    edges: computed(() => edgesData.data.value || []),
    createEdge,
    refreshEdges: edgesData.refreshData
  }
}
```

---

## Testing

### Unit Testing

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReactiveData } from '@/composables/useReactiveData'

describe('useReactiveData', () => {
  let mockFetchFunction, mockCacheStore
  
  beforeEach(() => {
    mockFetchFunction = vi.fn()
    mockCacheStore = {
      getData: vi.fn(),
      setData: vi.fn(),
      lastUpdated: { entities: Date.now() }
    }
  })
  
  it('should load initial data', async () => {
    mockFetchFunction.mockResolvedValue({
      data: { items: [{ id: '1', name: 'Test' }] }
    })
    
    const { data, loading } = useReactiveData({
      collection: 'entities',
      operation: 'list',
      fetchFunction: mockFetchFunction,
      processData: data => data?.items || []
    })
    
    // Wait for initial load
    await nextTick()
    
    expect(data.value).toEqual([{ id: '1', name: 'Test' }])
    expect(loading.value).toBe(false)
  })
  
  it('should handle refresh data', async () => {
    const { refreshData } = useReactiveData({
      collection: 'entities',
      operation: 'list',
      fetchFunction: mockFetchFunction
    })
    
    mockFetchFunction.mockResolvedValue({ data: { items: [] } })
    
    await refreshData(true)
    
    expect(mockFetchFunction).toHaveBeenCalledWith({ skipCache: true })
  })
})
```

The `useReactiveData` composable provides a powerful foundation for reactive data management with intelligent caching, making it easy to build performant applications that stay in sync with the server while minimizing unnecessary API calls.
