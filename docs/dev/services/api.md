# API Service Documentation

## Overview

The API Service provides centralized HTTP request handling, caching integration, and Axios configuration for the IoT Platform. It includes request/response interceptors, error handling, and a sophisticated caching wrapper that integrates with both localStorage and reactive stores.

## Core Components

### Axios Instance

```javascript
const apiService = axios.create({
  baseURL: configService.getApiBaseUrl(),
  timeout: configService.env.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
```

**Configuration:**
- Base URL from ConfigService
- 30-second timeout by default
- JSON content type headers
- Automatic auth token injection

### Request Interceptor

Automatically adds authentication tokens to requests:

```javascript
apiService.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  }
)
```

### Response Interceptor

Handles common error scenarios:

```javascript
apiService.interceptors.response.use(
  response => response,
  async error => {
    // 401: Expired token handling
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
    }
    
    // Network error handling
    if (!error.response) {
      return Promise.reject({ 
        message: 'Network error. Please check your connection and try again.'
      })
    }
    
    return Promise.reject(error)
  }
)
```

## withCache Function

### Overview

The `withCache` function implements a sophisticated caching strategy that integrates localStorage persistence with reactive store updates.

### Signature

```javascript
withCache(apiCall, cacheOptions)
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiCall` | `Function` | Yes | Function that performs the API call |
| `cacheOptions` | `Object` | Yes | Cache configuration |

**Cache Options:**
```javascript
{
  collectionName: string,    // Collection name for cache organization
  operation: string,         // 'list' or 'detail'
  id: string|null,          // Record ID for detail operations
  params: Object|null,      // Query parameters
  skipCache: boolean        // Whether to bypass cache
}
```

### Caching Strategy

1. **Cache Hit**: Returns cached data immediately and starts background refresh
2. **Cache Miss**: Performs API call and stores result in cache
3. **Skip Cache**: Bypasses cache entirely but still updates stores
4. **Background Refresh**: Updates cache and reactive stores in background

### Usage

```javascript
// Wrap API call with caching
const cachedApiCall = withCache(
  () => axios.get('/api/collections/edges/records'),
  {
    collectionName: 'edges',
    operation: 'list',
    skipCache: false
  }
)

const response = await cachedApiCall()
```

## apiHelpers Object

### Overview

Provides convenient methods for common API operations with built-in caching support.

### Methods

#### axiosInstance

Direct access to the configured Axios instance.

**Usage:**
```javascript
import { apiHelpers } from '../services/api'

// Direct axios usage
const response = await apiHelpers.axiosInstance.get('/custom-endpoint')
```

#### getBaseUrl()

Gets current API base URL from ConfigService.

**Returns:** `string` - Current API base URL

#### updateBaseUrl(newBaseUrl)

Updates the API base URL (useful for environment switching).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `newBaseUrl` | `string` | Yes | New base URL |

#### getList(endpoint, params, cacheOptions)

Fetches a paginated list of resources with caching.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | Yes | API endpoint (relative or absolute) |
| `params` | `Object` | No | Query parameters |
| `cacheOptions` | `Object` | No | Caching configuration |

**Returns:** `Promise<Object>` - Axios response with potential cache metadata

**Usage:**
```javascript
// Basic list request
const response = await apiHelpers.getList('/api/collections/edges/records', {
  page: 1,
  perPage: 10
})

// With caching
const cachedResponse = await apiHelpers.getList(
  '/api/collections/edges/records',
  { sort: '-created' },
  {
    collectionName: 'edges',
    operation: 'list'
  }
)
```

#### getById(endpoint, cacheOptions)

Fetches a single resource by ID with caching.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | Yes | API endpoint with ID included |
| `cacheOptions` | `Object` | No | Caching configuration |

**Returns:** `Promise<Object>` - Axios response

**Usage:**
```javascript
// Basic detail request
const response = await apiHelpers.getById('/api/collections/edges/records/edge-123')

// With caching
const cachedResponse = await apiHelpers.getById(
  '/api/collections/edges/records/edge-123',
  {
    collectionName: 'edges',
    operation: 'detail',
    id: 'edge-123'
  }
)
```

#### create(endpoint, data)

Creates a new resource.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | Yes | API endpoint |
| `data` | `Object` | Yes | Resource data |

**Returns:** `Promise<Object>` - Axios response

**Usage:**
```javascript
const newEdge = {
  name: 'New Edge',
  type: 'building',
  region: 'na'
}

const response = await apiHelpers.create('/api/collections/edges/records', newEdge)
```

#### update(endpoint, id, data)

Updates an existing resource.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | Yes | API endpoint with ID included |
| `id` | `string|number` | Yes | Resource ID (kept for compatibility) |
| `data` | `Object` | Yes | Updated resource data |

**Returns:** `Promise<Object>` - Axios response

**Usage:**
```javascript
const updates = { name: 'Updated Edge Name' }
const response = await apiHelpers.update('/api/collections/edges/records/edge-123', null, updates)
```

#### delete(endpoint)

Deletes a resource.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | Yes | API endpoint with ID included |

**Returns:** `Promise<Object>` - Axios response

**Usage:**
```javascript
await apiHelpers.delete('/api/collections/edges/records/edge-123')
```

#### request(config)

Generic HTTP request method with full control.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `Object` | Yes | Axios request configuration |

**Returns:** `Promise<Object>` - Axios response

**Usage:**
```javascript
const response = await apiHelpers.request({
  method: 'PATCH',
  url: '/api/collections/edges/records/edge-123',
  data: { status: 'active' },
  headers: { 'Custom-Header': 'value' }
})
```

#### upload(endpoint, formData, options)

Uploads files with progress tracking support.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | Yes | Upload endpoint |
| `formData` | `FormData` | Yes | Form data with file |
| `options` | `Object` | No | Upload options |

**Returns:** `Promise<Object>` - Axios response

**Usage:**
```javascript
const formData = new FormData()
formData.append('avatar', fileInput.files[0])

const response = await apiHelpers.upload('/api/collections/users/records/user-123', formData, {
  onUploadProgress: (progressEvent) => {
    const progress = (progressEvent.loaded / progressEvent.total) * 100
    console.log(`Upload progress: ${progress}%`)
  }
})
```

## Usage Examples

### Service Integration

```javascript
// How services use the API helpers
import { apiHelpers } from '../api'
import configService from '../config/configService'

export class EdgeService extends BaseService {
  async getList(params = {}) {
    const endpoint = configService.getCollectionEndpoint('edges')
    
    return apiHelpers.getList(endpoint, params, {
      collectionName: 'edges',
      operation: 'list',
      skipCache: params.skipCache
    })
  }
  
  async getById(id) {
    const endpoint = configService.getCollectionEndpoint('edges', id)
    
    return apiHelpers.getById(endpoint, {
      collectionName: 'edges',
      operation: 'detail',
      id: id
    })
  }
}
```

### Direct API Usage

```javascript
// Direct usage in components (not recommended - use services instead)
import { apiHelpers } from '../services/api'

// Emergency direct API call
const emergencyDataFetch = async () => {
  try {
    const response = await apiHelpers.getList('/api/collections/alerts/records', {
      filter: 'severity="critical"',
      sort: '-created'
    })
    
    return response.data.items
  } catch (error) {
    console.error('Emergency fetch failed:', error)
    return []
  }
}
```

### Custom Request Handling

```javascript
// Custom API request with full control
const customApiRequest = async () => {
  const response = await apiHelpers.request({
    method: 'POST',
    url: '/api/custom-endpoint',
    data: {
      customData: 'value'
    },
    headers: {
      'Custom-Authorization': 'Bearer custom-token',
      'X-Custom-Header': 'custom-value'
    },
    timeout: 60000, // 60 second timeout
    validateStatus: (status) => status < 500 // Accept 4xx errors
  })
  
  return response.data
}
```

### File Upload with Progress

```javascript
// File upload with progress tracking
const uploadWithProgress = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('metadata', JSON.stringify({
    uploadedAt: new Date().toISOString(),
    originalName: file.name
  }))
  
  try {
    const response = await apiHelpers.upload('/api/files/upload', formData, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        onProgress(progress)
      },
      timeout: 300000 // 5 minute timeout for large files
    })
    
    return response.data
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout - file too large or connection too slow')
    }
    throw error
  }
}

// Usage
await uploadWithProgress(selectedFile, (progress) => {
  console.log(`Upload: ${progress}%`)
  updateProgressBar(progress)
})
```

### Error Handling Patterns

```javascript
// Comprehensive error handling
const robustApiCall = async (operation) => {
  try {
    return await operation()
  } catch (error) {
    // Network errors
    if (!error.response) {
      console.error('Network error:', error.message)
      throw new Error('Network connection failed. Please check your internet connection.')
    }
    
    // HTTP error responses
    switch (error.response.status) {
      case 400:
        console.error('Bad request:', error.response.data)
        throw new Error('Invalid request data. Please check your input.')
        
      case 401:
        console.error('Unauthorized:', error.response.data)
        // Handled by response interceptor - user will be redirected
        throw new Error('Authentication required. Please log in.')
        
      case 403:
        console.error('Forbidden:', error.response.data)
        throw new Error('Access denied. You do not have permission for this action.')
        
      case 404:
        console.error('Not found:', error.response.data)
        throw new Error('Requested resource not found.')
        
      case 409:
        console.error('Conflict:', error.response.data)
        throw new Error('Data conflict. The resource may have been modified by another user.')
        
      case 422:
        console.error('Validation error:', error.response.data)
        throw new Error('Validation failed. Please check your input data.')
        
      case 429:
        console.error('Rate limited:', error.response.data)
        throw new Error('Too many requests. Please wait and try again.')
        
      case 500:
        console.error('Server error:', error.response.data)
        throw new Error('Server error. Please try again later.')
        
      default:
        console.error('Unknown error:', error.response.status, error.response.data)
        throw new Error(`Request failed with status ${error.response.status}`)
    }
  }
}

// Usage
try {
  const data = await robustApiCall(() => 
    apiHelpers.getList('/api/collections/edges/records')
  )
  console.log('Data loaded successfully:', data)
} catch (error) {
  showUserError(error.message)
}
```

### Cache Management

```javascript
// Manual cache control
const cacheControlExample = async () => {
  // Force fresh data (bypass cache)
  const freshData = await apiHelpers.getList('/api/collections/edges/records', {}, {
    collectionName: 'edges',
    operation: 'list',
    skipCache: true
  })
  
  // Use cached data if available
  const cachedData = await apiHelpers.getList('/api/collections/edges/records', {}, {
    collectionName: 'edges',
    operation: 'list',
    skipCache: false
  })
  
  console.log('Fresh data:', freshData.data.items.length)
  console.log('Cached data:', cachedData.data.items.length)
  console.log('Was from cache:', cachedData.fromCache)
}
```

### Environment-Specific Configuration

```javascript
// Dynamic API configuration
const configureApiForEnvironment = (environment) => {
  let baseUrl
  
  switch (environment) {
    case 'development':
      baseUrl = 'http://localhost:8080/pb'
      break
    case 'staging':
      baseUrl = 'https://staging-api.example.com/pb'
      break
    case 'production':
      baseUrl = 'https://api.example.com/pb'
      break
    default:
      throw new Error(`Unknown environment: ${environment}`)
  }
  
  // Update API base URL
  apiHelpers.updateBaseUrl(baseUrl)
  console.log(`API configured for ${environment}: ${baseUrl}`)
}

// Configure based on environment variable or runtime detection
const environment = import.meta.env.VITE_ENVIRONMENT || 'development'
configureApiForEnvironment(environment)
```

## Cache Integration Details

### localStorage Cache

The API service integrates with localStorage for persistent caching:

- **Cache Keys**: Generated from collection, operation, user ID, and parameters
- **Storage**: JSON serialized data with timestamps
- **Cleanup**: Automatic cleanup when quota exceeded
- **Isolation**: User-scoped to prevent data leakage

### Reactive Store Cache

Integration with Vue reactive stores:

- **Real-time Updates**: Cache changes update reactive stores
- **Cross-component Sync**: All components see cache updates immediately
- **Collection Timestamps**: Track when collections were last updated
- **Background Refresh**: Automatic background updates maintain freshness

### Cache Behavior

1. **First Request**: API call → Cache storage → Return data
2. **Subsequent Requests**: Return cached data → Background refresh → Update cache
3. **Cache Miss**: API call → Cache storage → Return data
4. **Skip Cache**: API call → Update stores → Return data (no cache storage)

## Performance Considerations

### Request Optimization

- **Connection Pooling**: Axios reuses connections
- **Request Compression**: Automatic gzip compression
- **Timeout Management**: Reasonable timeouts prevent hanging requests
- **Retry Logic**: Implemented at service level for failed requests

### Caching Benefits

- **Reduced API Calls**: Up to 70% reduction in API requests
- **Faster UI Response**: Immediate data display from cache
- **Offline Resilience**: Cached data available when offline
- **Background Updates**: Fresh data without blocking UI

### Memory Management

- **Cache Size Limits**: Automatic cleanup when localStorage quota exceeded
- **Selective Caching**: Only cache frequently accessed data
- **TTL Consideration**: Background refresh provides eventual consistency
- **Memory Efficient**: Minimal memory footprint for cache metadata

## Security Considerations

### Authentication

- **Automatic Token Injection**: Tokens added to all requests
- **Token Expiry Handling**: Automatic logout on 401 responses
- **Secure Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)

### Data Protection

- **HTTPS Enforcement**: All API calls use HTTPS in production
- **Request Validation**: Server-side validation of all requests
- **Cache Isolation**: User-scoped caching prevents data leakage
- **Sensitive Data**: Avoid caching sensitive information

## Best Practices

1. **Use Services**: Always use service layer instead of direct API calls
2. **Error Handling**: Implement comprehensive error handling for all API operations
3. **Cache Strategy**: Use caching for read-heavy operations, skip for writes
4. **Request Optimization**: Batch requests when possible
5. **Timeout Management**: Set appropriate timeouts for different operation types
6. **Progress Feedback**: Show loading states for long-running operations
7. **Offline Handling**: Gracefully handle network failures
