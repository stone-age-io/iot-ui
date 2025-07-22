# useOrganization

## Overview

The `useOrganization` composable manages organization entities and provides organization context switching functionality. It handles multi-tenant operations, user organization memberships, and automatic context management throughout the application.

## Location

```
src/composables/useOrganization.js
```

## Purpose

- **Organization Entity Management**: CRUD operations for organization entities
- **Context Switching**: Seamless switching between user organizations
- **Multi-tenant Support**: Automatic organization scoping for all operations
- **Membership Management**: User-organization relationship handling
- **Cache Management**: Automatic cache clearing on organization switches
- **Permission Integration**: Organization-based permission checking
- **Navigation Context**: Organization-aware navigation

## Dependencies

```javascript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { organizationService } from '@/services'
import { useApiOperation } from '@/composables/useApiOperation'
import { useOrganizationStore } from '@/stores/organization'
import { useCacheStore } from '@/stores/cacheStore'
import { useAuthStore } from '@/stores/auth'
```

## Returns

```javascript
{
  // State
  organizations: ComputedRef<Array>,
  currentOrganization: ComputedRef<Object>,
  userMemberships: ComputedRef<Array>,
  loading: Ref<boolean>,
  error: Ref<string|null>,
  
  // Operations
  fetchOrganizations: Function,
  fetchOrganization: Function,
  createOrganization: Function,
  updateOrganization: Function,
  deleteOrganization: Function,
  switchOrganization: Function,
  
  // Membership operations
  inviteUser: Function,
  removeUser: Function,
  updateUserRole: Function,
  
  // Helpers
  isCurrentOrganization: Function,
  canSwitchOrganization: Function,
  getUserRole: Function,
  hasPermission: Function,
  formatDate: Function
}
```

---

## State Properties

### organizations

Reactive computed reference to organizations the current user has access to.

**Type:** `ComputedRef<Array>`

**Description:** Returns list of organizations based on user memberships.

### currentOrganization

Reactive computed reference to the currently active organization.

**Type:** `ComputedRef<Object>`

**Example Data:**

```javascript
{
  id: "org-123",
  name: "Acme Corporation",
  slug: "acme-corp",
  description: "Leading IoT solutions provider",
  settings: {
    timezone: "America/New_York",
    date_format: "MM/DD/YYYY",
    currency: "USD"
  },
  plan: "enterprise",
  created: "2024-01-15T10:00:00Z"
}
```

### userMemberships

Reactive computed reference to current user's organization memberships.

**Type:** `ComputedRef<Array>`

**Example Data:**

```javascript
[
  {
    id: "membership-1",
    organization_id: "org-123",
    user_id: "user-456",
    role: "admin",
    status: "active",
    joined_at: "2024-01-15T10:00:00Z"
  }
]
```

### loading

Reactive reference to loading state for organization operations.

**Type:** `Ref<boolean>`

### error

Reactive reference to error state for organization operations.

**Type:** `Ref<string|null>`

---

## Operation Methods

### fetchOrganizations(params)

Fetches organizations accessible to the current user.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Array>` - List of organizations

**Usage:**

```javascript
const { fetchOrganizations } = useOrganization()

await fetchOrganizations()
```

### fetchOrganization(id)

Fetches a single organization by ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Organization ID |

**Returns:** `Promise<Object>` - Organization data

### createOrganization(organizationData)

Creates a new organization and automatically adds the current user as an admin.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationData` | `Object` | Yes | Organization data |

**Required Fields:**
- `name`: Organization name
- `slug`: Unique organization slug

**Optional Fields:**
- `description`: Organization description
- `settings`: Organization settings object
- `plan`: Subscription plan

**Returns:** `Promise<Object>` - Created organization

**Usage:**

```javascript
const { createOrganization } = useOrganization()

const newOrg = await createOrganization({
  name: "New Company Inc",
  slug: "new-company", 
  description: "A new IoT company",
  settings: {
    timezone: "UTC",
    date_format: "YYYY-MM-DD"
  },
  plan: "starter"
})
```

### updateOrganization(id, organizationData)

Updates an existing organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Organization ID |
| `organizationData` | `Object` | Yes | Organization data to update |

**Returns:** `Promise<Object>` - Updated organization

### deleteOrganization(id)

Deletes an organization (admin only).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Organization ID |

**Returns:** `Promise<boolean>` - Success status

### switchOrganization(organizationId)

Switches the current user's active organization context.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Target organization ID |

**Returns:** `Promise<Object>` - New current organization

**Side Effects:**
- Clears all cached data
- Updates organization store
- Triggers application-wide context refresh
- Updates user preferences

**Usage:**

```javascript
const { switchOrganization } = useOrganization()

const handleOrgSwitch = async (orgId) => {
  await switchOrganization(orgId)
  // Application automatically refreshes with new context
}
```

---

## Membership Operations

### inviteUser(email, role, organizationId)

Invites a user to join an organization.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `email` | `string` | Yes | - | User email address |
| `role` | `string` | Yes | - | Role to assign |
| `organizationId` | `string` | No | Current org | Organization ID |

**Valid Roles:**
- `admin`: Full administrative access
- `manager`: Management access with some restrictions
- `user`: Standard user access
- `viewer`: Read-only access

**Returns:** `Promise<Object>` - Invitation data

**Usage:**

```javascript
const { inviteUser } = useOrganization()

await inviteUser('newuser@example.com', 'user')
```

### removeUser(userId, organizationId)

Removes a user from an organization.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | `string` | Yes | - | User ID |
| `organizationId` | `string` | No | Current org | Organization ID |

**Returns:** `Promise<boolean>` - Success status

### updateUserRole(userId, newRole, organizationId)

Updates a user's role within an organization.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | `string` | Yes | - | User ID |
| `newRole` | `string` | Yes | - | New role |
| `organizationId` | `string` | No | Current org | Organization ID |

**Returns:** `Promise<Object>` - Updated membership

---

## Helper Methods

### isCurrentOrganization(orgId)

Checks if the given organization ID is the currently active organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orgId` | `string` | Yes | Organization ID to check |

**Returns:** `boolean` - True if current organization

### canSwitchOrganization(orgId)

Checks if the user can switch to the specified organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orgId` | `string` | Yes | Organization ID |

**Returns:** `boolean` - True if switch is allowed

### getUserRole(userId, organizationId)

Gets a user's role within an organization.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | `string` | Yes | - | User ID |
| `organizationId` | `string` | No | Current org | Organization ID |

**Returns:** `string|null` - User role or null if not a member

### hasPermission(permission, organizationId)

Checks if the current user has a specific permission within an organization.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `permission` | `string` | Yes | - | Permission to check |
| `organizationId` | `string` | No | Current org | Organization ID |

**Available Permissions:**
- `manage_users`: Can invite/remove users
- `manage_settings`: Can modify organization settings
- `manage_billing`: Can access billing information
- `delete_organization`: Can delete organization
- `view_audit_logs`: Can view audit logs

**Returns:** `boolean` - True if user has permission

### formatDate(dateString)

Formats date according to organization settings.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateString` | `string` | Yes | ISO date string |

**Returns:** `string` - Formatted date using organization preferences

---

## Usage Examples

### Organization Switcher Component

```vue
<template>
  <div class="organization-switcher">
    <!-- Current organization display -->
    <Dropdown
      v-model="selectedOrgId"
      :options="organizationOptions"
      optionLabel="name"
      optionValue="id"
      placeholder="Select Organization"
      @change="handleOrgChange"
      class="w-full"
    >
      <template #value="{ value }">
        <div v-if="value" class="flex items-center gap-2">
          <Avatar 
            :label="getOrgInitials(currentOrganization)"
            class="mr-2"
            size="small"
          />
          <div>
            <div class="font-medium">{{ currentOrganization.name }}</div>
            <div class="text-xs text-gray-500">{{ currentOrganization.plan }}</div>
          </div>
        </div>
      </template>
      
      <template #option="{ option }">
        <div class="flex items-center gap-2">
          <Avatar 
            :label="getOrgInitials(option)"
            size="small"
          />
          <div>
            <div class="font-medium">{{ option.name }}</div>
            <div class="text-xs text-gray-500">
              Role: {{ getUserRole(currentUser.id, option.id) }}
            </div>
          </div>
          <Badge 
            v-if="isCurrentOrganization(option.id)"
            value="Current"
            class="ml-auto"
          />
        </div>
      </template>
    </Dropdown>
    
    <!-- Quick actions -->
    <div class="flex gap-2 mt-2">
      <Button 
        label="Settings"
        icon="pi pi-cog"
        class="p-button-sm p-button-text"
        @click="navigateToOrgSettings"
        v-if="hasPermission('manage_settings')"
      />
      <Button 
        label="Users"
        icon="pi pi-users"
        class="p-button-sm p-button-text"
        @click="navigateToUserManagement"
        v-if="hasPermission('manage_users')"
      />
      <Button 
        label="New Org"
        icon="pi pi-plus"
        class="p-button-sm p-button-text"
        @click="showCreateDialog = true"
      />
    </div>
    
    <!-- Create organization dialog -->
    <Dialog 
      v-model:visible="showCreateDialog"
      header="Create Organization"
      :style="{ width: '450px' }"
    >
      <OrganizationForm 
        mode="create"
        @success="handleOrgCreated"
        @cancel="showCreateDialog = false"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOrganization } from '@/composables/useOrganization'
import { useAuthStore } from '@/stores/auth'

const { 
  organizations,
  currentOrganization,
  switchOrganization,
  isCurrentOrganization,
  getUserRole,
  hasPermission
} = useOrganization()

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

const selectedOrgId = ref(currentOrganization.value?.id)
const showCreateDialog = ref(false)

const organizationOptions = computed(() => organizations.value || [])

const getOrgInitials = (org) => {
  return org.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const handleOrgChange = async (event) => {
  if (event.value && event.value !== currentOrganization.value?.id) {
    await switchOrganization(event.value)
  }
}

const handleOrgCreated = (newOrg) => {
  showCreateDialog.value = false
  // New organization becomes current automatically
}

const navigateToOrgSettings = () => {
  // Navigate to organization settings
}

const navigateToUserManagement = () => {
  // Navigate to user management
}
</script>
```

### Organization Settings Panel

```vue
<template>
  <div class="organization-settings">
    <Card>
      <template #title>Organization Settings</template>
      <template #content>
        <form @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Basic information -->
            <div class="space-y-4">
              <h3 class="font-medium">Basic Information</h3>
              
              <div>
                <label class="block text-sm font-medium mb-2">Name</label>
                <InputText
                  v-model="form.name"
                  class="w-full"
                  :disabled="!hasPermission('manage_settings')"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Slug</label>
                <InputText
                  v-model="form.slug"
                  class="w-full"
                  :disabled="!hasPermission('manage_settings')"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full"
                  :disabled="!hasPermission('manage_settings')"
                />
              </div>
            </div>
            
            <!-- Preferences -->
            <div class="space-y-4">
              <h3 class="font-medium">Preferences</h3>
              
              <div>
                <label class="block text-sm font-medium mb-2">Timezone</label>
                <Dropdown
                  v-model="form.settings.timezone"
                  :options="timezoneOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                  :disabled="!hasPermission('manage_settings')"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Date Format</label>
                <Dropdown
                  v-model="form.settings.date_format"
                  :options="dateFormatOptions"
                  class="w-full"
                  :disabled="!hasPermission('manage_settings')"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Currency</label>
                <Dropdown
                  v-model="form.settings.currency"
                  :options="currencyOptions"
                  class="w-full"
                  :disabled="!hasPermission('manage_settings')"
                />
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex justify-between mt-6">
            <div>
              <Button 
                label="Save Changes"
                type="submit"
                :loading="loading"
                :disabled="!hasPermission('manage_settings')"
              />
            </div>
            
            <div v-if="hasPermission('delete_organization')">
              <Button 
                label="Delete Organization"
                class="p-button-danger p-button-outlined"
                @click="confirmDelete"
              />
            </div>
          </div>
        </form>
      </template>
    </Card>
    
    <!-- User management section -->
    <Card class="mt-6" v-if="hasPermission('manage_users')">
      <template #title>
        <div class="flex justify-between items-center">
          <span>Organization Members</span>
          <Button 
            label="Invite User"
            icon="pi pi-plus"
            @click="showInviteDialog = true"
          />
        </div>
      </template>
      <template #content>
        <DataTable :value="orgMembers" class="p-datatable-striped">
          <Column field="user.name" header="Name" />
          <Column field="user.email" header="Email" />
          <Column field="role" header="Role">
            <template #body="{ data }">
              <Dropdown
                v-model="data.role"
                :options="roleOptions"
                @change="updateMemberRole(data)"
                :disabled="data.user.id === currentUser.id"
              />
            </template>
          </Column>
          <Column field="joined_at" header="Joined">
            <template #body="{ data }">
              {{ formatDate(data.joined_at) }}
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <Button 
                icon="pi pi-trash"
                class="p-button-sm p-button-danger p-button-text"
                @click="removeMember(data)"
                :disabled="data.user.id === currentUser.id"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    
    <!-- Invite user dialog -->
    <Dialog 
      v-model:visible="showInviteDialog"
      header="Invite User"
      :style="{ width: '400px' }"
    >
      <UserInviteForm 
        @success="handleUserInvited"
        @cancel="showInviteDialog = false"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOrganization } from '@/composables/useOrganization'

const { 
  currentOrganization,
  updateOrganization,
  inviteUser,
  removeUser,
  updateUserRole,
  hasPermission,
  formatDate,
  loading
} = useOrganization()

const form = ref({
  name: '',
  slug: '',
  description: '',
  settings: {
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    currency: 'USD'
  }
})

const showInviteDialog = ref(false)
const orgMembers = ref([])

// Options for dropdowns
const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York', value: 'America/New_York' },
  { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
  { label: 'Europe/London', value: 'Europe/London' }
]

const dateFormatOptions = [
  'YYYY-MM-DD',
  'MM/DD/YYYY', 
  'DD/MM/YYYY'
]

const currencyOptions = [
  'USD', 'EUR', 'GBP', 'CAD'
]

const roleOptions = [
  'admin', 'manager', 'user', 'viewer'
]

// Initialize form with current organization data
const initializeForm = () => {
  if (currentOrganization.value) {
    Object.assign(form.value, currentOrganization.value)
    Object.assign(form.value.settings, currentOrganization.value.settings || {})
  }
}

const handleSubmit = async () => {
  await updateOrganization(currentOrganization.value.id, form.value)
}

const updateMemberRole = async (member) => {
  await updateUserRole(member.user.id, member.role)
}

const removeMember = async (member) => {
  await removeUser(member.user.id)
  // Refresh members list
}

const handleUserInvited = () => {
  showInviteDialog.value = false
  // Refresh members list
}

onMounted(() => {
  initializeForm()
})
</script>
```

---

## Best Practices

### 1. Handle Organization Context Properly

```javascript
// ✅ Good - proper context switching
const { switchOrganization } = useOrganization()

const handleSwitch = async (orgId) => {
  await switchOrganization(orgId)
  // Cache is automatically cleared
  // UI automatically refreshes with new context
}

// ❌ Avoid - manual context management
const handleSwitch = (orgId) => {
  organizationStore.setCurrentOrganization(orgId)
  // Missing cache clearing and refresh
}
```

### 2. Check Permissions Before Actions

```javascript
// ✅ Good - permission-based UI
const { hasPermission } = useOrganization()

const canManageUsers = computed(() => hasPermission('manage_users'))
const canManageSettings = computed(() => hasPermission('manage_settings'))

// Use in templates
<Button 
  v-if="canManageUsers"
  label="Invite User"
  @click="inviteUser"
/>
```

### 3. Handle Multi-Organization Data

```javascript
// ✅ Good - organization-aware data fetching
const fetchData = async () => {
  // Data is automatically scoped to current organization
  const edges = await edgeService.getList()
  const locations = await locationService.getList()
}

// Organization change triggers automatic re-fetch
watch(currentOrganization, () => {
  fetchData()
})
```

### 4. Validate Organization Access

```javascript
// ✅ Good - validate before operations
const { canSwitchOrganization } = useOrganization()

const switchToOrg = async (orgId) => {
  if (!canSwitchOrganization(orgId)) {
    throw new Error('Access denied to organization')
  }
  
  await switchOrganization(orgId)
}
```

### 5. Handle Organization Settings

```javascript
// ✅ Good - use organization preferences
const { formatDate } = useOrganization()

// Dates formatted according to org settings
const displayDate = formatDate(dateString)

// Timezone-aware operations
const formatTimestamp = (timestamp) => {
  const tz = currentOrganization.value?.settings?.timezone || 'UTC'
  return dayjs(timestamp).tz(tz).format('YYYY-MM-DD HH:mm:ss')
}
```

The `useOrganization` composable provides comprehensive multi-tenant support with automatic context management, making it easy to build applications that seamlessly handle multiple organizations while maintaining proper data isolation and user permissions.
