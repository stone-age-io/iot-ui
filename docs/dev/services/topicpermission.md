# TopicPermissionService API Documentation

## Overview

The `TopicPermissionService` manages NATS topic permissions for messaging clients. It defines which topics clients can publish to and subscribe from, providing role-based access control for the NATS messaging system.

## Collection Schema

- **Collection:** `topic_permissions`
- **JSON Fields:** None
- **Expand Fields:** None

**Schema Fields:**
- `id`: Unique identifier (auto-generated)
- `name`: Name of the permission role
- `publish_permissions`: JSON array of topic strings for publishing
- `subscribe_permissions`: JSON array of topic strings for subscribing
- `created`: Creation timestamp (auto-generated)
- `updated`: Update timestamp (auto-generated)

## Constructor

```javascript
new TopicPermissionService()
```

No parameters required. Uses predefined configuration.

## Methods

### Inherited from BaseService

All standard CRUD operations are available:
- `getList(params)` - Get paginated topic permission list
- `getById(id)` - Get single topic permission
- `create(permission)` - Create new topic permission
- `update(id, permission)` - Update existing topic permission
- `delete(id)` - Delete topic permission

### getClientsByPermission(permissionId)

Retrieves clients using a specific topic permission role.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `permissionId` | `string` | Yes | Topic permission ID |

**Returns:** `Promise<Object>`

```javascript
{
  data: {
    items: Array, // Clients using this permission
    // ... pagination info
  }
}
```

**Usage:**
```javascript
const clients = await topicPermissionService.getClientsByPermission('permission-id-123')
console.log(`${clients.data.items.length} clients use this permission`)
```

### addTopic(id, topic, type)

Adds a topic to a permission's publish or subscribe list.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Topic permission ID |
| `topic` | `string` | Yes | Topic to add |
| `type` | `string` | Yes | Either 'publish' or 'subscribe' |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
// Add publish permission
await topicPermissionService.addTopic(
  'permission-id-123',
  'sensors.temperature',
  'publish'
)

// Add subscribe permission
await topicPermissionService.addTopic(
  'permission-id-123',
  'commands.device.*',
  'subscribe'
)
```

**Notes:**
- Topic is only added if it doesn't already exist in the list
- Returns updated permission object
- Validates type parameter (must be 'publish' or 'subscribe')

### removeTopic(id, topic, type)

Removes a topic from a permission's publish or subscribe list.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Topic permission ID |
| `topic` | `string` | Yes | Topic to remove |
| `type` | `string` | Yes | Either 'publish' or 'subscribe' |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
// Remove publish permission
await topicPermissionService.removeTopic(
  'permission-id-123',
  'sensors.temperature',
  'publish'
)

// Remove subscribe permission  
await topicPermissionService.removeTopic(
  'permission-id-123',
  'commands.device.*',
  'subscribe'
)
```

**Notes:**
- Topic is only removed if it exists in the list
- Returns updated permission object
- Validates type parameter (must be 'publish' or 'subscribe')

## Topic Validation Utility

### validateTopic(topic)

Validates NATS topic format according to NATS rules.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | `string` | Yes | Topic to validate |

**Returns:** `boolean` - True if valid

**NATS Topic Rules:**
- Uses dot notation (e.g., `acme.device.temp`)
- Valid characters: alphanumeric, dot, underscore, dash, `*`, `>`
- Single-level wildcard `*` matches exactly one token
- Multi-level wildcard `>` must be the last token
- No empty tokens allowed
- Wildcards must be standalone tokens

**Usage:**
```javascript
import { validateTopic } from '../services'

// Valid topics
validateTopic('sensors.temperature') // true
validateTopic('device.*.status') // true
validateTopic('alerts.>') // true
validateTopic('user_data.sensor-1.temp') // true

// Invalid topics
validateTopic('sensors..temperature') // false (empty token)
validateTopic('device.prefix*suffix') // false (* not standalone)
validateTopic('alerts.>.more') // false (> not last token)
validateTopic('') // false (empty topic)
```

## Usage Examples

### Create Topic Permission Role

```javascript
const newPermission = {
  name: 'Device Sensors',
  publish_permissions: [
    'sensors.temperature',
    'sensors.humidity',
    'sensors.motion',
    'device.*.status'
  ],
  subscribe_permissions: [
    'commands.device.*',
    'config.sensors.>'
  ]
}

const response = await topicPermissionService.create(newPermission)
const permission = response.data
```

### Update Topic Permissions

```javascript
// Add new topic permissions
await topicPermissionService.addTopic(
  'permission-id-123',
  'sensors.pressure',
  'publish'
)

await topicPermissionService.addTopic(
  'permission-id-123', 
  'alerts.critical.*',
  'subscribe'
)

// Remove topic permissions
await topicPermissionService.removeTopic(
  'permission-id-123',
  'sensors.old_sensor',
  'publish'
)
```

### Manage Complex Topic Patterns

```javascript
// Create role for administrative access
const adminPermission = {
  name: 'System Administrator',
  publish_permissions: [
    'admin.>',           // Can publish to all admin topics
    'system.commands.*', // Can publish system commands
    'alerts.critical.*'  // Can publish critical alerts
  ],
  subscribe_permissions: [
    '>',                 // Can subscribe to everything
  ]
}

// Create role for read-only monitoring
const monitorPermission = {
  name: 'Monitor Only',
  publish_permissions: [], // No publish permissions
  subscribe_permissions: [
    'sensors.>',         // Can read all sensor data
    'device.*.status',   // Can read device status
    'alerts.info.*'      // Can read info alerts
  ]
}

await topicPermissionService.create(adminPermission)
await topicPermissionService.create(monitorPermission)
```

### Bulk Topic Management

```javascript
const permissionId = 'device-role-id'

// Add multiple publish topics
const publishTopics = [
  'sensors.temperature',
  'sensors.humidity',
  'sensors.light',
  'device.heartbeat'
]

for (const topic of publishTopics) {
  await topicPermissionService.addTopic(permissionId, topic, 'publish')
}

// Add multiple subscribe topics
const subscribeTopics = [
  'commands.device.*',
  'config.sensors.*',
  'firmware.updates.*'
]

for (const topic of subscribeTopics) {
  await topicPermissionService.addTopic(permissionId, topic, 'subscribe')
}
```

### Get Permission Usage

```javascript
// Get all clients using a permission
const permission = await topicPermissionService.getById('permission-id-123')
const clients = await topicPermissionService.getClientsByPermission('permission-id-123')

console.log(`Permission "${permission.data.name}" is used by ${clients.data.items.length} clients`)

// List clients using this permission
clients.data.items.forEach(client => {
  console.log(`- ${client.username} (${client.active ? 'active' : 'inactive'})`)
})
```

### Validate Topics Before Adding

```javascript
import { validateTopic } from '../services'

const topicsToAdd = [
  'sensors.temperature',
  'device.*.status',
  'alerts.>',
  'invalid..topic',  // Invalid - empty token
  'bad*topic'        // Invalid - * not standalone
]

const validTopics = topicsToAdd.filter(topic => {
  const isValid = validateTopic(topic)
  if (!isValid) {
    console.warn(`Invalid topic: ${topic}`)
  }
  return isValid
})

// Add only valid topics
for (const topic of validTopics) {
  await topicPermissionService.addTopic('permission-id', topic, 'publish')
}
```

### Permission Templates

```javascript
// Device sensor role template
const createDeviceSensorRole = async (deviceType) => {
  return await topicPermissionService.create({
    name: `${deviceType} Sensors`,
    publish_permissions: [
      `sensors.${deviceType}.*`,
      `device.${deviceType}.status`,
      `device.${deviceType}.heartbeat`
    ],
    subscribe_permissions: [
      `commands.${deviceType}.*`,
      `config.${deviceType}.*`
    ]
  })
}

// Create specific device roles
await createDeviceSensorRole('temperature')
await createDeviceSensorRole('motion')
await createDeviceSensorRole('camera')
```

### Topic Permission Audit

```javascript
// Get all permissions and their usage
const permissions = await topicPermissionService.getList({ sort: 'name' })

for (const permission of permissions.data.items) {
  const clients = await topicPermissionService.getClientsByPermission(permission.id)
  
  console.log(`\nPermission: ${permission.name}`)
  console.log(`Clients: ${clients.data.items.length}`)
  console.log(`Publish topics: ${permission.publish_permissions.length}`)
  console.log(`Subscribe topics: ${permission.subscribe_permissions.length}`)
  
  // Show most permissive topics
  const hasWildcards = [
    ...permission.publish_permissions,
    ...permission.subscribe_permissions
  ].some(topic => topic.includes('*') || topic.includes('>'))
  
  if (hasWildcards) {
    console.log('⚠️  Contains wildcard permissions')
  }
}
```

## Error Handling

```javascript
try {
  await topicPermissionService.addTopic('permission-id', 'sensors.temp', 'invalid-type')
} catch (error) {
  if (error.message.includes('Type must be either publish or subscribe')) {
    console.error('Invalid permission type specified')
  } else if (error.response?.status === 404) {
    console.error('Permission not found')
  } else {
    console.error('Failed to add topic:', error.message)
  }
}

// Validate topics before operations
const topic = 'user.input.topic'
if (!validateTopic(topic)) {
  console.error(`Invalid topic format: ${topic}`)
  return
}

await topicPermissionService.addTopic('permission-id', topic, 'publish')
```

## Topic Pattern Examples

### Hierarchical Sensor Data
```
sensors.temperature.room-101
sensors.temperature.room-102
sensors.humidity.room-101
sensors.motion.hallway-a
```

### Device Commands and Status
```
device.reader-001.commands
device.reader-001.status
device.controller-001.config
device.*.heartbeat
```

### Alert Levels
```
alerts.info.system
alerts.warning.temperature
alerts.critical.security
alerts.>
```

### System Administration
```
admin.users.*
admin.permissions.*
admin.system.restart
system.>
```

## Best Practices

1. **Principle of Least Privilege**: Give clients only the permissions they need
2. **Topic Validation**: Always validate topics before adding to permissions
3. **Wildcard Usage**: Use wildcards judiciously for maintenance and security
4. **Naming Conventions**: Use consistent dot notation and naming patterns
5. **Regular Audits**: Periodically review permissions and their usage
6. **Documentation**: Document the purpose of each permission role

## Integration with Client Service

Topic permissions are used by the Client Service:

```javascript
// Create client with specific permission role
const newClient = {
  username: 'temperature_sensor_001',
  password: 'securePassword',
  role_id: 'sensor-permission-id', // Links to topic permission
  active: true
}

await clientService.createClient(newClient)
```
