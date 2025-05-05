# Multi-Organization Implementation Guide

## Overview

The IoT Platform has been designed with multi-organization support, enabling users to belong to multiple organizations and switch between them. This document outlines how the multi-organization feature is implemented and how the various components work together to provide organization isolation and data scoping.

## Architecture Components

The multi-organization feature consists of several key components:

1. **PocketBase Schema**: Database structure with organization relationships
2. **Service Layer**: BaseService and entity-specific services with organization awareness
3. **Pinia Stores**: Organization and Auth stores for state management
4. **Caching System**: Organization-scoped caching strategy
5. **UI Components**: User interface for organization management
6. **Access Control**: PocketBase API rules for organization-based security

## 1. PocketBase Schema

### Organization Collection

```
organizations
- id: UUID (auto-generated)
- name: Text
- code: Text (unique)
- description: Text
- logo: File (optional)
- settings: JSON (organization-specific settings)
- created: DateTime (auto-generated)
- updated: DateTime (auto-generated)
```

### Organization Relationships

All entity collections contain an `organization_id` field that establishes a relationship to the organizations collection:

- edges
- locations
- things
- clients
- topic_permissions
- (all type collections)

### User Collection Extensions

The user collection has been extended with:

```
- organizations: Relation (organizations, multiple)
- org_roles: JSON (maps organization IDs to roles: "admin" or "member")
- current_organization_id: Relation (organizations, single)
- is_org_admin: Boolean (designates users who can create and manage organizations globally)
```

## 2. Service Layer Implementation

### BaseService Organization Handling

The BaseService automatically handles organization scoping in all operations:

#### Creating Entities

When creating a new entity, the BaseService automatically associates it with the user's current organization:

```javascript
async create(entity) {
  // Get current organization ID
  const authData = this.getUserAuthData();
  const currentOrgId = authData?.currentOrgId;
  
  // Add organization_id if not already provided
  const entityData = { ...entity };
  if (currentOrgId && !entityData.organization_id) {
    entityData.organization_id = currentOrgId;
  }
  
  // Proceed with creation...
}
```

#### Reading Entities

For list and detail operations, no explicit organization filtering is needed in the service layer. Instead, PocketBase API rules handle the filtering:

```javascript
getList(params = {}) {
  // No explicit organization filtering - PocketBase API rules handle this
  // ...
}
```

### Organization-Specific Services

The `OrganizationService` provides specialized methods for organization operations:

```javascript
// Get organizations for the current user
getUserOrganizations(params = {}) { /* ... */ }

// Set current organization for user
setCurrentOrganization(organizationId) { /* ... */ }

// Get user's role in an organization
getUserRole(organizationId, user) { /* ... */ }
```

## 3. Pinia Stores

### Organization Store

The Organization Store (`organization.js`) centralizes organization state management:

```javascript
export const useOrganizationStore = defineStore('organization', () => {
  // State
  const currentOrganization = ref(null)
  const userOrganizations = ref([])
  
  // Actions
  function setCurrentOrganization(organization) { /* ... */ }
  function setUserOrganizations(organizations) { /* ... */ }
  function userBelongsToOrganization(organizationId) { /* ... */ }
  function findOrganizationById(organizationId) { /* ... */ }
  function clearCachesAndReload() { /* ... */ }
  
  // ...
})
```

### Auth Store Integration

The Auth Store has been updated to initialize organization data during login and token refresh:

```javascript
// During login or refresh
if (response.data.organization) {
  organizationStore.setCurrentOrganization(response.data.organization)
}

if (response.data.organizations) {
  organizationStore.setUserOrganizations(response.data.organizations)
}

// Update stored user data with organization info
localStorage.setItem('auth', JSON.stringify({ 
  user: user.value,
  currentOrgId: user.value.current_organization_id
}))
```

## 4. Caching Strategy

The caching system is organization-aware, ensuring data is properly isolated:

### Cache Keys

Cache keys include both user ID and organization ID:

```javascript
export function generateCacheKey(collectionName, operation, id = null, params = null, userId = null) {
  // Get user ID and org ID for cache segmentation
  const { userId: currentUserId, orgId: currentOrgId } = getCurrentUserAndOrgId();
  const userScope = userId || currentUserId || 'anonymous';
  
  const parts = [userScope, currentOrgId, collectionName, operation];
  // ...
}
```

### Organization Context Retrieval

The current organization ID is retrieved from localStorage:

```javascript
function getCurrentUserAndOrgId() {
  try {
    const authData = JSON.parse(localStorage.getItem('auth') || '{"user":null, "currentOrgId":null}');
    return {
      userId: authData.user?.id || 'anonymous',
      orgId: authData.currentOrgId || 'default'
    };
  } catch (error) {
    // Fallback...
  }
}
```

## 5. UI Components

### Organization Selector

The `OrganizationSelector.vue` component allows users to view and switch between their organizations:

```vue
<template>
  <div class="relative">
    <!-- Current Organization Button -->
    <button @click="toggleDropdown">
      {{ currentOrganization.name }}
    </button>
    
    <!-- Organization Dropdown -->
    <div v-if="isOpen">
      <!-- Organization List -->
      <button
        v-for="org in filteredOrganizations"
        :key="org.id"
        @click="selectOrganization(org)"
      >
        {{ org.name }}
      </button>
    </div>
  </div>
</template>
```

### Profile Integration

The Profile view includes an organization management section:

```vue
<div class="card">
  <h2>Organizations</h2>
  
  <div class="mb-4">
    <h3>Current Organization</h3>
    <div>{{ currentOrganization.name }}</div>
  </div>
  
  <h3>Your Organizations</h3>
  <div class="grid">
    <div
      v-for="org in userOrganizations"
      :key="org.id"
      @click="switchToOrganization(org)"
    >
      {{ org.name }}
    </div>
  </div>
</div>
```

## 6. Access Control

### PocketBase API Rules

PocketBase API rules enforce organization-based access control:

#### List and View Rules

```
// User must be authenticated
@request.auth.id != "" && 
// User must belong to the organization that owns this record
@request.auth.organizations.id ?= organization_id && 
// User must have this as their current organization
@request.auth.current_organization_id = organization_id
```

#### Create Rules

```
// User must be authenticated
@request.auth.id != "" && 
// User must belong to the organization they're assigning
@request.auth.organizations.id ?= @request.body.organization_id && 
// Ensure they can only create for their current organization
@request.body.organization_id = @request.auth.current_organization_id
```

#### Update Rules

```
// User must be authenticated
@request.auth.id != "" && 
// User must belong to the organization that owns this record
@request.auth.organizations.id ?= organization_id && 
// User must have this as their current organization
@request.auth.current_organization_id = organization_id && 
// Prevent changing the organization_id
(@request.body.organization_id:isset = false || @request.body.organization_id = organization_id)
```

## Organization Switching Process

When a user switches organizations:

1. The `organizationService.setCurrentOrganization(organizationId)` method is called
2. This updates the user's `current_organization_id` field via the user service
3. The auth store refreshes the user data with `refreshUserData()`
4. The organization store is updated with the new current organization
5. Any subsequent API calls automatically use the new organization context

## Data Flow Example

1. User logs in
   - Auth store sets up initial organization context
   - Organization store is initialized with current and available organizations

2. User creates an entity
   - BaseService automatically adds the current organization_id
   - Entity is created with organization association

3. User browses entities
   - PocketBase API rules filter results to current organization
   - Cache keys include organization ID for proper isolation

4. User switches organization
   - User record is updated with new current_organization_id
   - Auth data in localStorage is updated
   - Subsequent API calls use the new organization context

## Best Practices

### Creating New Entities

When creating entities, the BaseService will automatically associate them with the current organization. No manual assignment of `organization_id` is needed:

```javascript
// Create a new edge
await edgeService.create({
  name: 'New Edge',
  type: 'gateway',
  // No organization_id needed - BaseService handles this
});
```

### Switching Organizations

To switch organizations, use the organization service:

```javascript
// In a component
const { switchOrganization } = useOrganization();

// Switch to a different organization
await switchOrganization(organizationId);
```

### Organization-Aware Components

When building UI components, use the organization store to access organization context:

```javascript
// In a component
const organizationStore = useOrganizationStore();
const currentOrg = computed(() => organizationStore.currentOrganization);

// Display organization-specific UI elements
<div>Current Organization: {{ currentOrg.name }}</div>
```

### Working with Organization Roles

Check user roles within an organization:

```javascript
// In a component
const { getUserRole } = useOrganization();
const userRole = getUserRole(organizationId, user);

// Conditionally show admin-only features
<div v-if="userRole === 'admin'">Admin Settings</div>
```

## Conclusion

The multi-organization implementation provides complete isolation of data between organizations while allowing users to belong to and switch between multiple organizations. The architecture ensures:

1. **Data Isolation**: Each organization's data is completely isolated
2. **Role-Based Access**: Users can have different roles in different organizations
3. **Seamless Switching**: Users can easily switch between organizations
4. **Consistent Caching**: The caching system maintains organization boundaries
5. **Automatic Context**: The BaseService automatically handles organization context

This implementation provides a solid foundation for expanding the multi-organization features and ensures data integrity and security across all entity types.
