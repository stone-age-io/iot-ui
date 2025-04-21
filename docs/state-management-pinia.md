# State Management with Pinia

## Overview

The IoT Platform uses Pinia as its state management solution, replacing the older Vuex pattern with a more TypeScript-friendly and Composition API-aligned approach. Pinia stores are organized around specific domains and provide reactive state that can be consumed across the application.

## Core Stores

### Authentication Store

The authentication store (`auth.js`) manages user authentication state and related operations:

```javascript
// src/stores/auth.js
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userFullName = computed(() => user.value?.name || 'User')
  const userInitials = computed(() => {
    if (!user.value?.name) return 'U'
    return user.value.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  })

  // Actions
  async function login(credentials) {/* ... */}
  function logout() {/* ... */}
  function isTokenExpired() {/* ... */}
  async function checkToken() {/* ... */}
  function updateUser(userData) {/* ... */}
  
  return {
    // State
    token,
    user,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    userFullName,
    userInitials,
    
    // Actions
    login,
    logout,
    checkToken,
    updateUser
  }
})
```

### Cache Store

The cache store (`cacheStore.js`) centralizes cache management:

```javascript
// src/stores/cacheStore.js
export const useCacheStore = defineStore('cache', () => {
  // State for tracking collection timestamps and data
  const lastUpdated = ref({})
  const cachedData = ref({})
  const currentCollection = ref(null)
  const isRefreshing = ref(false)
  
  // Computed properties
  const currentTimestamp = computed(() => {
    if (!currentCollection.value) return null
    return lastUpdated.value[currentCollection.value] || null
  })
  
  // Actions
  function setCurrentCollection(collection) {/* ... */}
  function updateTimestamp(collection, timestamp = Date.now()) {/* ... */}
  function storeData(collection, operation, id = null, data) {/* ... */}
  function getData(collection, operation, id = null) {/* ... */}
  function clearCollectionData(collection) {/* ... */}
  function startRefresh() {/* ... */}
  function endRefresh() {/* ... */}
  function resetAll() {/* ... */}
  
  return {
    // State
    lastUpdated,
    cachedData,
    currentCollection,
    isRefreshing,
    currentTimestamp,
    
    // Actions
    setCurrentCollection,
    updateTimestamp,
    storeData,
    getData,
    clearCollectionData,
    startRefresh,
    endRefresh,
    resetAll
  }
})
```

### Theme Store

The theme store (`theme.js`) handles theming preferences:

```javascript
// src/stores/theme.js
export const useThemeStore = defineStore('theme', () => {
  // State - default to 'auto' which follows system preference
  const theme = ref(localStorage.getItem('theme') || 'auto')
  
  // Actions
  function setTheme(newTheme) {/* ... */}
  function applyTheme(selectedTheme) {/* ... */}
  function updateCssVariables(isDark) {/* ... */}
  function isDarkModeActive() {/* ... */}
  function setupThemeWatcher() {/* ... */}
  function init() {/* ... */}
  
  return { 
    theme, 
    setTheme, 
    applyTheme,
    isDarkModeActive,
    init
  }
})
```

### Types Store

The types store (`types.js`) centralizes all entity type data:

```javascript
// src/stores/types.js
export const useTypesStore = defineStore('types', () => {
  // State for all entity types
  const edgeTypes = ref([])
  const edgeRegions = ref([])
  const locationTypes = ref([])
  const thingTypes = ref([])

  // Loading and error states
  const loading = ref({
    edgeTypes: false,
    edgeRegions: false,
    locationTypes: false,
    thingTypes: false
  })

  const error = ref({
    edgeTypes: null,
    edgeRegions: null,
    locationTypes: null,
    thingTypes: null
  })

  // Computed properties
  const isLoading = computed(() => /* ... */)
  const hasError = computed(() => /* ... */)

  // Type loading actions
  async function loadEdgeTypes() {/* ... */}
  async function loadEdgeRegions() {/* ... */}
  async function loadLocationTypes() {/* ... */}
  async function loadThingTypes() {/* ... */}
  async function loadAllTypes() {/* ... */}
  
  // Utility functions
  function getTypeName(typeCode, collection) {/* ... */}
  function getEdgeTypeClass(typeCode) {/* ... */}
  
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
    
    // Helpers
    getTypeName,
    getEdgeTypeClass,
    // ...other helper functions
  }
})
```

## Store Integration with Composables

The IoT Platform uniquely integrates Pinia stores with composables, creating a two-tier approach to state management:

1. **Pinia Stores**: Centralized state that persists across component lifecycles
2. **Composables**: Functional wrappers around store access with component-scoped state

This integration is evident in how the entity composables use the types store:

```javascript
// Excerpt from useEdge.js
export function useEdge() {
  const typesStore = useTypesStore()
  
  // Load edge types and regions
  typesStore.loadEdgeTypes()
  typesStore.loadEdgeRegions()
  
  // Edge types and regions from the store
  const edgeTypes = computed(() => typesStore.edgeTypes)
  const edgeRegions = computed(() => typesStore.edgeRegions)
  
  // Rest of composable...
  
  return {
    // Include computed store state
    edgeTypes,
    edgeRegions,
    // ...other return values
  }
}
```

The `useReactiveData` composable similarly integrates with the cache store:

```javascript
// Excerpt from useReactiveData.js
export function useReactiveData(options) {
  // Get the cache store
  const cacheStore = useCacheStore()
  
  // Local state
  const loading = ref(true)
  const error = ref(null)
  const data = ref(null)
  
  // Get timestamp from the cache store
  const timestamp = computed(() => cacheStore.lastUpdated[collection])
  
  // Watch for changes in the current collection
  watch(
    () => cacheStore.currentCollection,
    (newCollection) => {
      if (newCollection === collection && !initialLoadComplete.value) {
        // Load data when navigating to this collection
        loadData()
      }
    },
    { immediate: true }
  )
  
  // Rest of composable...
}
```

## Store Initialization

Stores are initialized strategically to ensure data is available when needed:

```javascript
// src/main.js
// Add navigation guard to check auth, initialize stores, and manage NATS
router.beforeEach(async (to, from, next) => {
  // Initialize the auth store
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
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

// Function to preload essential application data
const preloadAppData = async () => {
  if (storesInitialized) {
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
  }
}
```

## Benefits of Pinia-based State Management

1. **Composition API Integration**: Pinia works seamlessly with Vue 3's Composition API
2. **Type Safety**: Better TypeScript support than Vuex
3. **Devtools Support**: Improved debugging with Vue Devtools
4. **Simpler Syntax**: No mutations or complex action patterns required
5. **Modular Design**: Stores can be imported and used only where needed
6. **Auto-completion Support**: Better IDE integration and developer experience

## Cache Invalidation Strategy

The cache store implements a sophisticated invalidation strategy:

1. **Collection-based Timestamps**: Track when each collection was last updated
2. **Operation Tracking**: Separate caching for list vs. detail operations
3. **Manual Invalidation**: Exposed methods to clear specific collection caches
4. **Automatic Invalidation**: Updates timestamps on successful mutations

This strategy provides a balance between performance and data freshness.

## Conclusion

The Pinia-based state management approach in the IoT Platform provides a robust, type-safe, and developer-friendly solution for maintaining application state. The tight integration between stores and composables creates a clean pattern for state access and mutation, while the cache invalidation strategy ensures optimal performance with reasonable data freshness guarantees.
