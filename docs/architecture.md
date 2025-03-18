# IoT UI - Architecture Documentation

## Overview

This document describes the architectural patterns, code organization principles, and development conventions used in the IoT Platform Management UI. It serves as a reference guide for understanding the codebase structure and maintaining consistency when adding new features.

## Code Organization

The application follows a feature-based organization with clear separation of concerns:

```
src/
├── assets/              # Static assets and global CSS
├── components/          # Reusable Vue components
│   ├── common/          # Common UI components
│   └── dashboard/       # Dashboard-specific components
├── layouts/             # Page layout components
├── router/              # Vue Router configuration
├── services/            # API services and utilities
├── stores/              # Pinia state stores
└── views/               # Page components
    ├── Auth/            # Authentication views
    ├── Entities/        # Entity management views
    │   ├── Edges/       # Edge management
    │   ├── Locations/   # Location management
    │   └── Things/      # IoT device management
    └── Messaging/       # Messaging system views
        ├── Clients/     # Client management
        └── TopicPermissions/ # Permission management
```

### Key Architecture Principles

1. **Component-Based Design**: The UI is built using reusable Vue components with clear responsibilities.
2. **Service Layer**: API interactions are encapsulated in service modules.
3. **State Management**: Application state is managed using Pinia stores.
4. **Routing**: Page navigation is handled by Vue Router.
5. **Responsive Design**: UI adapts to different screen sizes using Tailwind CSS.

## Component Patterns

### Component Structure

Components follow the Vue 3 Composition API with `<script setup>` syntax:

```vue
<template>
  <!-- Template HTML with proper structure and semantics -->
</template>

<script setup>
// Imports
import { ref, computed, onMounted } from 'vue'
import { useService } from '../services/serviceModule'

// Props and emits
const props = defineProps({
  propName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

// State management
const localState = ref(initialValue)

// Computed properties
const derivedValue = computed(() => {
  return transformation(localState.value)
})

// Lifecycle hooks
onMounted(() => {
  // Initialization code
})

// Methods
const handleAction = () => {
  // Implementation
  emit('update', localState.value)
}
</script>
```

### Component Types

1. **Page Components**: Located in `views/`, represent full pages and are connected to routes.
2. **Layout Components**: Located in `layouts/`, define the structure of pages.
3. **Common Components**: Located in `components/common/`, reusable across the application.
4. **Feature Components**: Located in feature-specific directories, used within specific features.

### Component Naming Conventions

- **PascalCase** for component names
- **Suffix by type**: `*View.vue` for pages, `*Layout.vue` for layouts
- **Prefix by feature**: `Edge*`, `Location*`, etc., for feature components

## Service Layer Pattern

Services encapsulate all API interactions and follow a consistent pattern:

```javascript
// Service for entity CRUD operations
export const entityService = {
  /**
   * Get a paginated list of entities
   * @param {Object} params - Query parameters
   * @returns {Promise} - Axios promise with data
   */
  getEntities(params = {}) {
    const endpoint = collectionEndpoint(COLLECTIONS.ENTITY_NAME)
    const transformedParams = transformPaginationParams(params)
    
    return apiHelpers.getList(endpoint, transformedParams)
      .then(response => {
        return { data: transformResponse(response.data) }
      })
  },

  /**
   * Get a single entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise} - Axios promise with entity data
   */
  getEntity(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.ENTITY_NAME, id)
    return apiHelpers.getById(endpoint)
  },

  /**
   * Create a new entity
   * @param {Object} entity - Entity data
   * @returns {Promise} - Axios promise with created entity
   */
  createEntity(entity) {
    const endpoint = collectionEndpoint(COLLECTIONS.ENTITY_NAME)
    return apiHelpers.create(endpoint, entity)
  },

  /**
   * Update an existing entity
   * @param {string} id - Entity ID
   * @param {Object} entity - Updated entity data
   * @returns {Promise} - Axios promise with updated entity
   */
  updateEntity(id, entity) {
    const endpoint = collectionEndpoint(COLLECTIONS.ENTITY_NAME, id)
    return apiHelpers.update(endpoint, null, entity)
  },

  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise} - Axios promise
   */
  deleteEntity(id) {
    const endpoint = collectionEndpoint(COLLECTIONS.ENTITY_NAME, id)
    return apiHelpers.delete(endpoint)
  }
}

// Additional helper functions for the entity
export const entityHelpers = {
  // Utility functions specific to this entity
}
```

## View Pattern

Views follow a consistent pattern for each entity:

1. **ListView**: Displays a paginated, filterable list of entities
2. **DetailView**: Displays detailed information about a single entity
3. **CreateView**: Form for creating a new entity
4. **EditView**: Form for editing an existing entity

Each view handles loading states, errors, and appropriate user feedback.

## Form Pattern

Forms use Vuelidate for validation and follow this pattern:

```vue
<script setup>
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'

// Form state
const formData = ref({
  field1: '',
  field2: ''
})

// Validation rules
const rules = {
  field1: { required: helpers.withMessage('Field is required', required) },
  field2: { required: helpers.withMessage('Field is required', required) }
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, formData)

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  // Proceed with submission
  // ...
}
</script>
```

## API Interaction Pattern

API interactions follow these principles:

1. **Service Abstraction**: All API calls are encapsulated in service modules
2. **Error Handling**: Consistent error handling approach with user feedback
3. **Loading States**: UI components display loading states during API operations
4. **Response Transformation**: API responses are transformed to a consistent format

## State Management

Pinia is used for state management with these patterns:

1. **Entity Stores**: Stores for managing entity data and operations
2. **UI Stores**: Stores for managing UI state (theme, preferences)
3. **Auth Store**: Store for managing authentication state

## Naming Conventions

1. **Files**:
   - Components: `PascalCase.vue`
   - Services: `camelCase.js`
   - Stores: `camelCase.js`

2. **Variables**:
   - `camelCase` for variables and functions
   - `PascalCase` for components and classes
   - `UPPER_CASE` for constants

3. **CSS**:
   - Tailwind utility classes for most styling
   - Custom classes use `kebab-case`

## Error Handling

The application uses a consistent approach to error handling:

1. **Service Layer**: Catches and transforms API errors
2. **Component Layer**: Displays appropriate error messages to users
3. **Global Handler**: Catches uncaught errors and provides fallback UI

## Performance Considerations

1. **Lazy Loading**: Routes are lazy-loaded to improve initial load time
2. **Pagination**: Lists use pagination to limit data transfer
3. **Caching**: Frequently accessed data may be cached in stores
4. **Component Optimization**: Heavy components implement performance optimizations

## Testing Strategy

1. **Component Tests**: Test component functionality in isolation
2. **Service Tests**: Test service modules with mocked API responses
3. **Integration Tests**: Test key user flows across multiple components
4. **E2E Tests**: Test critical paths in a production-like environment

## Feature Development Workflow

When adding a new feature or entity:

1. **Add Service**: Create service module for API interactions
2. **Add Views**: Create list, detail, create, and edit views
3. **Add Routes**: Register routes in the router
4. **Add Store**: Create store if needed for state management
5. **Update Navigation**: Add navigation items in the sidebar

## Internationalization

The application is designed to support internationalization:

1. **Text Extraction**: UI text is extracted to translation files
2. **Dynamic Loading**: Translations are loaded based on user language
3. **Formatting**: Dates, numbers, and currencies are formatted according to locale

---
