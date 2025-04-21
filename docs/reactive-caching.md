# Reactive Caching Strategy

## Overview

The IoT Platform implements a sophisticated caching strategy that balances data freshness with performance optimization. This strategy leverages Vue's reactivity system alongside a centralized cache store to minimize API requests while ensuring users have access to up-to-date information.

## Architecture Components

The caching system consists of several interconnected components:

1. **Cache Store**: Centralized Pinia store (`cacheStore.js`)
2. **Reactive Data Composable**: `useReactiveData` composable for reactive cache access
3. **Cache Utilities**: Helper functions in `cacheUtils.js`
4. **API Operation Composable**: Integration via `useApiOperation`

## Cache Store

The cache store provides a central location for tracking collection timestamps and storing cached data:

```javascript
// src/stores/cacheStore.js
export const useCacheStore = defineStore('cache', () => {
  // State for tracking when collections were last updated
  const lastUpdated = ref({});
  
  // State for storing collection data (keyed by collection name and operation)
  const cachedData = ref({});
  
  // Collection that's currently being viewed based on route
  const currentCollection = ref(null);
  
  // Background refresh state
  const isRefreshing = ref(false);
  
  // Core functions
  function updateTimestamp(collection, timestamp = Date.now()) {/* ... */}
  function storeData(collection, operation, id = null, data) {/* ... */}
  function getData(collection, operation, id = null) {/* ... */}
  function clearCollectionData(collection) {/* ... */}
  
  // Additional helpers
  function setCurrentCollection(collection) {/* ... */}
  function startRefresh() {/* ... */}
  function endRefresh() {/* ... */}
  function resetAll() {/* ... */}
  
  return {
    // Exported state and methods
  }
})
```

## Reactive Data Composable

The `useReactiveData` composable integrates with the cache store to provide reactive access to cached data:

```javascript
// src/composables/useReactiveData.js
export function useReactiveData(options) {
  const {
    collection,
    operation,
    id = null,
    fetchFunction,
    processData = data => data
  } = options;
  
  // API operation composable for loading/error handling
  const { performOperation } = useApiOperation();
  
  // Get the cache store
  const cacheStore = useCacheStore();
  
  // Local state
  const loading = ref(true);
  const error = ref(null);
  const initialLoadComplete = ref(false);
  const data = ref(null);
  
  // Get timestamp from the cache store
  const timestamp = computed(() => cacheStore.lastUpdated[collection]);
  
  // Load data from API (initial load)
  const loadData = async () => {/* ... */}
  
  // Refresh data (manual refresh)
  const refreshData = async (skipCache = true) => {/* ... */}
  
  // Manually update the data in the reactive state and cache store
  const updateData = (newData) => {/* ... */}
  
  // Watch for changes in the current collection
  watch(/* ... */)
  
  // Load data on component mount if not already loading/loaded
  onMounted(/* ... */)
  
  return {
    data,
    loading,
    error,
    refreshData,
    updateData,
    timestamp
  };
}
```

## Cache Utilities

The `cacheUtils.js` module provides lower-level functionality for managing the cache:

```javascript
// src/utils/cacheUtils.js

// Generate a cache key from parameters
export function generateCacheKey(collectionName, operation, id = null, params = null, userId = null) {/* ... */}

// Store data in cache
export function setCache(key, data) {/* ... */}

// Get data from cache if it exists
export function getCache(key) {/* ... */}

// Get cache timestamp if it exists
export function getCacheTimestamp(key) {/* ... */}

// Remove a specific item from cache
export function removeCache(key) {/* ... */}

// Clear all cache items for a specific collection
export function clearCollectionCache(collectionName, userId = null) {/* ... */}

// Clear all cache items for a specific user
export function clearUserCache(userId) {/* ... */}

// Clear all API cache items
export function clearAllCache() {/* ... */}
```

## Integration with API Operations

The caching strategy is tightly integrated with API operations via the `useApiOperation` composable:

```javascript
// Excerpt from src/composables/useApiOperation.js
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

  try {
    // Perform the operation
    response = await operation()
    
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
      // Show toast...
    }

    // Rest of function...
  }
}
```

## Cache Keys

The caching system uses a structured approach to generate cache keys:

```javascript
// Excerpt from src/utils/cacheUtils.js
export function generateCacheKey(collectionName, operation, id = null, params = null, userId = null) {
  // Get user ID for cache segmentation
  const userScope = userId || getCurrentUserId() || 'anonymous';
  
  const parts = [userScope, collectionName, operation];
  
  if (id) {
    parts.push(id);
  }
  
  if (params) {
    // Sort keys to ensure consistent cache keys
    const sortedParams = {};
    Object.keys(params).sort().forEach(key => {
      sortedParams[key] = params[key];
    });
    parts.push(JSON.stringify(sortedParams));
  }
  
  return `${CACHE_PREFIX}${parts.join('_')}`;
}
```

## Stale-While-Revalidate Pattern

The IoT Platform implements a stale-while-revalidate pattern:

1. **Initial Request**: Data is fetched from the API and cached
2. **Subsequent Requests**: Cached data is immediately returned while a background refresh occurs
3. **Background Update**: After successful refresh, the cache is updated
4. **Reactive Updates**: UI is automatically updated with fresh data when available

This approach provides several benefits:
- Immediate response with cached data
- Eventual consistency with background updates
- Reduced API load
- Seamless user experience

## Cache Invalidation

The caching system implements multiple invalidation strategies:

### Time-based Invalidation

Timestamps track when collections were last updated, allowing components to decide if cached data is fresh enough:

```javascript
// Excerpt from a component using the cache
const isCacheFresh = computed(() => {
  if (!timestamp.value) return false;
  const now = Date.now();
  const maxAge = 60000; // 1 minute
  return now - timestamp.value < maxAge;
});
```

### Operation-based Invalidation

Write operations (create, update, delete) trigger cache invalidation for affected collections:

```javascript
// Example from a create operation
const createEdge = async (edge) => {
  return performOperation(
    () => edgeService.create(edge),
    {
      loadingRef: loading,
      errorRef: error,
      successMessage: `Edge ${edge.code} has been created`,
      collection: 'edges', // Specify collection for cache updates
      onSuccess: (response) => response.data
    }
  )
}
```

### Manual Invalidation

Users can trigger manual refreshes via UI controls, and routes can force refreshes with the `skipCache` query parameter:

```javascript
// Example of manual refresh in a component
const refreshData = async () => {
  loading.value = true;
  await fetchData({ skipCache: true });
  loading.value = false;
}
```

### Route-based Detection

The router detects collection changes and updates the cache store:

```javascript
// src/router/index.js
router.beforeEach((to, from, next) => {
  // Update cache store with current collection if authenticated
  if (authStore.isAuthenticated) {
    try {
      const cacheStore = useCacheStore()
      
      // First check if route has collection in meta
      let currentCollection = to.meta.collection || null
      
      // If not set in meta, try to detect from path
      if (!currentCollection) {
        currentCollection = detectCollectionFromPath(to.path)
      }
      
      // Update cache store with current collection
      if (currentCollection) {
        cacheStore.setCurrentCollection(currentCollection)
      }
    } catch (error) {
      console.warn('Failed to update cache store with current collection:', error)
    }
  }
  
  next()
})
```

## User-Scoped Caching

To maintain data isolation, cache keys include the user's ID:

```javascript
// Excerpt from src/utils/cacheUtils.js
function getCurrentUserId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const authData = JSON.parse(localStorage.getItem('auth') || '{"user":null}');
    return authData.user?.id || 'anonymous';
  } catch (error) {
    console.warn('Failed to get current user ID for cache:', error);
    return 'anonymous';
  }
}
```

## Memory Management

The caching system includes mechanisms to manage memory usage:

```javascript
// Excerpt from src/utils/cacheUtils.js
export function setCache(key, data) {
  try {
    // Cache implementation...
  } catch (error) {
    // Handle localStorage quota exceeded
    if (error instanceof DOMException && (
        error.code === 22 || // Chrome quota exceeded
        error.code === 1014 || // Firefox quota exceeded
        error.name === 'QuotaExceededError' || 
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      // Clear oldest cache items to make space
      clearOldestCacheItems();
    }
    return false;
  }
}

// Clear oldest cache items
function clearOldestCacheItems() {
  // Collect cache items with timestamps
  const cacheItems = [];
  
  // Find and sort all cache items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      // Add to collection...
    }
  }
  
  // Sort by timestamp (oldest first)
  cacheItems.sort((a, b) => a.timestamp - b.timestamp);
  
  // Remove the oldest 20% of items
  const removeCount = Math.max(1, Math.ceil(cacheItems.length * 0.2));
  cacheItems.slice(0, removeCount).forEach(item => {
    localStorage.removeItem(item.key);
  });
}
```

## Conclusion

The IoT Platform's reactive caching strategy provides an elegant solution to balancing data freshness with performance. By leveraging Vue's reactivity system and integrating caching at multiple levels, the application delivers a responsive user experience while minimizing unnecessary network requests. The stale-while-revalidate pattern ensures users always have the most up-to-date information without sacrificing performance.
