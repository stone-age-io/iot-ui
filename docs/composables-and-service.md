# IoT Platform UI: Composables & Service Layer Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Service Layer](#service-layer)
    - [Base Service Pattern](#base-service-pattern)
    - [Entity Services](#entity-services)
    - [Type Services](#type-services)
    - [Utility Services](#utility-services)
4. [Composables](#composables)
    - [Entity Composables](#entity-composables)
    - [Form Composables](#form-composables)
    - [Utility Composables](#utility-composables)
    - [NATS Composables](#nats-composables)
5. [Integration Patterns](#integration-patterns)
    - [Composable-Service Integration](#composable-service-integration)
    - [View-Composable Integration](#view-composable-integration)
    - [Error Handling Pattern](#error-handling-pattern)
6. [Best Practices](#best-practices)

## Introduction

This document provides detailed information about the composables and service layer implemented in the IoT Platform UI. These two architectural components form the backbone of the application, separating business logic from UI components and providing reusable functionality across the application.

The architecture follows Vue 3's Composition API patterns and implements a structured approach to API interactions through a service layer.

## Architecture Overview

The application is built with a clear separation of concerns:

- **Views**: Page components connected to routes
- **Components**: Reusable UI elements
- **Composables**: Reusable business logic using Vue's Composition API
- **Services**: Encapsulated API interactions
- **Stores**: Global state management with Pinia

This document focuses on the composables and service layers, which together handle most of the application's business logic and data operations.

## Service Layer

The service layer provides a consistent interface for interacting with the backend API. It follows a hierarchical pattern where entity-specific services extend a base service.

### Base Service Pattern

All entity services are built upon a common BaseService class that provides standard CRUD operations.

```javascript
// src/services/base/BaseService.js
export class BaseService {
  constructor(collectionName, collectionEndpoint, options = {}) {
    this.collectionName = collectionName;
    this.collectionEndpoint = collectionEndpoint;
    this.options = {
      jsonFields: [], // Fields to be parsed/stringified as JSON
      expandFields: [], // Fields to expand in queries
      ...options
    };
  }

  // CRUD Operations
  getList(params = {}) { /* ... */ }
  getById(id) { /* ... */ }
  create(entity) { /* ... */ }
  update(id, entity) { /* ... */ }
  delete(id) { /* ... */ }

  // Utility methods
  parseJsonFields(entity) { /* ... */ }
  stringifyJsonFields(entity) { /* ... */ }
  transformParams(transformedParams, originalParams) { /* ... */ }
}
```

The BaseService:

- Handles common CRUD operations (getList, getById, create, update, delete)
- Manages JSON field parsing and stringification
- Transforms query parameters for PocketBase compatibility
- Provides extension points for entity-specific services

### Entity Services

Entity services extend the BaseService to provide entity-specific functionality.

#### Edge Service

```javascript
// src/services/edge/edgeService.js
export class EdgeService extends BaseService {
  constructor() {
    super(
      COLLECTIONS.EDGES,
      collectionEndpoint,
      {
        jsonFields: ['metadata'],
        expandFields: []
      }
    );
  }

  // Entity-specific methods
  getEdges(params = {}) { /* ... */ }
  getEdge(id) { /* ... */ }
  createEdge(edge) { /* ... */ }
  updateEdge(id, edge) { /* ... */ }
  deleteEdge(id) { /* ... */ }
  updateEdgeMetadata(id, metadata, merge = true) { /* ... */ }
  
  // Parameter transformation override
  transformParams(transformedParams, originalParams) { /* ... */ }
}
```

#### Location Service

```javascript
// src/services/location/locationService.js
export class LocationService extends BaseService {
  // Similar pattern to EdgeService
  // Additional methods for location-specific operations
  getChildLocations(parentId, params = {}) { /* ... */ }
  getRootLocations(params = {}) { /* ... */ }
  uploadFloorPlan(id, formData) { /* ... */ }
  getFloorPlanImageUrl(location) { /* ... */ }
  updateLocationCoordinates(id, coordinates) { /* ... */ }
  isCircularReference(locationId, potentialParentId) { /* ... */ }
}
```

#### Thing Service

```javascript
// src/services/thing/thingService.js
export class ThingService extends BaseService {
  // Similar pattern to other entity services
  // Additional methods for thing-specific operations
  getThingsByLocation(locationId) { /* ... */ }
  updateThingState(id, state, merge = true) { /* ... */ }
  updateThingPosition(id, coordinates) { /* ... */ }
  
  // Field mapping methods
  mapFormToApiFields(formData) { /* ... */ }
  mapApiToFormFields(apiData) { /* ... */ }
}
```

#### Client Service

```javascript
// src/services/client/clientService.js
export class ClientService extends BaseService {
  // Similar pattern to other entity services
  // Additional methods for client-specific operations
  hashPassword(password) { /* ... */ }
}
```

#### Topic Permission Service

```javascript
// src/services/topic-permission/topicPermissionService.js
export class TopicPermissionService extends BaseService {
  // Similar pattern to other entity services
  // Additional methods for permission-specific operations
  getClientsByPermission(permissionId) { /* ... */ }
  addTopic(id, topic, type) { /* ... */ }
  removeTopic(id, topic, type) { /* ... */ }
}
```

### Type Services

Type services manage entity types (edge types, location types, thing types). They share a common TypeService base class.

```javascript
// src/services/type/typeService.js
export class TypeService extends BaseService {
  // Common type operations
  getTypes(params = {}) { /* ... */ }
  getType(id) { /* ... */ }
  createType(type) { /* ... */ }
  updateType(id, type) { /* ... */ }
  deleteType(id) { /* ... */ }
  isCodeInUse(code, excludeId = null) { /* ... */ }
}
```

Specific type services extend this class:

- `EdgeTypeService`
- `EdgeRegionService`
- `LocationTypeService`
- `ThingTypeService`

Each implements type-specific validations and provides options for dropdown lists.

### Utility Services

The application includes several utility services:

#### API Helpers

```javascript
// src/services/api.js
export const apiHelpers = {
  axiosInstance: apiService,
  getList: (endpoint, params = {}) => { /* ... */ },
  getById: (endpoint) => { /* ... */ },
  create: (endpoint, data) => { /* ... */ },
  update: (endpoint, id, data) => { /* ... */ },
  delete: (endpoint) => { /* ... */ }
};
```

#### NATS Services

- `natsService`: Manages WebSocket connections to NATS messaging server
- `natsConfigService`: Handles NATS configuration storage and validation
- `natsConnectionManager`: Manages connection lifecycle

#### User Service

```javascript
// src/services/user/userService.js
export class UserService extends BaseService {
  // User-specific operations
  getCurrentUser() { /* ... */ }
  updateProfile(id, userData) { /* ... */ }
  changePassword(id, passwordData) { /* ... */ }
}
```

## Composables

Composables encapsulate reusable business logic using Vue's Composition API. They provide a clean interface for components to interact with services and manage local state.

### Entity Composables

Entity composables wrap entity services and provide additional functionality like state management, UI feedback, and navigation helpers.

#### useEdge

```javascript
// src/composables/useEdge.js
export function useEdge() {
  const router = useRouter();
  const toast = useToast();
  
  // State
  const edges = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  // Helper functions
  const formatDate = (dateString) => { /* ... */ };
  const getTypeName = (typeCode) => { /* ... */ };
  const getRegionName = (regionCode) => { /* ... */ };
  const getTypeClass = (typeCode) => { /* ... */ };
  const getRegionClass = (regionCode) => { /* ... */ };
  const getMetadataSummary = (metadata) => { /* ... */ };
  const hasMetadata = (edge) => { /* ... */ };
  
  // CRUD operations
  const fetchEdges = async (params = {}) => { /* ... */ };
  const fetchEdge = async (id) => { /* ... */ };
  const deleteEdge = async (id, code) => { /* ... */ };
  
  // Additional operations
  const openInGrafana = (edgeId) => { /* ... */ };
  
  // Navigation methods
  const navigateToEdgeList = () => router.push({ name: 'edges' });
  const navigateToEdgeDetail = (id) => router.push({ name: 'edge-detail', params: { id } });
  // More navigation methods...
  
  return {
    // State
    edges,
    loading,
    error,
    
    // Helpers
    formatDate,
    getTypeName,
    // More helpers...
    
    // Operations
    fetchEdges,
    fetchEdge,
    deleteEdge,
    openInGrafana,
    
    // Navigation
    navigateToEdgeList,
    navigateToEdgeDetail,
    // More navigation methods...
  };
}
```

#### useLocation

Similar pattern to `useEdge` with location-specific functionality, including methods like:

- `fetchChildLocations`
- `fetchRootLocations`
- `uploadFloorPlan`
- `updateLocationCoordinates`

#### useThing

Similar pattern to other entity composables with thing-specific functionality, including methods like:

- `getThingsByLocation`
- `updateThingState`
- `openInGrafana`

#### useClient

Similar pattern to other entity composables with client-specific functionality, including methods like:

- `resetPassword`
- `copyToClipboard`

#### useTopicPermission

Similar pattern to other entity composables with topic permission-specific functionality, including methods like:

- `fetchClientsByPermission`
- `isValidTopic`

### Form Composables

Form composables handle form state, validation, and submission.

#### useEdgeForm

```javascript
// src/composables/useEdgeForm.js
export function useEdgeForm(mode = 'create') {
  const toast = useToast();
  const router = useRouter();
  
  // Form data
  const edge = ref({
    id: '',
    type: '',
    region: '',
    number: null,
    code: '',
    name: '',
    description: '',
    active: true,
    metadata: {}
  });
  
  // Loading state
  const loading = ref(false);
  
  // Validation rules
  const rules = {
    name: { 
      required: helpers.withMessage('Name is required', required),
      minLength: helpers.withMessage('Name must be at least 3 characters', minLength(3))
    },
    description: {}
  };
  
  // Add create-specific validation rules
  if (mode === 'create') {
    // Additional rules...
  }
  
  // Initialize Vuelidate
  const v$ = useVuelidate(rules, edge);
  
  // Methods
  const loadEdge = (edgeData) => { /* ... */ };
  const updateCode = () => { /* ... */ };
  const submitForm = async () => { /* ... */ };
  const resetForm = () => { /* ... */ };
  
  return {
    edge,
    v$,
    loading,
    loadEdge,
    updateCode,
    submitForm,
    resetForm
  };
}
```

Other form composables follow a similar pattern:

- `useLocationForm`
- `useThingForm`
- `useProfileForm`
- `useTypeForm` (base for type forms)

### Utility Composables

#### useConfirmation

```javascript
// src/composables/useConfirmation.js
export function useConfirmation() {
  // Dialog state
  const dialog = ref({
    visible: false,
    loading: false,
    item: null,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    details: '',
    type: 'warning',
    confirmLabel: 'Confirm',
    confirmIcon: 'pi pi-check',
    cancelLabel: 'Cancel'
  });
  
  // Methods
  const confirm = (item = null, options = {}) => { /* ... */ };
  const updateDialog = (state) => { /* ... */ };
  const resetDialog = () => { /* ... */ };
  
  return {
    dialog,
    confirm,
    updateDialog,
    resetDialog
  };
}

// Specialized confirmation for deletions
export function useDeleteConfirmation() {
  const { dialog, confirm, updateDialog, resetDialog } = useConfirmation();
  
  const confirmDelete = (item, entityName = 'item', identifierField = 'code') => { /* ... */ };
  
  return {
    deleteDialog: dialog,
    confirmDelete,
    updateDeleteDialog: updateDialog,
    resetDeleteDialog: resetDialog
  };
}
```

#### useDashboard

```javascript
// src/composables/useDashboard.js
export function useDashboard() {
  // Uses other entity composables
  const { edges, loading: edgesLoading, fetchEdges } = useEdge();
  const { locations, loading: locationsLoading, fetchLocations } = useLocation();
  const { things, loading: thingsLoading, fetchThings } = useThing();
  
  // Additional state
  const clientsCount = ref(0);
  const activity = ref([]);
  const loading = ref(false);
  
  // Computed values
  const edgesCount = computed(() => edges.value.length);
  const locationsCount = computed(() => locations.value.length);
  const thingsCount = computed(() => things.value.length);
  
  // Methods
  const fetchDashboardData = async () => { /* ... */ };
  const fetchClientsCount = async () => { /* ... */ };
  const fetchActivityData = async () => { /* ... */ };
  
  // Activity formatting helpers
  const getActivityTypeFromLog = (log) => { /* ... */ };
  const formatLogMessage = (log) => { /* ... */ };
  const formatTimestamp = (isoDate) => { /* ... */ };
  
  return {
    // State and computed values
    edges, locations, things, clientsCount, activity, loading,
    edgesCount, locationsCount, thingsCount,
    
    // Methods
    fetchDashboardData,
    fetchActivityData,
    formatTimestamp,
    openGrafana
  };
}
```

#### useUserProfile

```javascript
// src/composables/useUserProfile.js
export function useUserProfile() {
  // State and services
  const router = useRouter();
  const toast = useToast();
  const authStore = useAuthStore();
  const profile = ref({});
  const loading = ref(false);
  const error = ref(null);
  
  // Methods
  const formatDate = (dateString) => { /* ... */ };
  const fetchProfile = async () => { /* ... */ };
  const updateProfile = async (profileData) => { /* ... */ };
  const changePassword = async (currentPassword, newPassword, confirmPassword) => { /* ... */ };
  
  // Navigation
  const navigateToProfile = () => router.push({ name: 'profile' });
  const navigateToHome = () => router.push({ name: 'dashboard' });
  
  return {
    // State
    profile, loading, error,
    
    // Methods
    fetchProfile, updateProfile, changePassword, formatDate,
    
    // Navigation
    navigateToProfile, navigateToHome
  };
}
```

#### useTypeManagement

Base composable for managing entity types (edge types, location types, thing types).

```javascript
// src/composables/useTypeManagement.js
export function useTypeManagement(typeService, routeNames, entityName) {
  // Common state management
  const types = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  // Common operations
  const fetchTypes = async (params = {}) => { /* ... */ };
  const fetchType = async (id) => { /* ... */ };
  const createType = async (typeData) => { /* ... */ };
  const updateType = async (id, typeData) => { /* ... */ };
  const deleteType = async (id, name) => { /* ... */ };
  const validateCode = (code) => { /* ... */ };
  
  // Navigation methods
  const navigateToTypeList = () => router.push({ name: routeNames.list });
  const navigateToTypeDetail = (id) => router.push({ name: routeNames.detail, params: { id } });
  // More navigation methods...
  
  return {
    // State, methods, and navigation
  };
}
```

Type-specific composables like `useEdgeType`, `useLocationType`, and `useThingType` use this base composable and add type-specific functionality.

### NATS Composables

#### useNatsSettings

```javascript
// src/composables/useNatsSettings.js
export function useNatsSettings() {
  // State
  const config = ref(natsConfigService.getDefaultConfig());
  const connectionStatus = ref('disconnected');
  const errorMessage = ref('');
  const loading = ref(false);
  
  // Computed properties
  const isConnected = computed(() => connectionStatus.value === 'connected');
  const isConnecting = computed(() => connectionStatus.value === 'connecting');
  const hasError = computed(() => connectionStatus.value === 'error');
  
  // Methods
  const initSettings = () => { /* ... */ };
  const connectToNats = async () => { /* ... */ };
  const disconnectFromNats = async () => { /* ... */ };
  const saveSettings = () => { /* ... */ };
  const resetSettings = () => { /* ... */ };
  
  return {
    // State, computed, and methods
  };
}
```

#### useNatsMessages

```javascript
// src/composables/useNatsMessages.js
export function useNatsMessages(maxMessages = 100) {
  // State
  const messages = ref([]);
  const paused = ref(false);
  const subscriptions = ref({});
  const topics = ref([]);
  const currentPage = ref(1);
  const pageSize = ref(5);
  const loading = ref(false);
  const error = ref(null);
  const activeSubscriptionIds = ref(new Set());
  
  // Methods for topic management
  const loadTopics = () => { /* ... */ };
  const subscribe = async (topic) => { /* ... */ };
  const unsubscribe = async (topic) => { /* ... */ };
  const subscribeToAllTopics = async () => { /* ... */ };
  const unsubscribeFromAllTopics = async () => { /* ... */ };
  
  // Methods for message handling
  const togglePause = () => { /* ... */ };
  const addMessage = (message) => { /* ... */ };
  const clearMessages = () => { /* ... */ };
  const formatMessageData = (data) => { /* ... */ };
  const formatTimestamp = (timestamp, includeDate = false) => { /* ... */ };
  
  // Pagination methods
  const paginatedMessages = computed(() => { /* ... */ });
  const totalPages = computed(() => { /* ... */ });
  const goToPage = (page) => { /* ... */ };
  const nextPage = () => { /* ... */ };
  const prevPage = () => { /* ... */ };
  
  return {
    // State, computed, and methods
  };
}
```

## Integration Patterns

### Composable-Service Integration

Composables typically wrap services, providing:

1. State management (loading, error, data)
2. UI feedback via toasts
3. Method wrapping with error handling
4. Navigation helpers

```javascript
// Example composable-service integration
const fetchItems = async (params = {}) => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await itemService.getItems(params);
    items.value = response.data.items || [];
    return items.value;
  } catch (err) {
    console.error('Error fetching items:', err);
    error.value = 'Failed to load items. Please try again.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load items',
      life: 3000
    });
    return [];
  } finally {
    loading.value = false;
  }
};
```

### View-Composable Integration

Views use composables to access functionality and state:

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useEntity } from '../../composables/useEntity';
import PageHeader from '../../components/common/PageHeader.vue';
import DataTable from '../../components/common/DataTable.vue';

// Use the entity composable
const { 
  entities, 
  loading, 
  fetchEntities,
  navigateToEntityDetail
} = useEntity();

// Initialize filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Fetch data on mount
onMounted(() => {
  fetchEntities();
});
</script>
```

### Error Handling Pattern

The application uses a consistent approach to error handling:

1. **Service Layer**: Handles API errors with consistent error transformation
2. **Composable Layer**: Manages error state and provides user feedback via toasts
3. **Component Layer**: Displays appropriate error messages to users
4. **Global Handler**: Catches uncaught errors in the Axios interceptors

```javascript
// Error handling in composables
try {
  // Operation
} catch (error) {
  console.error('Error description:', error);
  error.value = 'User-friendly error message';
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: 'User-friendly error message',
    life: 3000
  });
} finally {
  loading.value = false;
}
```

## Best Practices

The codebase demonstrates several best practices:

1. **Separation of Concerns**: Clearly separates UI (views/components), business logic (composables), and data access (services)
2. **Reusable Logic**: Extracts common patterns into base classes and composables
3. **Consistent Error Handling**: Uses a consistent pattern for error reporting
4. **User Feedback**: Provides toast notifications for operations
5. **Type Safety**: Uses clear parameter and return types
6. **Navigation Encapsulation**: Wraps router operations in navigation methods
7. **State Management**: Uses reactive state with Vue's Composition API
8. **Method Naming**: Uses clear and consistent method naming

Key best practices for extending the codebase:

1. For new entity types, create both a service (extending BaseService) and a composable
2. For form handling, create a dedicated form composable
3. For shared UI patterns, create utility composables
4. Maintain consistent error handling and user feedback
5. Document return values and parameters
