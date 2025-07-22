# UserService API Documentation

## Overview

The `UserService` manages user profiles, authentication data, avatar uploads, and organization membership. It provides methods for updating user information, changing passwords, and managing user avatars with proper file handling.

## Collection Schema

- **Collection:** `users`
- **JSON Fields:** `org_roles`
- **Expand Fields:** `current_organization_id`, `organizations`

**Schema Fields:**
- `id`: Unique identifier (auto-generated)
- `email`: User's email address (used as username)
- `first_name`: User's first name
- `last_name`: User's last name
- `avatar`: User's profile picture (file)
- `verified`: Whether the email is verified
- `organizations`: Relation to organizations (multiple)
- `org_roles`: JSON mapping organization IDs to roles (admin or member)
- `current_organization_id`: Relation to current organization (single)
- `is_org_admin`: Boolean flag for users who can create/manage organizations globally
- `created`: Creation timestamp (auto-generated)
- `updated`: Update timestamp (auto-generated)

## Constructor

```javascript
new UserService()
```

No parameters required. Uses predefined configuration.

## Methods

### getCurrentUser()

Retrieves current user profile with expanded organization data using auth refresh endpoint.

**Returns:** `Promise<Object>`

```javascript
{
  data: {
    id: string,
    email: string,
    first_name: string,
    last_name: string,
    avatar: string,
    verified: boolean,
    org_roles: Object,
    current_organization_id: string,
    organizations: Array,
    organization: Object, // Current organization from expand
    // ... other fields
  }
}
```

**Usage:**
```javascript
const response = await userService.getCurrentUser()
const user = response.data

console.log('Current user:', user.email)
console.log('Current organization:', user.organization?.name)
console.log('All organizations:', user.organizations)
```

**Features:**
- Automatically parses `org_roles` from JSON string
- Expands current organization and all organizations
- Uses POST method with auth token for security
- Handles authentication errors gracefully

### updateProfile(id, userData)

Updates user profile using BaseService pattern.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | User ID |
| `userData` | `Object` | Yes | Updated user data |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await userService.updateProfile('user-id-123', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com'
})
```

### update(id, userData)

Standard update method for user entity (calls parent BaseService.update).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | User ID |
| `userData` | `Object` | Yes | Updated user data |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await userService.update('user-id-123', {
  current_organization_id: 'new-org-id'
})
```

### changePassword(id, passwordData)

Changes user password using proper endpoint construction.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | User ID |
| `passwordData` | `Object` | Yes | Password change data |

**Required Password Data:**
- `oldPassword`: Current password
- `password`: New password
- `passwordConfirm`: New password confirmation

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await userService.changePassword('user-id-123', {
  oldPassword: 'currentPassword',
  password: 'newSecurePassword',
  passwordConfirm: 'newSecurePassword'
})
```

### uploadAvatar(id, formData)

Uploads user avatar file.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | User ID |
| `formData` | `FormData` | Yes | FormData containing avatar file |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const formData = new FormData()
formData.append('avatar', fileInput.files[0])

const response = await userService.uploadAvatar('user-id-123', formData)
const updatedUser = response.data
```

**File Requirements:**
- Supported formats: JPG, PNG, GIF, WebP
- Maximum file size depends on server configuration
- Files are automatically processed by PocketBase

### getAvatarUrl(user)

Gets user avatar URL using ConfigService.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | `Object` | Yes | User object with avatar field |

**Returns:** `string|null` - Avatar URL or null if no avatar

**Usage:**
```javascript
const avatarUrl = userService.getAvatarUrl(user)
if (avatarUrl) {
  // Display avatar
  avatarImg.src = avatarUrl
} else {
  // Show default avatar
  showDefaultAvatar()
}
```

### getAvatarThumbnailUrl(user, size)

Gets user avatar thumbnail URL.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `user` | `Object` | Yes | - | User object with avatar field |
| `size` | `string` | No | `'100x100'` | Thumbnail size |

**Returns:** `string|null` - Thumbnail URL or null

**Usage:**
```javascript
// Standard thumbnail
const thumbUrl = userService.getAvatarThumbnailUrl(user)

// Custom size thumbnail
const largeThumbUrl = userService.getAvatarThumbnailUrl(user, '200x200')

// Profile picture sizes
const profilePicUrl = userService.getAvatarThumbnailUrl(user, '150x150')
```

## Usage Examples

### Get Current User Profile

```javascript
try {
  const response = await userService.getCurrentUser()
  const user = response.data
  
  console.log('User:', user.first_name, user.last_name)
  console.log('Email:', user.email)
  console.log('Current Org:', user.organization?.name)
  console.log('All Orgs:', user.organizations.map(org => org.name))
  
  // Check organization roles
  if (user.org_roles) {
    Object.entries(user.org_roles).forEach(([orgId, role]) => {
      console.log(`Role in ${orgId}: ${role}`)
    })
  }
} catch (error) {
  if (error.response?.status === 401) {
    console.log('User not authenticated')
    // Redirect to login
  } else {
    console.error('Failed to get user profile:', error)
  }
}
```

### Update User Profile

```javascript
// Update basic profile information
await userService.updateProfile('user-id-123', {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@newcompany.com'
})

// Update organization membership
await userService.update('user-id-123', {
  current_organization_id: 'new-org-id',
  org_roles: JSON.stringify({
    'org-1': 'member',
    'org-2': 'admin',
    'new-org-id': 'member'
  })
})
```

### Change Password

```javascript
try {
  await userService.changePassword('user-id-123', {
    oldPassword: 'currentPassword123',
    password: 'newSecurePassword456',
    passwordConfirm: 'newSecurePassword456'
  })
  
  console.log('Password changed successfully')
} catch (error) {
  if (error.response?.status === 400) {
    console.error('Invalid password data')
  } else {
    console.error('Failed to change password:', error)
  }
}
```

### Upload and Display Avatar

```javascript
// Upload avatar
const handleAvatarUpload = async (fileInput, userId) => {
  if (!fileInput.files[0]) return
  
  const formData = new FormData()
  formData.append('avatar', fileInput.files[0])
  
  try {
    const response = await userService.uploadAvatar(userId, formData)
    const updatedUser = response.data
    
    // Update UI with new avatar
    const avatarUrl = userService.getAvatarThumbnailUrl(updatedUser, '150x150')
    document.getElementById('avatar-img').src = avatarUrl
    
    console.log('Avatar uploaded successfully')
  } catch (error) {
    console.error('Avatar upload failed:', error)
  }
}

// Display existing avatar
const displayUserAvatar = (user) => {
  const avatarUrl = userService.getAvatarThumbnailUrl(user, '100x100')
  
  if (avatarUrl) {
    return `<img src="${avatarUrl}" alt="User Avatar" class="rounded-full" />`
  } else {
    return `<div class="default-avatar">${user.first_name?.[0]}${user.last_name?.[0]}</div>`
  }
}
```

### Organization Role Management

```javascript
// Check user's role in current organization
const getCurrentOrgRole = (user) => {
  if (!user.current_organization_id || !user.org_roles) {
    return null
  }
  
  return user.org_roles[user.current_organization_id] || null
}

// Check if user is admin in any organization
const isOrgAdmin = (user) => {
  if (!user.org_roles) return false
  
  return Object.values(user.org_roles).includes('admin')
}

// Get organizations where user is admin
const getAdminOrganizations = (user) => {
  if (!user.org_roles || !user.organizations) return []
  
  return user.organizations.filter(org => 
    user.org_roles[org.id] === 'admin'
  )
}

// Usage
const user = await userService.getCurrentUser()
const currentRole = getCurrentOrgRole(user.data)
const adminOrgs = getAdminOrganizations(user.data)

console.log('Current role:', currentRole)
console.log('Admin in:', adminOrgs.map(org => org.name))
```

### Profile Validation

```javascript
// Validate profile data before update
const validateProfileData = (userData) => {
  const errors = []
  
  if (userData.email && !isValidEmail(userData.email)) {
    errors.push('Invalid email format')
  }
  
  if (userData.first_name && userData.first_name.length < 2) {
    errors.push('First name must be at least 2 characters')
  }
  
  if (userData.last_name && userData.last_name.length < 2) {
    errors.push('Last name must be at least 2 characters')
  }
  
  return errors
}

// Update with validation
const updateUserProfile = async (userId, userData) => {
  const errors = validateProfileData(userData)
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`)
  }
  
  return await userService.updateProfile(userId, userData)
}
```

### Avatar Management

```javascript
// Remove user avatar
const removeAvatar = async (userId) => {
  await userService.update(userId, { avatar: null })
}

// Get avatar with fallback
const getAvatarWithFallback = (user, size = '100x100') => {
  const avatarUrl = userService.getAvatarThumbnailUrl(user, size)
  
  if (avatarUrl) {
    return avatarUrl
  }
  
  // Generate initials-based avatar URL or return default
  return generateInitialsAvatar(user.first_name, user.last_name)
}

// Validate avatar file before upload
const validateAvatarFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please use JPG, PNG, GIF, or WebP.')
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.')
  }
  
  return true
}
```

## Error Handling

```javascript
// Comprehensive error handling for user operations
const handleUserOperation = async (operation) => {
  try {
    return await operation()
  } catch (error) {
    switch (error.response?.status) {
      case 400:
        console.error('Invalid user data:', error.response.data)
        break
      case 401:
        console.error('Authentication required')
        // Redirect to login
        break
      case 403:
        console.error('Access denied')
        break
      case 404:
        console.error('User not found')
        break
      case 413:
        console.error('File too large')
        break
      default:
        console.error('User operation failed:', error.message)
    }
    throw error
  }
}

// Usage with error handling
try {
  await handleUserOperation(() => 
    userService.updateProfile('user-id', profileData)
  )
} catch (error) {
  // Handle error appropriately in UI
}
```

## Security Considerations

1. **Authentication Required**: All operations require valid authentication token
2. **Password Validation**: Password changes require current password verification
3. **File Upload Security**: Avatar uploads are validated and processed by PocketBase
4. **Organization Context**: Users can only access data within their organizations
5. **Role Validation**: Organization roles are validated server-side

## Integration with Auth Store

The UserService integrates with the authentication store:

```javascript
// Update auth store after profile changes
const updateProfileAndAuth = async (userId, userData) => {
  const response = await userService.updateProfile(userId, userData)
  
  // Update auth store with new user data
  const authStore = useAuthStore()
  authStore.updateUser(response.data)
  
  return response
}
```
