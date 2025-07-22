# ClientService API Documentation

## Overview

The `ClientService` manages NATS messaging clients for the IoT Platform. It handles client authentication, password hashing, credential validation, and role-based access management for the NATS messaging system.

## Collection Schema

- **Collection:** `clients`
- **JSON Fields:** None
- **Expand Fields:** `role_id`

**Schema Fields:**
- `id`: Unique identifier (auto-generated)
- `username`: Authentication username for NATS
- `password`: Bcrypt hashed password for NATS authentication
- `role_id`: Relation to topic_permissions record (single)
- `active`: Boolean indicating if client is enabled

## Constructor

```javascript
new ClientService()
```

No parameters required. Uses predefined configuration.

## Methods

### Inherited from BaseService

All standard CRUD operations are available:
- `getList(params)` - Get paginated client list
- `getById(id)` - Get single client
- `create(client)` - Create new client (use createClient instead)
- `update(id, client)` - Update existing client
- `delete(id)` - Delete client

### hashPassword(password)

Hashes a password using bcrypt via external service.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `password` | `string` | Yes | Plain text password to hash |

**Returns:** `Promise<string>` - Bcrypt hashed password

**Usage:**
```javascript
const hashedPassword = await clientService.hashPassword('myPlainTextPassword')
console.log('Hashed:', hashedPassword)
```

**Throws:**
- Error if hash password service URL not configured
- Error if external service request fails
- Error if response format is invalid

### validateCredentials(username, password)

Validates client credentials by checking username existence and active status.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | Yes | Client username |
| `password` | `string` | Yes | Client password (plain text) |

**Returns:** `Promise<boolean>` - True if credentials are valid

**Usage:**
```javascript
const isValid = await clientService.validateCredentials('client_user', 'password123')
if (isValid) {
  console.log('Credentials are valid')
} else {
  console.log('Invalid credentials')
}
```

**Note:** This is a simplified validation. In production, implement proper password verification.

### getClientsByRole(roleId, params)

Retrieves clients by role/permission ID.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `roleId` | `string` | Yes | Role/permission ID |
| `params` | `Object` | No | Additional query parameters |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const roleClients = await clientService.getClientsByRole('role-id-123', {
  sort: 'username'
})
```

### getActiveClients(params)

Retrieves only active clients.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Additional query parameters |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const activeClients = await clientService.getActiveClients({
  sort: 'username'
})
```

### toggleActiveStatus(id, active)

Toggles client active status.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Client ID |
| `active` | `boolean` | Yes | New active status |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
// Deactivate client
await clientService.toggleActiveStatus('client-id-123', false)

// Activate client
await clientService.toggleActiveStatus('client-id-123', true)
```

### updatePassword(id, newPassword)

Updates client password with automatic hashing.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Client ID |
| `newPassword` | `string` | Yes | New plain text password |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await clientService.updatePassword('client-id-123', 'newSecurePassword123')
```

**Process:**
1. Hashes the new password using external service
2. Updates client record with hashed password
3. Returns updated client data

### createClient(clientData)

Creates a new client with automatic password hashing.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientData` | `Object` | Yes | Client data including plain text password |

**Required Fields:**
- `username`: Client username
- `password`: Plain text password
- `role_id`: Topic permission role ID

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const newClient = {
  username: 'device_sensor_001',
  password: 'securePassword123',
  role_id: 'role-id-123',
  active: true
}

const response = await clientService.createClient(newClient)
const createdClient = response.data
```

**Process:**
1. Validates that password is provided
2. Hashes the password using external service
3. Creates client with hashed password
4. Returns created client data

### transformParams(transformedParams, originalParams)

Transforms query parameters for client-specific filtering.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transformedParams` | `Object` | Yes | Parameters being transformed |
| `originalParams` | `Object` | Yes | Original input parameters |

**Supported Original Parameters:**
- `role_id`: Filter by role/permission ID
- `active`: Filter by active status

**Usage:**
```javascript
// Filter by role
await clientService.getList({ role_id: 'role-123' })

// Filter by active status
await clientService.getList({ active: true })

// Combine filters
await clientService.getList({ 
  role_id: 'role-123',
  active: true 
})
```

## Client Utilities

### generateClientUsername(clientType, name)

Generates a client username based on type and name.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientType` | `string` | Yes | Type of client |
| `name` | `string` | Yes | Descriptive name |

**Returns:** `string` - Generated username

**Client Types:**
- `device` → `dev_` prefix
- `service` → `svc_` prefix
- `user` → `usr_` prefix
- `integration` → `int_` prefix
- `system` → `sys_` prefix
- `default` → `client_` prefix

**Usage:**
```javascript
import { generateClientUsername } from '../services'

const username = generateClientUsername('device', 'Temperature Sensor')
// Returns: 'dev_temperature_sensor'

const username2 = generateClientUsername('service', 'Data Processor')
// Returns: 'svc_data_processor'
```

### generateSecurePassword(length)

Generates a random secure password.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `length` | `number` | No | `16` | Length of password |

**Returns:** `string` - Generated password

**Usage:**
```javascript
import { generateSecurePassword } from '../services'

const password = generateSecurePassword() // 16 characters
const longPassword = generateSecurePassword(32) // 32 characters
```

**Character Set:** Includes uppercase, lowercase, numbers, and special characters.

### validateClientUsername(username)

Validates client username format.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | Yes | Username to validate |

**Returns:** `boolean` - True if valid

**Rules:**
- 3-50 characters
- Alphanumeric and underscores only
- No spaces or special characters (except underscore)

**Usage:**
```javascript
import { validateClientUsername } from '../services'

const isValid = validateClientUsername('dev_sensor_001') // true
const isInvalid = validateClientUsername('invalid user!') // false
```

### Client Types

Pre-defined client types for dropdown usage:

```javascript
import { clientTypes } from '../services'

// Available types:
[
  { 
    label: 'Device', 
    value: 'device', 
    description: 'IoT devices and sensors' 
  },
  { 
    label: 'Service', 
    value: 'service', 
    description: 'Backend services and applications' 
  },
  { 
    label: 'User', 
    value: 'user', 
    description: 'Individual user accounts' 
  },
  { 
    label: 'Integration', 
    value: 'integration', 
    description: 'Third-party integrations' 
  },
  { 
    label: 'System', 
    value: 'system', 
    description: 'System-level services' 
  }
]
```

## Usage Examples

### Create a New Client

```javascript
import { 
  clientService, 
  generateClientUsername, 
  generateSecurePassword 
} from '../services'

const clientType = 'device'
const name = 'Temperature Sensor 001'

const newClient = {
  username: generateClientUsername(clientType, name), // 'dev_temperature_sensor_001'
  password: generateSecurePassword(20), // Generate secure password
  role_id: 'sensor-role-id',
  active: true
}

const response = await clientService.createClient(newClient)
console.log('Created client:', response.data.username)
```

### Update Client Password

```javascript
// Generate new secure password
const newPassword = generateSecurePassword(24)

// Update client password (automatically hashed)
await clientService.updatePassword('client-id-123', newPassword)

console.log('Password updated successfully')
```

### Manage Client Status

```javascript
// Deactivate client
await clientService.toggleActiveStatus('client-id-123', false)

// Get all active clients
const activeClients = await clientService.getActiveClients({
  sort: 'username'
})

// Reactivate client
await clientService.toggleActiveStatus('client-id-123', true)
```

### Filter Clients by Role

```javascript
// Get all clients with specific role
const roleClients = await clientService.getClientsByRole('device-role-id')

// Get clients with multiple filters
const filteredClients = await clientService.getList({
  role_id: 'device-role-id',
  active: true,
  sort: 'username'
})
```

### Validate Client Credentials

```javascript
const username = 'dev_sensor_001'
const password = 'userProvidedPassword'

const isValid = await clientService.validateCredentials(username, password)

if (isValid) {
  console.log('Client authenticated successfully')
} else {
  console.error('Authentication failed')
}
```

### Bulk Client Operations

```javascript
// Create multiple clients
const clientsToCreate = [
  {
    username: 'dev_sensor_001',
    password: generateSecurePassword(),
    role_id: 'device-role-id',
    active: true
  },
  {
    username: 'dev_sensor_002',
    password: generateSecurePassword(),
    role_id: 'device-role-id',
    active: true
  }
]

const createdClients = await Promise.all(
  clientsToCreate.map(client => clientService.createClient(client))
)

console.log(`Created ${createdClients.length} clients`)
```

## Error Handling

```javascript
try {
  await clientService.createClient(clientData)
} catch (error) {
  if (error.message.includes('Password is required')) {
    console.error('Password must be provided')
  } else if (error.message.includes('Hash password service')) {
    console.error('External password hashing service unavailable')
  } else if (error.response?.status === 400) {
    console.error('Invalid client data')
  } else {
    console.error('Failed to create client:', error.message)
  }
}
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt via external service
2. **Plain Text Handling**: Plain text passwords are never stored
3. **External Service**: Password hashing relies on external service configuration
4. **Validation**: Username format is validated before creation
5. **Active Status**: Clients can be deactivated without deletion

## Configuration Requirements

The service requires:
- `VITE_HASH_PASSWORD_URL` environment variable for password hashing service
- External bcrypt hashing service availability
- Proper NATS topic permission roles configured
