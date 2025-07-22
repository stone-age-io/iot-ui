# ConfigService API Documentation

## Overview

The `ConfigService` provides centralized configuration management for the IoT Platform. It handles environment variables, API endpoint construction, file URL generation, and feature flags. This service ensures consistent URL construction across all other services.

## Constructor

```javascript
new ConfigService()
```

Automatically loads environment variables and validates configuration on instantiation.

## Properties

### Environment Variables

```javascript
configService.env = {
  API_URL: string,           // Base API URL including /pb/
  API_TIMEOUT: number,       // Request timeout in milliseconds
  APP_TITLE: string,         // Application title
  GRAFANA_URL: string,       // Grafana dashboard URL
  MQTT_HOST: string,         // MQTT server URL
  MQTT_PORT: string,         // MQTT port
  NATS_HOST: string,         // NATS server URL
  NATS_PORT: string,         // NATS port
  WS_HOST: string,          // WebSocket host
  WS_PORT: string           // WebSocket port
}
```

### Collection Names

```javascript
configService.collections = {
  EDGES: 'edges',
  LOCATIONS: 'locations',
  THINGS: 'things',
  CLIENTS: 'clients',
  TOPIC_PERMISSIONS: 'topic_permissions',
  USERS: 'users',
  ORGANIZATIONS: 'organizations'
}
```

### Endpoints

```javascript
configService.endpoints = {
  AUTH: {
    LOGIN: '/collections/users/auth-with-password',
    REFRESH: '/collections/users/auth-refresh',
    PROFILE: '/collections/users/auth-refresh'
  },
  HASH_PASSWORD: 'http://100.98.139.111:9000/sec/api/hash-password'
}
```

## Methods

### getApiBaseUrl()

Returns the base API URL including /pb/ prefix.

**Returns:** `string` - API base URL

**Usage:**
```javascript
const baseUrl = configService.getApiBaseUrl()
// Returns: 'http://localhost:8080/pb'
```

### getPocketBaseUrl(path)

Generates a PocketBase API endpoint URL.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | API path (should start with /) |

**Returns:** `string` - Full PocketBase API URL

**Usage:**
```javascript
const url = configService.getPocketBaseUrl('/collections/edges/records')
// Returns: 'http://localhost:8080/pb/api/collections/edges/records'
```

### getCollectionEndpoint(collection, recordId)

Generates a PocketBase collection endpoint URL.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | `string` | Yes | Collection name |
| `recordId` | `string` | No | Optional record ID |

**Returns:** `string` - Collection endpoint URL

**Usage:**
```javascript
// List endpoint
const listUrl = configService.getCollectionEndpoint('edges')
// Returns: '/api/collections/edges/records'

// Detail endpoint
const detailUrl = configService.getCollectionEndpoint('edges', 'edge-id-123')
// Returns: '/api/collections/edges/records/edge-id-123'
```

### getAuthEndpoint(endpoint)

Gets authentication endpoint URL.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | Yes | Auth endpoint path |

**Returns:** `string` - Full authentication endpoint URL

**Usage:**
```javascript
const loginUrl = configService.getAuthEndpoint('/collections/users/auth-with-password')
// Returns: 'http://localhost:8080/pb/api/collections/users/auth-with-password'
```

### getCustomEndpoint(path)

Gets custom PocketBase API endpoint URL.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Custom API path |

**Returns:** `string` - Full custom endpoint URL

**Usage:**
```javascript
const customUrl = configService.getCustomEndpoint('/organizations/org-123/members')
// Returns: 'http://localhost:8080/pb/api/organizations/org-123/members'
```

### getGrafanaDashboardUrl(dashboard, params)

Constructs Grafana dashboard URL with parameters.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dashboard` | `string` | Yes | Dashboard name |
| `params` | `Object` | No | Dashboard parameters |

**Returns:** `string` - Grafana dashboard URL

**Usage:**
```javascript
const dashboardUrl = configService.getGrafanaDashboardUrl('iot-overview', {
  edge: 'edge-123',
  timeRange: '24h'
})
// Returns: 'http://localhost:3000/d/iot-overview/iot-overview?var-edge=edge-123&var-timeRange=24h'
```

### getFileUrl(collection, recordId, filename, params)

Generates file URL for PocketBase file attachments.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | `string` | Yes | Collection name |
| `recordId` | `string` | Yes | Record ID |
| `filename` | `string` | Yes | File name |
| `params` | `Object` | No | Query parameters (thumb, download) |

**Returns:** `string|null` - File URL or null if invalid parameters

**Usage:**
```javascript
// Basic file URL
const fileUrl = configService.getFileUrl('users', 'user-123', 'avatar.jpg')
// Returns: 'http://localhost:8080/pb/api/files/users/user-123/avatar.jpg'

// Thumbnail URL
const thumbUrl = configService.getFileUrl('users', 'user-123', 'avatar.jpg', {
  thumb: '100x100'
})
// Returns: 'http://localhost:8080/pb/api/files/users/user-123/avatar.jpg?thumb=100x100'

// Download URL
const downloadUrl = configService.getFileUrl('locations', 'loc-123', 'floorplan.pdf', {
  download: '1'
})
// Returns: 'http://localhost:8080/pb/api/files/locations/loc-123/floorplan.pdf?download=1'
```

### getExternalServiceUrl(service)

Gets external service endpoint URL.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `service` | `string` | Yes | Service identifier |

**Returns:** `string|null` - External service URL or null

**Usage:**
```javascript
const hashUrl = configService.getExternalServiceUrl('HASH_PASSWORD')
// Returns: 'http://100.98.139.111:9000/sec/api/hash-password'

const unknownUrl = configService.getExternalServiceUrl('UNKNOWN_SERVICE')
// Returns: null
```

### isCacheEnabled()

Checks if caching is enabled globally.

**Returns:** `boolean` - Whether cache is enabled

**Usage:**
```javascript
if (configService.isCacheEnabled()) {
  // Use cache
  const cachedData = getFromCache(key)
} else {
  // Skip cache
  const freshData = await fetchFromAPI()
}
```

### setCacheEnabled(enabled)

Enables or disables caching globally.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | `boolean` | Yes | Whether to enable caching |

**Usage:**
```javascript
// Disable caching for debugging
configService.setCacheEnabled(false)

// Re-enable caching
configService.setCacheEnabled(true)
```

### getAppTitle()

Gets the application title.

**Returns:** `string` - Application title

**Usage:**
```javascript
const title = configService.getAppTitle()
document.title = title
```

### validateConfiguration()

Validates configuration and returns warnings/errors.

**Returns:** `Object` - Validation result

```javascript
{
  warnings: Array<string>,
  errors: Array<string>,
  isValid: boolean
}
```

**Usage:**
```javascript
const validation = configService.validateConfiguration()

if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors)
}

if (validation.warnings.length > 0) {
  console.warn('Configuration warnings:', validation.warnings)
}
```

## Usage Examples

### Service Integration

```javascript
// How other services use ConfigService
import configService from '../config/configService'

export class MyService extends BaseService {
  constructor() {
    super(
      configService.collections.MY_COLLECTION,
      (collection, recordId) => configService.getCollectionEndpoint(collection, recordId)
    )
  }
  
  getCustomData() {
    const endpoint = configService.getCustomEndpoint('/my-custom-endpoint')
    return apiHelpers.getList(endpoint)
  }
}
```

### File Handling

```javascript
// Avatar management with ConfigService
const displayUserAvatar = (user, size = '100x100') => {
  if (!user.avatar) return null
  
  return configService.getFileUrl(
    configService.collections.USERS,
    user.id,
    user.avatar,
    { thumb: size }
  )
}

// Floor plan handling
const getFloorPlanUrls = (location) => {
  if (!location.floorplan) return {}
  
  return {
    original: configService.getFileUrl(
      configService.collections.LOCATIONS,
      location.id,
      location.floorplan
    ),
    thumbnail: configService.getFileUrl(
      configService.collections.LOCATIONS,
      location.id,
      location.floorplan,
      { thumb: '800x600' }
    ),
    download: configService.getFileUrl(
      configService.collections.LOCATIONS,
      location.id,
      location.floorplan,
      { download: '1' }
    )
  }
}
```

### Environment-Specific Configuration

```javascript
// Development vs Production configuration
const isDevelopment = import.meta.env.DEV

if (isDevelopment) {
  // Override settings for development
  configService.setCacheEnabled(false)
  console.log('Development mode: cache disabled')
}

// Use environment-specific URLs
const grafanaUrl = configService.getGrafanaDashboardUrl('system-health', {
  environment: isDevelopment ? 'dev' : 'prod'
})
```

### Dynamic Configuration

```javascript
// Runtime configuration updates
const updateApiConfiguration = (newBaseUrl) => {
  // This would require additional methods not shown in current implementation
  // But demonstrates how ConfigService could be extended
  
  configService.env.API_URL = newBaseUrl
  
  // Validate new configuration
  const validation = configService.validateConfiguration()
  if (!validation.isValid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
  }
}
```

### External Service Integration

```javascript
// Using external services through ConfigService
const hashPassword = async (password) => {
  const hashServiceUrl = configService.getExternalServiceUrl('HASH_PASSWORD')
  
  if (!hashServiceUrl) {
    throw new Error('Password hashing service not configured')
  }
  
  const response = await fetch(hashServiceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  
  return response.json()
}
```

### Configuration Validation

```javascript
// Startup configuration check
const validateAppConfiguration = () => {
  const validation = configService.validateConfiguration()
  
  // Log warnings
  validation.warnings.forEach(warning => {
    console.warn(`Config Warning: ${warning}`)
  })
  
  // Handle errors
  if (!validation.isValid) {
    const errorMsg = `Configuration errors: ${validation.errors.join(', ')}`
    console.error(errorMsg)
    
    // Show user-friendly error or redirect to setup
    throw new Error(errorMsg)
  }
  
  console.log('Configuration validated successfully')
}

// Run validation at app startup
validateAppConfiguration()
```

## Environment Variables

The service expects these environment variables:

### Required
- `VITE_API_URL`: PocketBase API URL (should include /pb/)

### Optional
- `VITE_APP_TITLE`: Application title (default: 'IoT Platform')
- `VITE_GRAFANA_URL`: Grafana server URL (default: 'http://localhost:3000')
- `VITE_MQTT_HOST`: MQTT server URL (default: 'mqtt://localhost:1883')
- `VITE_MQTT_PORT`: MQTT port (default: '1883')
- `VITE_NATS_HOST`: NATS server URL (default: 'nats://localhost:4222')
- `VITE_NATS_PORT`: NATS port (default: '4222')
- `VITE_WS_HOST`: WebSocket host (default: 'ws://localhost:8080')
- `VITE_WS_PORT`: WebSocket port (default: '8080')

### Example .env file
```env
VITE_API_URL=http://localhost:8080/pb
VITE_APP_TITLE=My IoT Platform
VITE_GRAFANA_URL=http://localhost:3000
VITE_NATS_HOST=ws://localhost:4222
```

## Best Practices

1. **Centralized URLs**: Always use ConfigService for URL construction
2. **Environment Validation**: Check configuration at startup
3. **Default Values**: Provide sensible defaults for optional settings
4. **Error Handling**: Handle missing configuration gracefully
5. **Security**: Don't expose sensitive data in environment variables accessible to client

## Configuration Validation Rules

The validation includes checks for:
- API_URL includes `/pb` prefix (warning if missing)
- API_URL doesn't end with trailing slash (warning if present)
- Required environment variables are present (error if missing)

## Singleton Pattern

ConfigService is implemented as a singleton:

```javascript
// Create singleton instance
export const configService = new ConfigService()

// Always use the same instance
export default configService
```

This ensures consistent configuration across the entire application.
