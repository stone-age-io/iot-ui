# IoT UI - Composables Layer Overview

## Introduction

The composables layer in the IoT UI application provides reusable business logic using Vue 3's Composition API. This layer sits between the service layer and Vue components, encapsulating business logic, state management, and API interactions into reusable, testable units.

## Architecture Principles

The composables layer follows these core principles:

- **Centralized API Operation Handling**: Through `useApiOperation`
- **Reactive Data Management**: Through `useReactiveData` with integrated caching
- **Consistent Error Handling**: Standardized error patterns across all composables
- **Organization Context**: Automatic organization scoping for all data operations
- **Type Safety**: Well-defined return types and parameter validation
- **Separation of Concerns**: Business logic separated from UI components

## Composable Categories

### Core Composables

Foundation composables that provide essential functionality used across the application:

- **[useApiOperation](./core/use-api-operation.md)**: Centralizes API operation handling with loading states, error management, and toast notifications
- **[useReactiveData](./core/use-reactive-data.md)**: Manages reactive data with integrated caching and automatic updates
- **[useTheme](./core/use-theme.md)**: Theme management with system preference detection
- **[useConfirmation](./core/use-confirmation.md)**: Standardized confirmation dialogs and user prompts
- **[useDataTable](./core/use-data-table.md)**: PrimeVue DataTable state management with lazy loading

### Entity Composables

Composables that manage specific entity types with full CRUD operations:

- **[useEdge](./entity/use-edge.md)**: Edge entity management with metadata handling
- **[useLocation](./entity/use-location.md)**: Location entity management with hierarchical support
- **[useThing](./entity/use-thing.md)**: IoT device/thing management with state tracking
- **[useOrganization](./entity/use-organization.md)**: Organization context and switching

### Type Management Composables

Composables for managing entity type definitions:

- **[useTypeManagement](./type-management/use-type-management.md)**: Base composable for all type management
- **[useEdgeType](./type-management/use-edge-type.md)**: Edge type definitions and validation
- **[useEdgeRegion](./type-management/use-edge-region.md)**: Edge region definitions
- **[useLocationType](./type-management/use-location-type.md)**: Location type definitions
- **[useThingType](./type-management/use-thing-type.md)**: Thing/device type definitions

### Specialized Composables

Composables with specific, focused functionality:

- **[useNatsMessages](./specialized/use-nats-messages.md)**: NATS message subscriptions and real-time messaging
- **[useDashboard](./specialized/use-dashboard.md)**: Dashboard data aggregation and metrics

## Common Patterns

### API Operation Pattern

All composables that interact with services use the `useApiOperation` pattern:

```javascript
import { useApiOperation } from '@/composables/useApiOperation'

export function useEntity() {
  const { performOperation, performCreate, performUpdate, performDelete } = useApiOperation()
  
  const createEntity = async (entityData) => {
    return performCreate(
      () => entityService.create(entityData),
      {
        loadingRef: loading,
        entityName: 'Entity',
        entityIdentifier: entityData.code,
        collection: 'entities'
      }
    )
  }
}
```

### Reactive Data Pattern

For data that benefits from caching, use the `useReactiveData` pattern:

```javascript
import { useReactiveData } from '@/composables/useReactiveData'

export function useEntity() {
  const entitiesData = useReactiveData({
    collection: 'entities',
    operation: 'list',
    fetchFunction: fetchEntitiesRaw,
    processData: data => data?.items || []
  })
  
  const entities = computed(() => entitiesData.data.value || [])
}
```

### Standard Return Pattern

All composables follow a consistent return structure:

```javascript
export function useEntity() {
  return {
    // State
    entities: ComputedRef<Array>,
    loading: Ref<boolean>,
    error: Ref<string|null>,
    
    // Helpers
    formatDate: Function,
    validateCode: Function,
    
    // Operations
    fetchEntities: Function,
    createEntity: Function,
    updateEntity: Function,
    deleteEntity: Function,
    
    // Navigation
    navigateToEntityList: Function,
    navigateToEntityDetail: Function
  }
}
```

## Integration with Services

Composables act as the bridge between services and components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │───▶│   Composables   │───▶│    Services     │
│                 │    │                 │    │                 │
│ - UI Logic      │    │ - Business      │    │ - API Calls     │
│ - User Events   │    │   Logic         │    │ - Data          │
│ - Display       │    │ - State Mgmt    │    │   Transformation│
│                 │    │ - Validation    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Benefits of This Architecture

1. **Reusability**: Logic can be shared across multiple components
2. **Testability**: Business logic can be unit tested independently
3. **Maintainability**: Changes to business logic are centralized
4. **Consistency**: Standardized patterns across the application
5. **Performance**: Reactive caching reduces unnecessary API calls

## Error Handling Strategy

All composables use standardized error handling through `useApiOperation`:

```javascript
// Automatic error handling with toast notifications
const fetchData = async () => {
  return performOperation(
    () => service.getData(),
    {
      loadingRef: loading,
      errorRef: error,
      errorMessage: 'Failed to load data',
      successMessage: 'Data loaded successfully',
      collection: 'entities'
    }
  )
}
```

## Cache Management

The composables layer integrates with the application's caching strategy:

### Automatic Cache Updates

When using `useApiOperation` with a `collection` parameter, cache invalidation is automatic:

```javascript
// Cache is automatically invalidated after this operation
const createEntity = async (data) => {
  return performCreate(
    () => service.create(data),
    {
      collection: 'entities', // Triggers cache invalidation
      entityName: 'Entity'
    }
  )
}
```

### Reactive Data Caching

`useReactiveData` provides intelligent caching with background refresh:

```javascript
const entitiesData = useReactiveData({
  collection: 'entities',
  operation: 'list',
  fetchFunction: fetchEntitiesRaw
})

// Data is cached and automatically refreshed in background
// Manual refresh available: entitiesData.refreshData(true)
```

## Development Guidelines

### When to Create a Composable

Create a composable when you have:
- Logic that needs to be shared across multiple components
- Complex state management requirements
- API interactions that benefit from standardized handling
- Business logic that should be separated from UI concerns

### Naming Conventions

- **Entity composables**: `useEntityName` (e.g., `useEdge`, `useLocation`)
- **Utility composables**: `useFeatureName` (e.g., `useTheme`, `useConfirmation`)
- **Type composables**: `useEntityType` (e.g., `useEdgeType`, `useThingType`)

## Best Practices

### 1. Use Consistent API Patterns

Always use `useApiOperation` for API calls:

```javascript
// ✅ Good
const { performOperation } = useApiOperation()
const result = await performOperation(
  () => service.create(data),
  { loadingRef: loading, collection: 'entities' }
)

// ❌ Avoid direct service calls
const result = await service.create(data)
```

### 2. Leverage Reactive Data

Use `useReactiveData` for list data that benefits from caching:

```javascript
// ✅ Good - automatic caching
const entitiesData = useReactiveData({
  collection: 'entities',
  operation: 'list',
  fetchFunction: fetchEntitiesRaw
})

// ❌ Avoid manual state management
const entities = ref([])
```

### 3. Provide Helper Functions

Include formatting and validation helpers:

```javascript
export function useEntity() {
  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return dayjs(dateString).format('MMM D, YYYY HH:mm')
  }
  
  const validateCode = (code) => {
    return /^[a-z0-9-]+$/.test(code)
  }
  
  return {
    formatDate,
    validateCode,
    // ... other methods
  }
}
```

### 4. Include Navigation Helpers

Provide navigation methods for consistency:

```javascript
// Navigation helpers
const navigateToEntityDetail = (id) => {
  router.push({ name: 'entity-detail', params: { id } })
}

const navigateToEntityList = (query = {}) => {
  router.push({ name: 'entities', query })
}
```

### 5. Handle Loading States

Always provide loading state management:

```javascript
const loading = ref(false)
const error = ref(null)

const fetchData = async () => {
  return performOperation(
    () => service.getData(),
    {
      loadingRef: loading,
      errorRef: error,
      errorMessage: 'Failed to load data'
    }
  )
}
```

## Testing Strategy

### Unit Testing Composables

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEdge } from '@/composables/useEdge'

describe('useEdge', () => {
  beforeEach(() => {
    // Mock services
    vi.mock('@/services', () => ({
      edgeService: {
        getList: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }
    }))
  })
  
  it('should fetch edges on mount', async () => {
    const { edges, fetchEdges } = useEdge()
    
    await fetchEdges()
    
    expect(edges.value).toBeDefined()
  })
})
```

### Integration Testing

Test composables with real services in a controlled environment to ensure proper integration with the service layer and caching system.

## Performance Considerations

### Reactive Caching

The `useReactiveData` composable provides several performance benefits:
- Reduces redundant API calls
- Background data refresh maintains freshness
- User-scoped caching prevents data leakage
- Automatic cache invalidation on data mutations

### Memory Management

Composables automatically handle cleanup when components are unmounted, but be aware of:
- Long-running subscriptions (NATS messages)
- Timer intervals (dashboard auto-refresh)
- Event listeners (theme changes)

## Migration Guide

When migrating existing components to use composables:

1. **Extract business logic** from components into composables
2. **Replace direct service calls** with `useApiOperation` patterns
3. **Implement reactive data** for cached list data
4. **Add helper functions** for formatting and validation
5. **Update components** to use composable return values

This architecture provides a solid foundation for building maintainable, performant Vue.js applications with clear separation of concerns and consistent patterns throughout the codebase.
