# IoT Platform Services Layer - Complete Overview

## Introduction

This document provides a comprehensive overview of all services in the IoT Platform's service layer, their relationships, and how they work together to provide a cohesive IoT management system.

## Service Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Vue.js UI Layer                        │
├─────────────────────────────────────────────────────────────┤
│                    Composables Layer                        │
├─────────────────────────────────────────────────────────────┤
│                     Services Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Entity     │  │    Type      │  │   System     │      │
│  │  Services    │  │  Services    │  │  Services    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                   Base Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ BaseService  │  │ ConfigService│  │ API Service  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    PocketBase API                           │
└─────────────────────────────────────────────────────────────┘
```

## Service Categories

### 1. Base Services

#### BaseService
- **Purpose**: Foundation for all entity services
- **Features**: CRUD operations, organization context, caching, JSON field handling
- **Used By**: All entity services extend this class
- **Key Methods**: `getList()`, `getById()`, `create()`, `update()`, `delete()`

#### ConfigService
- **Purpose**: Centralized configuration management
- **Features**: Environment variables, URL construction, validation
- **Used By**: All services for endpoint construction
- **Key Methods**: `getCollectionEndpoint()`, `getFileUrl()`, `validateConfiguration()`

#### API Service
- **Purpose**: HTTP request handling and caching
- **Features**: Axios configuration, request/response interceptors, caching wrapper
- **Used By**: All services for HTTP operations
- **Key Methods**: `getList()`, `getById()`, `create()`, `update()`, `delete()`, `upload()`

### 2. Entity Services

#### EdgeService
- **Collection**: `edges`
- **Purpose**: Manage edge installations (buildings, data centers)
- **Key Features**: Metadata management, type/region integration
- **JSON Fields**: `metadata`
- **Utilities**: `validateEdgeCode()`, `generateEdgeCode()`

#### LocationService
- **Collection**: `locations`
- **Purpose**: Manage physical locations within edges
- **Key Features**: Hierarchical locations, floor plans, coordinate tracking
- **JSON Fields**: `metadata`
- **Special Methods**: `uploadFloorPlan()`, `updateLocationCoordinates()`

#### ThingService
- **Collection**: `things`
- **Purpose**: Manage IoT devices and sensors
- **Key Features**: State management, positioning, device monitoring
- **JSON Fields**: `metadata`, `current_state`
- **Special Methods**: `updateThingState()`, `updateThingPosition()`

#### ClientService
- **Collection**: `clients`
- **Purpose**: Manage NATS messaging clients
- **Key Features**: Password hashing, credential validation, role management
- **Special Methods**: `hashPassword()`, `createClient()`, `validateCredentials()`

#### TopicPermissionService
- **Collection**: `topic_permissions`
- **Purpose**: Manage NATS topic permissions
- **Key Features**: Publish/subscribe permissions, topic validation
- **Special Methods**: `addTopic()`, `removeTopic()`, `getClientsByPermission()`

#### UserService
- **Collection**: `users`
- **Purpose**: Manage user profiles and authentication
- **Key Features**: Profile updates, avatar uploads, organization membership
- **JSON Fields**: `org_roles`
- **Special Methods**: `getCurrentUser()`, `uploadAvatar()`, `changePassword()`

#### OrganizationService
- **Collection**: `organizations`
- **Purpose**: Manage organizations and membership
- **Key Features**: Multi-organization support, role management, logo uploads
- **JSON Fields**: `settings`
- **Special Methods**: `setCurrentOrganization()`, `addUserToOrganization()`

### 3. Type Services

#### TypeService (Base)
- **Purpose**: Base class for all type management
- **Features**: Common type operations, code validation
- **Used By**: All specific type services

#### EdgeTypeService
- **Collection**: `edge_types`
- **Purpose**: Manage edge type definitions
- **Methods**: `getTypeOptions()`, `validateCode()`

#### EdgeRegionService
- **Collection**: `edge_regions`
- **Purpose**: Manage edge region definitions
- **Methods**: `getRegionOptions()`, `validateCode()`

#### LocationTypeService
- **Collection**: `location_types`
- **Purpose**: Manage location type definitions
- **Methods**: `getTypeOptions()`, `validateCode()`

#### ThingTypeService
- **Collection**: `thing_types`
- **Purpose**: Manage thing type definitions
- **Methods**: `getTypeOptions()`, `getTypeAbbreviation()`

### 4. System Services

#### NatsService
- **Purpose**: Core NATS WebSocket connectivity
- **Features**: Message publishing/subscribing, connection management
- **Key Methods**: `connect()`, `publish()`, `subscribe()`, `disconnect()`

#### NatsConfigService
- **Purpose**: NATS configuration persistence
- **Features**: localStorage configuration, validation
- **Key Methods**: `getConfig()`, `saveConfig()`, `validateConfig()`

#### NatsConnectionManager
- **Purpose**: Global NATS connection lifecycle management
- **Features**: Auto-connect, reconnection, cross-tab synchronization
- **Key Methods**: `initialize()`, `attemptAutoConnect()`, `connect()`

#### AuditLogService
- **Collection**: `audit_logs`
- **Purpose**: System activity tracking and audit trails
- **Features**: Activity logging, formatted display
- **Key Methods**: `getRecentActivity()`, `formatLogForDisplay()`

## Service Relationships

### Inheritance Hierarchy

```
BaseService
├── EdgeService
├── LocationService
├── ThingService
├── ClientService
├── TopicPermissionService
├── UserService
├── OrganizationService
└── AuditLogService

TypeService (extends BaseService)
├── EdgeTypeService
├── EdgeRegionService
├── LocationTypeService
└── ThingTypeService
```

### Dependencies

```
All Services
└── ConfigService (URL construction)
└── API Service (HTTP operations)
    └── BaseService (CRUD operations)

Entity Services
└── Type Services (dropdown options)

ClientService
└── TopicPermissionService (role assignments)

UserService
└── OrganizationService (membership management)
```

## Data Flow Patterns

### Standard CRUD Flow

1. **UI Component** calls composable method
2. **Composable** calls service method
3. **Service** uses BaseService CRUD operations
4. **BaseService** uses API Service with caching
5. **API Service** makes HTTP request via Axios
6. **Response** flows back through the layers
7. **Cache** is updated for future requests

### Organization Context Flow

1. **User Authentication** establishes organization context
2. **BaseService.create()** automatically adds `organization_id`
3. **PocketBase API Rules** filter data by organization
4. **All Operations** respect organization boundaries
5. **Organization Switching** clears caches and updates context

### Type Integration Flow

1. **Type Services** manage type definitions
2. **Entity Services** integrate with type services
3. **Form Components** use type options for dropdowns
4. **Entity Creation** validates against available types
5. **Type Changes** refresh dependent caches

## Common Patterns

### Service Creation Pattern

```javascript
import { BaseService } from '../base/BaseService'
import { collectionEndpoint } from '../pocketbase-config'

export class MyEntityService extends BaseService {
  constructor() {
    super(
      'my_collection',
      collectionEndpoint,
      {
        jsonFields: ['metadata'],
        expandFields: ['related_id']
      }
    )
  }
  
  // Entity-specific methods
  getByStatus(status) {
    return this.getList({ filter: `status="${status}"` })
  }
}

export const myEntityService = new MyEntityService()
```

### Error Handling Pattern

```javascript
// All services use consistent error handling
try {
  const result = await service.operation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw error
}
```

### Caching Pattern

```javascript
// All BaseService operations include caching
return apiHelpers.getList(endpoint, params, {
  collectionName: this.collectionName,
  operation: 'list',
  skipCache: params.skipCache
})
```

## Integration Points

### With Composables

Services are consumed by composables which provide reactive state management:

```javascript
// Composable using service
export function useEdge() {
  const { performOperation } = useApiOperation()
  
  const fetchEdges = async (params = {}) => {
    return performOperation(
      () => edgeService.getList(params),
      {
        loadingRef: loading,
        errorRef: error,
        collection: 'edges'
      }
    )
  }
  
  return { fetchEdges }
}
```

### With Stores

Services integrate with Pinia stores for global state:

```javascript
// Store using service
export const useEdgeStore = defineStore('edge', () => {
  const edges = ref([])
  
  const loadEdges = async () => {
    const response = await edgeService.getList()
    edges.value = response.data.items
  }
  
  return { edges, loadEdges }
})
```

### With Components

Components use composables (not services directly):

```javascript
// Component using composable
export default {
  setup() {
    const { edges, loading, fetchEdges } = useEdge()
    
    onMounted(() => {
      fetchEdges()
    })
    
    return { edges, loading }
  }
}
```

## Configuration Management

### Environment Variables

All services use ConfigService for environment-specific configuration:

```env
# Required
VITE_API_URL=http://localhost:8080/pb

# Optional
VITE_APP_TITLE=IoT Platform
VITE_GRAFANA_URL=http://localhost:3000
VITE_NATS_HOST=ws://localhost:4222
```

### Service Configuration

```javascript
// ConfigService provides centralized configuration
const configService = new ConfigService()

// Collections
configService.collections.EDGES // 'edges'
configService.collections.USERS // 'users'

// Endpoints
configService.getCollectionEndpoint('edges') // '/api/collections/edges/records'
configService.getFileUrl('users', 'id', 'avatar.jpg') // Full file URL

// Validation
configService.validateConfiguration() // Check for issues
```

## Performance Optimizations

### Caching Strategy

1. **Two-Tier Caching**: localStorage + reactive stores
2. **Background Refresh**: Stale-while-revalidate pattern
3. **User Isolation**: Cache keys include user/organization context
4. **Selective Caching**: Only cache read operations
5. **Automatic Invalidation**: Clear cache after mutations

### Request Optimization

1. **Connection Reuse**: Axios instance with connection pooling
2. **Request Batching**: Batch multiple operations where possible
3. **Lazy Loading**: Load data only when needed
4. **Pagination**: Use pagination for large datasets
5. **Compression**: Automatic gzip compression

## Security Features

### Authentication & Authorization

1. **Token Management**: Automatic token injection in requests
2. **Token Expiry**: Automatic logout on 401 responses
3. **Organization Isolation**: Data automatically scoped to organizations
4. **Role-Based Access**: Server-side enforcement via PocketBase rules

### Data Protection

1. **HTTPS Enforcement**: All production API calls use HTTPS
2. **Input Validation**: Client and server-side validation
3. **Cache Isolation**: User-scoped caching prevents data leakage
4. **Sensitive Data**: Password hashing via external service

## Development Guidelines

### Adding New Services

1. **Extend BaseService** for entity services
2. **Configure JSON Fields** for complex data structures
3. **Add Type Validation** for code fields
4. **Implement Entity-Specific Methods** only
5. **Export Service Instance** for import by composables
6. **Update Index File** to include new service

### Service Best Practices

1. **Single Responsibility**: Each service manages one entity type
2. **Consistent Error Handling**: Use standard error patterns
3. **Cache Integration**: Leverage BaseService caching
4. **Organization Context**: Rely on automatic organization scoping
5. **Type Safety**: Validate codes and data formats
6. **Documentation**: Document all public methods

### Testing Strategy

1. **Unit Tests**: Test individual service methods
2. **Integration Tests**: Test service interactions
3. **Mock Services**: Use mocks for isolated testing
4. **Error Scenarios**: Test error handling paths
5. **Cache Behavior**: Verify caching works correctly

## Monitoring & Debugging

### Logging

```javascript
// Services include comprehensive logging
console.debug('BaseService.create - Adding organization_id')
console.error('Error creating entity:', error)
console.warn('Cache quota exceeded, clearing old items')
```

### Development Tools

1. **Vue DevTools**: Inspect store state and cache
2. **Network Tab**: Monitor API requests and caching
3. **Console Logs**: Service operation debugging
4. **Error Boundaries**: Graceful error handling in UI

### Performance Monitoring

1. **Cache Hit Rates**: Monitor cache effectiveness
2. **Request Times**: Track API response times
3. **Error Rates**: Monitor service failure rates
4. **Memory Usage**: Track cache memory consumption

## Future Considerations

### Scalability

1. **Service Workers**: Offline functionality
2. **IndexedDB**: Large-scale client-side storage
3. **Streaming**: Real-time data streams
4. **Micro-services**: Service decomposition for scale

### Features

1. **GraphQL**: More efficient data fetching
2. **Real-time**: WebSocket integration for live updates
3. **Offline Support**: Progressive web app capabilities
4. **Background Sync**: Queue operations when offline

This comprehensive service layer provides a robust foundation for the IoT Platform, with clear separation of concerns, consistent patterns, and excellent developer experience. The architecture scales well and maintains high performance through intelligent caching and optimization strategies.
