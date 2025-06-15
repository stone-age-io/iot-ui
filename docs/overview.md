# IoT Platform Architecture Overview

## Introduction

The IoT Platform is a Vue.js-based web application designed to manage and monitor IoT devices, locations, and messaging. The application follows modern Vue.js patterns, emphasizing the Composition API, reusable logic through composables, and centralized state management via Pinia stores. The platform is built on top of PocketBase as the backend service.

## Core Technologies

- **Vue.js 3**: Framework with Composition API
- **Pinia**: State management library
- **Vue Router**: Client-side routing
- **PrimeVue**: UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API communication
- **PocketBase**: Backend service and database

## Key Architectural Components

### 1. Composables

The application extensively uses the composable pattern to create reusable, self-contained logic units. Composables encapsulate related state and behavior, promoting code reuse and separation of concerns.

Key composables include:
- `useApiOperation`: Standardizes API operations with loading states and error handling
- `useEdge`, `useLocation`, `useThing`: Entity-specific logic
- `useReactiveData`: Reactive data handling with integrated caching
- `useTheme`: Theme-related utilities
- `useConfirmation`: Handles confirmation dialogs
- `useNatsMessages`: NATS message subscriptions and display
- `useOrganization`: Organization management and context

### 2. Stores

Pinia stores centralize state management across the application:

- `auth.js`: Authentication state and operations
- `cacheStore.js`: Manages the application's caching strategy
- `theme.js`: Handles theme preferences and switching
- `types.js`: Central repository for all entity type data
- `organization.js`: Organization context and management

### 3. Services

Services act as an abstraction layer between the application and back-end APIs:

- **BaseService**: Common CRUD operations with automatic organization context
- **Entity services**: API services for each entity type (edges, locations, things, etc.)
- **Type services**: Managing entity type data
- **ConfigService**: Centralized configuration and URL management
- **NATS services**: Real-time messaging services

### 4. Layouts

The application uses layout components to define the overall page structure:
- `DefaultLayout.vue`: Main application layout with sidebar, header, and content area
- `AuthLayout.vue`: Layout for authentication pages

### 5. Router

Vue Router handles navigation with configurations that include:
- Route guards for authentication
- Nested routes for layouts
- Meta information for each route

### 6. Caching Strategy

The application implements a sophisticated caching strategy:
- Centralized cache management through the CacheStore
- Reactive data access with automatic cache updates
- Collection-based cache invalidation
- User-scoped caching to maintain data isolation

### 7. Organization Context

The platform supports multi-organization architecture:
- Automatic organization_id injection in created entities
- Organization-scoped data access
- Context switching between organizations
- Role-based permissions within organizations

### 8. Theming System

The application supports light and dark themes:
- Theme detection and switching in `useTheme` composable
- CSS variables for consistent theming
- PrimeVue theme integration
- Automatic system preference detection

## Component Patterns

Components follow the Vue 3 Composition API with `<script setup>` syntax:

1. **Page Components**: Located in `views/`, represent full pages and are connected to routes.
2. **Layout Components**: Located in `layouts/`, define the structure of pages.
3. **Common Components**: Located in `components/common/`, reusable across the application.
4. **Feature Components**: Located in feature-specific directories, used within specific features.

Components use a consistent structure:
- Template with proper HTML semantics
- Script setup with composable integration
- Scoped CSS when component-specific styles are needed

## View Patterns

Views follow consistent patterns based on their purpose:

### List Views
- Use DataTable for displaying collections
- Include actions for creating, editing, and deleting
- Leverage entity composables for data fetching and operations

### Detail Views
- Display entity details with appropriate formatting
- Include related entity information
- Provide actions for editing and deleting

### Form Views 
- Use form composables for state, validation, and submission
- Leverage the standardized API operation pattern
- Provide consistent validation feedback

## Data Flow

1. **User Interactions**: User interactions trigger component methods
2. **Composable Logic**: Composables handle business logic and state management
3. **Service Calls**: Services make API requests with automatic organization context
4. **Data Storage**: Responses are stored in Pinia and cached
5. **Reactive Updates**: UI automatically updates through Vue's reactivity system

## Entity Types Management

The `useTypesStore` provides a centralized repository for all entity types:
- Edge types and regions
- Location types
- Thing types

This centralization offers several benefits:
- Single source of truth for type data
- Consistent loading and error states
- Reduced network requests through caching
- Helper methods for common operations like getting type names

## Organization Architecture

The platform is designed for multi-organization use:

### Organization Context
- Users belong to one or more organizations
- Current organization context is maintained in state
- All entity operations are scoped to the current organization

### Automatic Organization Injection
- BaseService automatically adds organization_id to created entities
- Ensures data isolation between organizations
- Simplifies entity creation across the application

### Role-Based Access
- Users have roles within organizations (admin, member)
- Role-based UI rendering and operation permissions
- Organization-level administration capabilities

## Feature Development Workflow

When adding a new feature or entity:

1. **Define Service**:
   - Create a service extending BaseService
   - Configure JSON fields and expand fields if needed
   - Add entity-specific methods

2. **Create Composables**:
   - Create entity composable using `useApiOperation`
   - Create form composable for form handling
   - Integrate with `useReactiveData` for caching

3. **Implement Views**:
   - Create List, Detail, Create, and Edit views
   - Use composables for data and logic

4. **Register Routes**:
   - Add routes to router configuration

5. **Update Navigation**:
   - Add navigation items to sidebar as needed

## API Communication

The application communicates with PocketBase through a standardized Axios-based approach:

### Why Axios Instead of PocketBase SDK
- **Full control** over caching, error handling, request flow
- **Teaching value** - clear, explicit patterns for other developers
- **Flexibility** - easier to customize behavior
- **Transparency** - no "magic" from SDK, everything is explicit

### Benefits of This Approach
- Consistent error handling across all API operations
- Integrated caching strategy
- Standardized loading states and user feedback
- Organization context automatically handled

## Performance Considerations

The application implements several performance optimizations:

### Caching Strategy
- Two-tier caching: localStorage for persistence, reactive store for real-time updates
- Background cache refresh to maintain data freshness
- Collection-based cache invalidation

### Reactive Data Management
- `useReactiveData` composable provides efficient data loading
- Automatic cache updates on data changes
- Reduced API calls through intelligent caching

### Component Optimization
- Computed properties for derived state
- Proper Vue reactivity patterns
- Lazy loading of non-critical components

## Security Considerations

### Authentication & Authorization
- JWT-based authentication with PocketBase
- Organization-based data access control
- Role-based permissions within organizations

### Data Isolation
- Automatic organization_id injection ensures data separation
- User-scoped caching prevents data leakage
- Organization context switching with proper cleanup

## Conclusion

The IoT Platform exemplifies modern Vue.js application architecture with its emphasis on composition, reusability, and clean separation of concerns. The extensive use of composables, centralized stores, consistent patterns, and automatic organization context creates a maintainable and scalable codebase that can serve as a template for similar applications.

The architecture successfully balances complexity with usability, providing a robust foundation for IoT device management while remaining approachable for developers who need to extend or customize the platform.
