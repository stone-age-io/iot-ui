# Service Layer and API Interactions

## Overview

The IoT Platform implements a sophisticated service layer that abstracts API interactions, provides field mapping between API and client data structures, and standardizes CRUD operations. This service architecture ensures consistent API handling while reducing code duplication and improving maintainability.

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
      fieldMappings: {}, // Field mappings between API and client fields
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
    // Map client fields to API fields
    const apiEntity = this.mapClientToApiFields(entity)
    // Stringify JSON fields
    const preparedEntity = this.stringifyJsonFields(apiEntity)
    
    return apiHelpers.post(this.collectionEndpoint(), preparedEntity).then(response => {
      return this.processResponse(response)
    })
  }
  
  update(id, entity) {
    // Map client fields to API fields
    const apiEntity = this.mapClientToApiFields(entity)
    // Stringify JSON fields
    const preparedEntity = this.stringifyJsonFields(apiEntity)
    
    return apiHelpers.patch(`${this.collectionEndpoint()}/${id}`, preparedEntity).then(response => {
      return this.processResponse(response)
    })
  }
  
  delete(id) {
    return apiHelpers.delete(`${this.collectionEndpoint()}/${id}`)
  }

  // Field mapping methods
  mapApiToClientFields(apiData) {
    const result = { ...apiData }
    const mappings = this.options.fieldMappings
    
    // Skip if no mappings defined
    if (!mappings || Object.keys(mappings).length === 0) {
      return result
    }
    
    // Apply mappings: API field name -> client field name
    Object.entries(mappings).forEach(([apiField, clientField]) => {
      if (apiData[apiField] !== undefined) {
        result[clientField] = apiData[apiField]
        
        // Remove the original field if it's different from the client field
        if (apiField !== clientField) {
          delete result[apiField]
        }
      }
    })
    
    return result
  }

  mapClientToApiFields(clientData) {
    const result = { ...clientData }
    const mappings = this.options.fieldMappings
    
    // Skip if no mappings defined
    if (!mappings || Object.keys(mappings).length === 0) {
      return result
    }
    
    // Create reverse mappings: client field name -> API field name
    const reverseMappings = {}
    Object.entries(mappings).forEach(([apiField, clientField]) => {
      reverseMappings[clientField] = apiField
    })
    
    // Apply reverse mappings
    Object.entries(reverseMappings).forEach(([clientField, apiField]) => {
      if (clientData[clientField] !== undefined) {
        result[apiField] = clientData[clientField]
        
        // Remove the original field if it's different from the API field
        if (apiField !== clientField) {
          delete result[clientField]
        }
      }
    })
    
    return result
  }

  // Process API response
  processResponse(response) {
    // Handle array responses (lists)
    if (response.data && Array.isArray(response.data.items)) {
      response.data.items = response.data.items.map(item => {
        // Map API fields to client fields
        const mappedItem = this.mapApiToClientFields(item)
        // Parse JSON fields
        return this.parseJsonFields(mappedItem)
      })
    } 
    // Handle single item responses
    else if (response.data) {
      // Map API fields to client fields
      const mappedData = this.mapApiToClientFields(response.data)
      // Parse JSON fields
      response.data = this.parseJsonFields(mappedData)
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
2. **Field Mapping**: Automatic conversion between API and client field names
3. **JSON Handling**: Automatic parsing and stringification of JSON fields
4. **Parameter Transformation**: Consistent handling of query parameters

## Field Mapping

A key feature of the service layer is the field mapping system that allows entity services to define mappings between API field names and client field names:

```javascript
// Example: ThingService field mapping
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

With this configuration:
- When retrieving data, API field 'code' is mapped to client field 'thing_code'
- When sending data, client field 'thing_code' is mapped back to API field 'code'
- This happens automatically for all CRUD operations

The field mapping system provides several benefits:
- Consistent field naming in the client application
- Support for legacy API field names without changing client code
- Reduced need for manual field transformations

## Entity Services

Entity services extend the BaseService to provide entity-specific functionality:

```javascript
// src/services/thing/thingService.js (example)
import { BaseService } from '../base/BaseService'
import { COLLECTIONS, collectionEndpoint } from '../pocketbase-config'

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
  
  // Entity-specific methods
  getThingsByLocation(locationId) {
    return this.getList({ 
      location_id: locationId,
      sort: 'name'
    })
  }
  
  updateThingState(id, state, merge = true) {
    if (!id || !state) return Promise.reject(new Error('Invalid parameters'))
    
    return this.getById(id).then(response => {
      const thing = response.data
      
      // Determine the new state
      let newState
      if (merge && thing.current_state) {
        // Merge with existing state
        newState = {
          ...thing.current_state,
          ...state
        }
      } else {
        // Replace state
        newState = state
      }
      
      // Update the thing
      return this.update(id, { current_state: newState })
    })
  }
  
  updateThingPosition(id, coordinates) {
    if (!id || !coordinates) return Promise.reject(new Error('Invalid parameters'))
    
    return this.getById(id).then(response => {
      const thing = response.data
      
      // Create or update metadata with coordinates
      const metadata = thing.metadata || {}
      metadata.coordinates = coordinates
      
      // Update the thing
      return this.update(id, { metadata })
    })
  }
}

// Export a singleton instance
export const thingService = new ThingService()
```

Entity services focus on providing entity-specific functionality while relying on the BaseService for standard CRUD operations.

## API Helpers

The service layer uses a set of API helpers to standardize HTTP requests:

```javascript
// src/services/api.js
import axios from 'axios'
import { getAuthToken } from './auth'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor for auth
apiClient.interceptors.request.use(config => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle global errors (e.g., authentication)
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
    }
    
    return Promise.reject(error)
  }
)

// Export API helpers
export const apiHelpers = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config)
}
```

This approach provides:
- Centralized configuration of API requests
- Consistent authentication handling
- Standardized error handling
- A clean interface for services

## Integration with Composables

The service layer integrates with composables through the `useApiOperation` pattern:

```javascript
// Example of service integration in a composable
const fetchEdge = async (id) => {
  if (!id) {
    error.value = 'Invalid edge ID'
    return null
  }
  
  return performOperation(
    () => edgeService.getById(id),
    {
      loadingRef: loading,
      errorRef: error,
      errorMessage: 'Failed to load edge details',
      collection: 'edges', // Specify collection for cache updates
      onSuccess: (response) => response.data
    }
  )
}
```

This pattern creates a clean separation where:
- **Services** are responsible for API interactions and data transformation
- **Composables** manage state, loading indicators, and error handling
- **Components** focus on UI rendering and user interaction

## Type Services

The type management system uses specialized services for each entity type:

```javascript
// src/services/type/edgeTypeService.js (simplified)
import { BaseService } from '../base/BaseService'
import { COLLECTIONS, collectionEndpoint } from '../pocketbase-config'

export class EdgeTypeService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.EDGE_TYPES,
      collectionEndpoint
    )
  }
  
  /**
   * Get edge type options formatted for dropdowns
   * @returns {Promise<Array>} - Edge type options
   */
  async getTypeOptions() {
    try {
      const response = await this.getList({ sort: 'type' })
      
      // Format for dropdown usage
      return response.data.items.map(type => ({
        value: type.code,
        label: type.type
      }))
    } catch (error) {
      console.error('Error fetching edge type options:', error)
      throw error
    }
  }
  
  /**
   * Check if a code is already in use
   * @param {string} code - Code to check
   * @param {string} excludeId - Optional ID to exclude from check
   * @returns {Promise<boolean>} - Whether code is in use
   */
  async isCodeInUse(code, excludeId) {
    try {
      const response = await this.getList({
        filter: `code="${code}"`
      })
      
      if (!response.data.items.length) {
        return false
      }
      
      // If excludeId is provided, check if the found type has a different ID
      if (excludeId) {
        return response.data.items.some(type => type.id !== excludeId)
      }
      
      return true
    } catch (error) {
      console.error('Error checking if code is in use:', error)
      throw error
    }
  }
  
  /**
   * Get abbreviation for a type code
   * @param {string} typeCode - Type code
   * @returns {string} - Abbreviation
   */
  getTypeAbbreviation(typeCode) {
    // Example abbreviation mapping
    const abbreviations = {
      'building': 'bld',
      'server': 'srv',
      'gateway': 'gw',
      'host': 'hst'
    }
    
    return abbreviations[typeCode] || typeCode
  }
}

// Export a singleton instance
export const edgeTypeService = new EdgeTypeService()
```

Similar services exist for other type entities, providing consistent type management across the application.

## NATS Services

The application includes specialized services for NATS messaging:

```javascript
// src/services/nats/natsService.js (simplified)
import { connect, StringCodec } from 'nats.ws'

class NatsService {
  constructor() {
    this.connection = null
    this.connected = false
    this.statusListeners = []
    this.codec = StringCodec()
  }
  
  /**
   * Connect to NATS server
   * @param {Object} config - Connection configuration
   * @returns {Promise<boolean>} - Connection success
   */
  async connect(config) {
    try {
      // Update status
      this._updateStatus('connecting')
      
      // Connect to NATS
      this.connection = await connect({
        servers: config.url,
        token: config.token,
        timeout: 5000
      })
      
      this.connected = true
      this._updateStatus('connected')
      
      // Handle connection closure
      const done = this.connection.closed()
      done.then(() => {
        this.connected = false
        this._updateStatus('disconnected')
      })
      
      return true
    } catch (error) {
      this.connected = false
      this._updateStatus('error', error.message)
      return false
    }
  }
  
  /**
   * Disconnect from NATS server
   */
  async disconnect() {
    if (this.connection) {
      await this.connection.drain()
      this.connection = null
      this.connected = false
      this._updateStatus('disconnected')
    }
  }
  
  /**
   * Subscribe to a NATS subject
   * @param {string} subject - NATS subject
   * @param {Function} callback - Message handler
   * @returns {Object} - Subscription
   */
  async subscribe(subject, callback) {
    if (!this.isConnected()) {
      throw new Error('Not connected to NATS')
    }
    
    const subscription = this.connection.subscribe(subject)
    
    // Process messages
    (async () => {
      for await (const msg of subscription) {
        const data = this.codec.decode(msg.data)
        let parsed
        
        // Try to parse as JSON
        try {
          parsed = JSON.parse(data)
        } catch (e) {
          parsed = data
        }
        
        // Call handler with parsed data
        callback(parsed, msg.subject, subscription.sid)
      }
    })().catch(error => {
      console.error('Error in NATS subscription:', error)
    })
    
    return subscription
  }
  
  /**
   * Unsubscribe from a NATS subject
   * @param {Object} subscription - Subscription to unsubscribe
   */
  async unsubscribe(subscription) {
    if (subscription) {
      subscription.unsubscribe()
    }
  }
  
  /**
   * Check if connected to NATS server
   * @returns {boolean} - Connection status
   */
  isConnected() {
    return this.connected && this.connection !== null
  }
  
  /**
   * Add status change listener
   * @param {Function} listener - Status change listener
   */
  onStatusChange(listener) {
    this.statusListeners.push(listener)
  }
  
  /**
   * Remove status change listener
   * @param {Function} listener - Listener to remove
   */
  removeStatusListener(listener) {
    this.statusListeners = this.statusListeners.filter(l => l !== listener)
  }
  
  /**
   * Update connection status and notify listeners
   * @param {string} status - New status
   * @param {string} error - Optional error message
   * @private
   */
  _updateStatus(status, error = null) {
    this.statusListeners.forEach(listener => {
      try {
        listener(status, error)
      } catch (e) {
        console.error('Error in NATS status listener:', e)
      }
    })
  }
}

// Export a singleton instance
export default new NatsService()
```

This service provides a clean integration with the NATS messaging system, demonstrating how the service layer can be extended beyond traditional CRUD operations.

## Benefits of the Service Layer

The service layer architecture provides several benefits:

1. **Abstraction of API Details**: Components and composables don't need to know the details of API endpoints or request formatting.

2. **Consistent Data Transformation**: Field mapping and JSON handling are standardized across all services.

3. **Reduced Code Duplication**: Common CRUD operations are implemented once in the BaseService.

4. **Centralized Configuration**: API configuration, authentication, and error handling are managed in one place.

5. **Testability**: Services can be easily mocked for component and composable testing.

6. **Maintainability**: Changes to API endpoints or formats only require updates to the relevant service.

7. **Extensibility**: New entity services can easily extend the BaseService without duplicating common functionality.

## Conclusion

The IoT Platform's service layer demonstrates a well-structured approach to API interactions with a focus on reusability, consistency, and maintainability. By implementing a robust BaseService with field mapping, standardized CRUD operations, and entity-specific extensions, the application achieves a clean separation of concerns between data access, business logic, and UI rendering.

This pattern allows the composables to focus on state management and user interaction while delegating the specifics of API communication to the service layer, resulting in a more maintainable and scalable codebase.
