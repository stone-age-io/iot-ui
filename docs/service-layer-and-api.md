# Service Layer and API Interactions

## Overview

The IoT Platform implements a sophisticated service layer that abstracts API interactions and standardizes CRUD operations. This service architecture ensures consistent API handling while reducing code duplication and improving maintainability. The service layer is built on top of PocketBase using Axios for HTTP communication.

## Base Service Pattern

At the foundation of the service layer is the `BaseService` class, which provides common functionality for all entity services:

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

  /**
   * Get user auth data for organization context and cache segmentation
   */
  getUserAuthData() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      
      // Get organization ID from various possible locations
      let currentOrgId = null
      let userId = 'anonymous'
      
      // Try to get from stored auth data
      const authDataStr = localStorage.getItem('auth')
      if (authDataStr) {
        const authData = JSON.parse(authDataStr)
        currentOrgId = authData.currentOrgId || authData.user?.current_organization_id
        userId = authData.user?.id || 'anonymous'
      }
      
      return { userId, currentOrgId }
    } catch (error) {
      return { userId: 'anonymous', currentOrgId: null }
    }
  }

  // CRUD Operations
  getList(params = {}) {
    const endpoint = this.collectionEndpoint(this.collectionName)
    const transformedParams = transformPaginationParams(params)
    
    // Add expand parameter if not already specified
    if (this.options.expandFields.length > 0 && !transformedParams.expand) {
      transformedParams.expand = this.options.expandFields.join(',')
    }
    
    // Apply custom parameter transformations
    this.transformParams(transformedParams, params)
    
    // Setup caching options if enabled
    const authData = this.getUserAuthData()
    const cacheOptions = configService.isCacheEnabled() ? {
      collectionName: this.collectionName,
      operation: 'list',
      id: null,
      userId: authData?.userId || 'anonymous',
      skipCache: params.skipCache === true
    } : null
    
    return apiHelpers.getList(endpoint, transformedParams, cacheOptions)
      .then(response => {
        const processedData = this.processResponseData(response.data)
        return { 
          data: processedData, 
          fromCache: response.fromCache,
          timestamp: response.timestamp 
        }
      })
  }
  
  getById(id) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    let url = endpoint
    
    // Add expand parameter if needed
    if (this.options.expandFields.length > 0) {
      url = `${endpoint}?expand=${this.options.expandFields.join(',')}`
    }
    
    // Setup caching options if enabled
    const authData = this.getUserAuthData()
    const cacheOptions = configService.isCacheEnabled() ? {
      collectionName: this.collectionName,
      operation: 'detail',
      id: id,
      userId: authData?.userId || 'anonymous'
    } : null
    
    return apiHelpers.getById(url, cacheOptions)
      .then(response => {
        if (response.data) {
          response.data = this.parseJsonFields(response.data)
        }
        return response
      })
  }

  async create(entity) {
    const endpoint = this.collectionEndpoint(this.collectionName)
    
    // Get current organization ID and automatically add it
    const authData = this.getUserAuthData()
    const currentOrgId = authData?.currentOrgId
    
    const entityData = { ...entity }
    
    // Add organization_id if not already provided and we have a current org
    if (currentOrgId && !entityData.organization_id) {
      entityData.organization_id = currentOrgId
      console.debug(`BaseService.create - Adding organization_id ${currentOrgId} to ${this.collectionName}`)
    }
    
    // Generate a UUIDv7 for the entity if ID is not already specified
    const entityWithId = {
      ...entityData,
      id: entityData.id || generateUUIDv7()
    }
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(entityWithId)
    
    try {
      const response = await apiHelpers.create(endpoint, processedData)
      
      // Clear cache after creation
      await this.clearCache()
      
      if (response.data) {
        response.data = this.parseJsonFields(response.data)
      }
      
      return response
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error)
      throw error
    }
  }

  async update(id, entity) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    
    // Process entity data before sending to API
    const processedData = this.stringifyJsonFields(entity)
    
    try {
      const response = await apiHelpers.update(endpoint, null, processedData)
      
      // Clear cache after update
      await this.clearCache()
      
      if (response.data) {
        response.data = this.parseJsonFields(response.data)
      }
      
      return response
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error)
      throw error
    }
  }

  async delete(id) {
    const endpoint = this.collectionEndpoint(this.collectionName, id)
    
    try {
      const response = await apiHelpers.delete(endpoint)
      
      // Clear cache after deletion
      await this.clearCache()
      
      return response
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error)
      throw error
    }
  }

  /**
   * Clear cache for this collection
   */
  async clearCache() {
    const authData = this.getUserAuthData()
    
    // Clear localStorage cache
    if (configService.isCacheEnabled()) {
      clearCollectionCache(this.collectionName, authData?.userId)
    }
    
    // Clear reactive store cache
    try {
      const { useCacheStore } = await import('../../stores/cacheStore')
      const cacheStore = useCacheStore()
      
      cacheStore.clearCollectionData(this.collectionName)
      cacheStore.updateTimestamp(this.collectionName)
    } catch (error) {
      console.warn('Failed to clear reactive cache store:', error)
    }
  }

  // Utility methods
  parseJsonFields(entity) {
    const result = { ...entity }
    
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field])
        } catch (e) {
          console.warn(`Failed to parse ${field} for ${this.collectionName}`)
          result[field] = {}
        }
      }
    })
    
    return result
  }

  stringifyJsonFields(entity) {
    const result = { ...entity }
    
    this.options.jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'object') {
        result[field] = JSON.stringify(result[field])
      }
    })
    
    return result
  }

  transformParams(transformedParams, originalParams) {
    // Override in subclasses if needed
  }
}
```

The BaseService provides:

1. **Standardized CRUD operations** (getList, getById, create, update, delete)
2. **Automatic organization context** - adds organization_id to created entities
3. **UUIDv7 generation** for new entities
4. **JSON field handling** - parsing and stringification
5. **Query parameter transformation**
6. **Integrated caching** with cache invalidation
7. **User-scoped caching** for data isolation

## Entity Services

Entity services extend the BaseService to provide entity-specific functionality:

```javascript
// Example: ThingService
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
  getThingsByLocation(locationId) {
    return this.getList({ 
      location_id: locationId,
      sort: 'created'
    })
  }
  
  updateThingState(id, state, merge = true) {
    // First get the current thing to access its state
    return this.getById(id).then(response => {
      const thing = response.data
      let updatedState = state
      
      // If merge is true, merge the new state with the existing
      if (merge && thing.current_state) {
        updatedState = {
          ...thing.current_state,
          ...state
        }
      }
      
      // Update the last_seen timestamp
      const lastSeen = new Date().toISOString()
      
      return this.update(id, { 
        current_state: updatedState,
        last_seen: lastSeen
      })
    })
  }
  
  updateThingPosition(id, coordinates) {
    return this.getById(id).then(response => {
      const thing = response.data
      
      // Create or update metadata
      let metadata = thing.metadata || {}
      
      // Set coordinates
      metadata.coordinates = {
        ...metadata.coordinates,
        x: coordinates.x,
        y: coordinates.y
      }
      
      // Update thing with new metadata
      return this.update(id, { metadata })
    })
  }

  // Custom parameter transformation
  transformParams(transformedParams, originalParams) {
    const filters = []
    if (originalParams.location_id) {
      filters.push(`location_id="${originalParams.location_id}"`)
    }
    if (originalParams.edge_id) {
      filters.push(`edge_id="${originalParams.edge_id}"`)
    }
    if (originalParams.type) {
      filters.push(`type="${originalParams.type}"`)
    }
    
    if (filters.length > 0) {
      transformedParams.filter = filters.join(' && ')
    }
  }
}
```

Entity services focus on providing only entity-specific functionality:

1. **EdgeService**: Edge-specific operations and metadata management
2. **LocationService**: Location-specific operations, file uploads, coordinate management
3. **ThingService**: Thing-specific operations, state management, position tracking
4. **ClientService**: Client-specific operations, password hashing, credential validation
5. **TopicPermissionService**: Topic permission operations, client relationships
6. **UserService**: User profile operations, avatar management, password changes
7. **OrganizationService**: Organization operations, membership management

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
      API_TIMEOUT: 30000,
      // ... other environment variables
    }
    
    this.collections = {
      EDGES: 'edges',
      LOCATIONS: 'locations',
      THINGS: 'things',
      CLIENTS: 'clients',
      TOPIC_PERMISSIONS: 'topic_permissions',
      USERS: 'users',
      ORGANIZATIONS: 'organizations'
    }
    
    this.cache = {
      enabled: true
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
  
  isCacheEnabled() {
    return this.cache.enabled
  }
}
```

The ConfigService provides:
- Environment variable management
- URL construction for all API endpoints
- File URL generation with parameters
- Cache configuration
- Collection name constants

## API Interaction Pattern

The application uses a standardized pattern for API interactions:

### Service Layer
- BaseService handles common CRUD operations
- Entity services provide entity-specific operations
- ConfigService manages all URL construction
- Automatic organization context injection
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
- Organization context is always maintained

## Caching Strategy

The application implements a sophisticated two-tier caching strategy:

### localStorage Cache
- Persistent across browser sessions
- User-scoped to prevent data leakage
- Collection-based organization

### Reactive Store Cache
- Real-time updates across components
- Integrated with Vue's reactivity system
- Automatic invalidation on data changes

### Cache Integration
The `withCache` function integrates both caching layers:

```javascript
export const withCache = (apiCall, cacheOptions) => {
  return async () => {
    const {
      collectionName,
      operation,
      id = null,
      params = null,
      skipCache = false
    } = cacheOptions
    
    // Skip caching if disabled or requested
    if (!configService.isCacheEnabled() || skipCache) {
      const response = await apiCall()
      
      // Still update cache store timestamp for reactivity
      if (cacheStore && collectionName) {
        cacheStore.updateTimestamp(collectionName)
        cacheStore.storeData(collectionName, operation, id, response.data)
      }
      
      return response
    }
    
    // Try cache first, then fetch in background
    const cachedData = getCache(cacheKey)
    if (cachedData) {
      // Return cached data immediately
      // Start background refresh
      // Update reactive store
      return cachedData
    }
    
    // No cache hit, perform API call
    const response = await apiCall()
    
    // Store in both caches
    setCache(cacheKey, response.data)
    cacheStore.storeData(collectionName, operation, id, response.data)
    
    return response
  }
}
```

## Error Handling

The application uses a consistent approach to error handling:

### Service Layer
Services handle API errors with consistent error transformation and logging.

### API Interceptors
Axios interceptors handle common error scenarios:

```javascript
// Response interceptor for error handling
apiService.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    
    // Handle 401 errors (expired tokens)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
      return Promise.reject(error)
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error)
      return Promise.reject({ 
        message: 'Network error. Please check your connection and try again.'
      })
    }
    
    // Log specific error status codes
    switch (error.response.status) {
      case 400:
        console.error('Bad request:', error.response)
        break
      case 403:
        console.error('Forbidden:', error.response)
        break
      case 404:
        console.error('Not found:', error.response)
        break
      case 500:
        console.error('Server error:', error.response)
        break
    }
    
    return Promise.reject(error)
  }
)
```

## Organization Context

The service layer automatically handles organization context:

### Automatic Organization ID Injection
When creating entities, the BaseService:
1. Gets the current user's organization ID from authentication data
2. Automatically adds `organization_id` to the entity if not already present
3. Logs the injection for debugging purposes

### User-Scoped Caching
Cache keys include user ID to ensure data isolation between users and organizations.

### Context Switching
When users switch organizations, caches are cleared and data is refreshed to ensure correct context.

## File Management

Services that handle file uploads use consistent patterns:

```javascript
// Example: Location Service file upload
uploadFloorPlan(id, formData) {
  const endpoint = configService.getCollectionEndpoint(COLLECTIONS.LOCATIONS, id)
  
  return apiHelpers.axiosInstance.patch(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

getFloorPlanImageUrl(location) {
  if (!location || !location.floorplan) {
    return null
  }

  return configService.getFileUrl(COLLECTIONS.LOCATIONS, location.id, location.floorplan)
}
```

## Best Practices

The service architecture enforces several best practices:

1. **DRY Principle**: Common patterns in BaseService prevent code duplication.

2. **Single Responsibility**: Entity services focus on entity-specific functionality.

3. **Automatic Context**: Organization context is handled automatically.

4. **Consistent Error Handling**: Standardized error handling across all services.

5. **Centralized Configuration**: All URL construction goes through ConfigService.

6. **Cache Integration**: Caching is built into the service layer.

7. **User Isolation**: Data is automatically scoped to users and organizations.

## Feature Development Workflow

When adding a new entity service:

1. **Create Service Class**:
   - Extend BaseService
   - Configure jsonFields and expandFields
   - Add entity-specific methods only

2. **Configure Options**:
   - Specify which fields need JSON parsing
   - Define fields to expand in queries
   - Add custom parameter transformation if needed

3. **Export Service**:
   - Create service instance
   - Export from services/index.js

4. **Integration**:
   - Service is automatically integrated with caching
   - Organization context is handled automatically
   - Error handling is consistent

## Conclusion

The service layer provides a robust, consistent foundation for API interactions. The BaseService pattern eliminates code duplication while providing essential features like automatic organization context, caching integration, and consistent error handling. Entity services focus purely on business logic, making the codebase maintainable and extensible.

The integration with ConfigService ensures all URL construction is centralized and consistent, while the caching strategy provides optimal performance without sacrificing data freshness. The automatic organization context handling makes the platform truly multi-tenant while maintaining data isolation and security.
