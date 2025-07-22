# OrganizationService API Documentation

## Overview

The `OrganizationService` manages organizations and organization membership in the IoT Platform. It handles organization CRUD operations, user membership management, role assignments, and logo uploads. This service is central to the multi-organization architecture.

## Collection Schema

- **Collection:** `organizations`
- **JSON Fields:** `settings`
- **Expand Fields:** None

**Schema Fields:**
- `id`: Unique identifier (auto-generated)
- `name`: Organization display name
- `code`: Unique organization code (short identifier)
- `description`: Organization description
- `logo`: Organization logo file
- `settings`: JSON object for organization-specific settings
- `created`: Creation timestamp (auto-generated)
- `updated`: Update timestamp (auto-generated)

## Constructor

```javascript
new OrganizationService()
```

No parameters required. Uses predefined configuration.

## Methods

### Inherited from BaseService

All standard CRUD operations are available:
- `getList(params)` - Get paginated organization list
- `getById(id)` - Get single organization
- `create(organization)` - Create new organization
- `update(id, organization)` - Update existing organization
- `delete(id)` - Delete organization

### getUserOrganizations(params)

Retrieves organizations for the current user with expanded fields.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Object>`

```javascript
{
  data: {
    items: Array, // Organizations with role data
    // ... pagination info
  }
}
```

**Usage:**
```javascript
const userOrgs = await organizationService.getUserOrganizations({
  sort: 'name'
})

console.log(`User belongs to ${userOrgs.data.items.length} organizations`)
```

### setCurrentOrganization(organizationId)

Sets current organization for the user by updating user record.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID to set as current |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
// Switch to different organization
await organizationService.setCurrentOrganization('new-org-id')

// This updates the user's current_organization_id field
// UI should refresh to show new organization context
```

**Process:**
1. Gets current user ID from localStorage
2. Updates user record with new `current_organization_id`
3. Returns updated user data

### getByCode(code)

Retrieves organization by its unique code.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Organization code |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
try {
  const response = await organizationService.getByCode('acme')
  const organization = response.data
  console.log('Found organization:', organization.name)
} catch (error) {
  console.error('Organization not found')
}
```

### getUserRole(organizationId, user)

Gets user's role in a specific organization.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID |
| `user` | `Object` | Yes | User object with org_roles |

**Returns:** `string|null` - Role ('admin', 'member', or null)

**Usage:**
```javascript
const user = await userService.getCurrentUser()
const role = organizationService.getUserRole('org-id-123', user.data)

if (role === 'admin') {
  console.log('User is admin')
} else if (role === 'member') {
  console.log('User is member')
} else {
  console.log('User not in organization')
}
```

### addUserToOrganization(organizationId, userId, role)

Adds a user to an organization with specified role.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organizationId` | `string` | Yes | - | Organization ID |
| `userId` | `string` | Yes | - | User ID |
| `role` | `string` | No | `'member'` | Role ('admin' or 'member') |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
// Add user as member
await organizationService.addUserToOrganization(
  'org-id-123',
  'user-id-456',
  'member'
)

// Add user as admin
await organizationService.addUserToOrganization(
  'org-id-123',
  'user-id-789',
  'admin'
)
```

### removeUserFromOrganization(organizationId, userId)

Removes a user from an organization.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID |
| `userId` | `string` | Yes | User ID |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await organizationService.removeUserFromOrganization('org-id-123', 'user-id-456')
console.log('User removed from organization')
```

### updateUserRole(organizationId, userId, role)

Updates a user's role in an organization.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID |
| `userId` | `string` | Yes | User ID |
| `role` | `string` | Yes | New role ('admin' or 'member') |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
// Promote user to admin
await organizationService.updateUserRole('org-id-123', 'user-id-456', 'admin')

// Demote user to member
await organizationService.updateUserRole('org-id-123', 'user-id-456', 'member')
```

### getOrganizationMembers(organizationId, params)

Retrieves members of an organization.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID |
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const members = await organizationService.getOrganizationMembers('org-id-123', {
  sort: 'name'
})

console.log(`Organization has ${members.data.items.length} members`)
```

### getOrganizationStats(organizationId)

Retrieves statistics for an organization.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID |

**Returns:** `Promise<Object>`

```javascript
{
  data: {
    memberCount: number,
    edgeCount: number,
    locationCount: number,
    thingCount: number,
    // ... other stats
  }
}
```

**Usage:**
```javascript
const stats = await organizationService.getOrganizationStats('org-id-123')
console.log('Organization stats:', stats.data)
```

### uploadLogo(organizationId, formData)

Uploads organization logo.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID |
| `formData` | `FormData` | Yes | FormData containing logo file |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const formData = new FormData()
formData.append('logo', fileInput.files[0])

const response = await organizationService.uploadLogo('org-id-123', formData)
const updatedOrg = response.data
```

### getLogoUrl(organization)

Gets organization logo URL using ConfigService.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organization` | `Object` | Yes | Organization object with logo field |

**Returns:** `string|null` - Logo URL or null

**Usage:**
```javascript
const logoUrl = organizationService.getLogoUrl(organization)
if (logoUrl) {
  logoImg.src = logoUrl
} else {
  showDefaultLogo()
}
```

### getLogoThumbnailUrl(organization, size)

Gets organization logo thumbnail URL.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organization` | `Object` | Yes | - | Organization object with logo field |
| `size` | `string` | No | `'100x100'` | Thumbnail size |

**Returns:** `string|null` - Thumbnail URL or null

**Usage:**
```javascript
const thumbUrl = organizationService.getLogoThumbnailUrl(organization, '150x150')
```

### deriveOrganizationCode(name)

Derives an organization code from a name.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Organization name |

**Returns:** `string` - Derived organization code

**Usage:**
```javascript
const code = organizationService.deriveOrganizationCode('Acme Corporation')
// Returns: 'acme'

const code2 = organizationService.deriveOrganizationCode('Global Tech Solutions')
// Returns: 'glob'
```

**Process:**
- Removes non-alphanumeric characters
- Converts to lowercase
- Takes first 4 characters
- Ensures minimum 2 characters

### getCurrentOrganizationCode()

Gets the current organization code from the current user's organization.

**Returns:** `Promise<string>` - Current organization code or 'org'

**Usage:**
```javascript
const currentOrgCode = await organizationService.getCurrentOrganizationCode()
console.log('Current org code:', currentOrgCode)
```

## Usage Examples

### Create New Organization

```javascript
const newOrganization = {
  name: 'Acme Corporation',
  code: 'acme',
  description: 'Leading provider of IoT solutions',
  settings: {
    timezone: 'America/New_York',
    locale: 'en-US',
    features: {
      dashboard: true,
      analytics: true,
      alerts: true
    }
  }
}

const response = await organizationService.create(newOrganization)
const organization = response.data
```

### Manage Organization Membership

```javascript
const organizationId = 'org-id-123'

// Add multiple users to organization
const usersToAdd = [
  { userId: 'user-1', role: 'admin' },
  { userId: 'user-2', role: 'member' },
  { userId: 'user-3', role: 'member' }
]

for (const { userId, role } of usersToAdd) {
  await organizationService.addUserToOrganization(organizationId, userId, role)
}

// Get all members
const members = await organizationService.getOrganizationMembers(organizationId)
console.log(`Added ${usersToAdd.length} users, total: ${members.data.items.length}`)
```

### Switch Organizations

```javascript
// Get user's organizations
const userOrgs = await organizationService.getUserOrganizations()

// Display organization picker
const orgOptions = userOrgs.data.items.map(org => ({
  label: org.name,
  value: org.id
}))

// Switch to selected organization
const handleOrgSwitch = async (selectedOrgId) => {
  try {
    await organizationService.setCurrentOrganization(selectedOrgId)
    
    // Refresh page or update UI context
    window.location.reload()
    
    console.log('Switched organization successfully')
  } catch (error) {
    console.error('Failed to switch organization:', error)
  }
}
```

### Upload and Display Logo

```javascript
// Upload logo
const handleLogoUpload = async (fileInput, organizationId) => {
  if (!fileInput.files[0]) return
  
  const formData = new FormData()
  formData.append('logo', fileInput.files[0])
  
  try {
    const response = await organizationService.uploadLogo(organizationId, formData)
    const updatedOrg = response.data
    
    // Update UI with new logo
    const logoUrl = organizationService.getLogoThumbnailUrl(updatedOrg, '200x100')
    document.getElementById('org-logo').src = logoUrl
    
    console.log('Logo uploaded successfully')
  } catch (error) {
    console.error('Logo upload failed:', error)
  }
}

// Display logo with fallback
const displayOrgLogo = (organization) => {
  const logoUrl = organizationService.getLogoThumbnailUrl(organization, '150x75')
  
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="${organization.name} Logo" />`
  } else {
    return `<div class="default-logo">${organization.code.toUpperCase()}</div>`
  }
}
```

### Organization Administration

```javascript
// Check if user can admin organization
const canAdminOrganization = (user, organizationId) => {
  const role = organizationService.getUserRole(organizationId, user)
  return role === 'admin' || user.is_org_admin
}

// Get organization dashboard data
const getOrganizationDashboard = async (organizationId) => {
  const [stats, members] = await Promise.all([
    organizationService.getOrganizationStats(organizationId),
    organizationService.getOrganizationMembers(organizationId)
  ])
  
  return {
    stats: stats.data,
    memberCount: members.data.items.length,
    adminCount: members.data.items.filter(member => 
      member.role === 'admin'
    ).length
  }
}

// Usage
const dashboard = await getOrganizationDashboard('org-id-123')
console.log('Dashboard data:', dashboard)
```

### Role Management

```javascript
// Promote user to admin with validation
const promoteToAdmin = async (organizationId, userId, currentUser) => {
  // Check if current user can promote others
  const currentUserRole = organizationService.getUserRole(organizationId, currentUser)
  
  if (currentUserRole !== 'admin' && !currentUser.is_org_admin) {
    throw new Error('Insufficient permissions to promote users')
  }
  
  await organizationService.updateUserRole(organizationId, userId, 'admin')
  console.log('User promoted to admin')
}

// Bulk role updates
const updateMemberRoles = async (organizationId, roleUpdates) => {
  // roleUpdates: [{ userId, newRole }, ...]
  
  for (const { userId, newRole } of roleUpdates) {
    try {
      await organizationService.updateUserRole(organizationId, userId, newRole)
    } catch (error) {
      console.error(`Failed to update role for user ${userId}:`, error)
    }
  }
}
```

### Organization Switching with Context Update

```javascript
// Complete organization switch with cache clearing
const switchOrganizationWithCleanup = async (newOrgId) => {
  try {
    // Switch organization
    await organizationService.setCurrentOrganization(newOrgId)
    
    // Clear all caches to ensure fresh data
    const { useCacheStore } = await import('../stores/cacheStore')
    const cacheStore = useCacheStore()
    cacheStore.resetAll()
    
    // Update localStorage auth data
    const authData = JSON.parse(localStorage.getItem('auth') || '{}')
    authData.currentOrgId = newOrgId
    localStorage.setItem('auth', JSON.stringify(authData))
    
    // Refresh user data
    const updatedUser = await userService.getCurrentUser()
    
    // Update organization store
    const { useOrganizationStore } = await import('../stores/organization')
    const orgStore = useOrganizationStore()
    orgStore.setCurrentOrganization(updatedUser.data.organization)
    
    console.log('Organization switch completed')
    
    return true
  } catch (error) {
    console.error('Organization switch failed:', error)
    return false
  }
}
```

## Error Handling

```javascript
// Comprehensive error handling for organization operations
const handleOrgOperation = async (operation, context = '') => {
  try {
    return await operation()
  } catch (error) {
    switch (error.response?.status) {
      case 400:
        console.error(`Invalid organization data${context}:`, error.response.data)
        break
      case 401:
        console.error('Authentication required for organization operation')
        break
      case 403:
        console.error(`Access denied for organization operation${context}`)
        break
      case 404:
        console.error(`Organization not found${context}`)
        break
      case 409:
        console.error(`Organization conflict${context} (duplicate code?)`)
        break
      default:
        console.error(`Organization operation failed${context}:`, error.message)
    }
    throw error
  }
}

// Usage
try {
  await handleOrgOperation(
    () => organizationService.addUserToOrganization(orgId, userId, 'admin'),
    ' when adding user'
  )
} catch (error) {
  // Handle in UI
}
```

## Integration with Multi-Organization Architecture

The OrganizationService is central to the platform's multi-organization support:

```javascript
// Organization context in other services
const createEntityInCurrentOrg = async (entityData) => {
  // BaseService automatically adds organization_id
  const response = await someEntityService.create(entityData)
  return response
}

// Organization-scoped data queries
const getOrganizationEntities = async () => {
  // API rules automatically filter by current organization
  const edges = await edgeService.getList()
  const locations = await locationService.getList()
  const things = await thingService.getList()
  
  return { edges, locations, things }
}
```

## Security Considerations

1. **Role Validation**: Server-side validation of user roles and permissions
2. **Organization Isolation**: Data automatically scoped to organizations
3. **Access Control**: Users can only access organizations they belong to
4. **Admin Permissions**: Global org admins have elevated privileges
5. **Secure Switching**: Organization switching validates membership
