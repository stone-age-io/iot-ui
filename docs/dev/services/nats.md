# NATS Services API Documentation

## Overview

The NATS Services provide real-time messaging capabilities for the IoT Platform. They handle WebSocket connections to NATS servers, message publishing/subscribing, connection management, and configuration persistence.

## NatsService (Core Service)

### Overview
Core service for NATS WebSocket connections, message handling, and subscription management.

### Constructor

```javascript
new NatsService()
```

Initializes connection state, subscription tracking, and status listeners.

### Properties

#### status
Current connection status: `'disconnected'`, `'connecting'`, `'connected'`, `'error'`

#### connection
Active NATS WebSocket connection object (null when disconnected)

#### subscriptions
Map of active subscriptions tracked by unique IDs

#### topicSubscriptions
Map of subscriptions tracked by topic/subject

### Methods

#### connect(config)

Connects to NATS server using WebSocket.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `Object` | Yes | Connection configuration |

**Config Object:**
```javascript
{
  url: string,        // NATS WebSocket URL (ws://localhost:8080)
  user: string,       // Optional username
  pass: string,       // Optional password
  token: string       // Optional token (alternative to user/pass)
}
```

**Returns:** `Promise<boolean>` - Connection success

**Usage:**
```javascript
const config = {
  url: 'ws://localhost:8080',
  user: 'myuser',
  pass: 'mypassword'
}

const success = await natsService.connect(config)
if (success) {
  console.log('Connected to NATS')
} else {
  console.error('Connection failed')
}
```

#### disconnect()

Disconnects from NATS server and cleans up subscriptions.

**Returns:** `Promise<void>`

**Usage:**
```javascript
await natsService.disconnect()
console.log('Disconnected from NATS')
```

#### publish(subject, message)

Publishes a message to a NATS subject.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subject` | `string` | Yes | NATS subject to publish to |
| `message` | `Object` | Yes | Message to publish (JSON serialized) |

**Returns:** `Promise<boolean>` - Publish success

**Usage:**
```javascript
const success = await natsService.publish('sensors.temperature', {
  deviceId: 'sensor-001',
  temperature: 23.5,
  timestamp: new Date().toISOString()
})

if (success) {
  console.log('Message published')
}
```

#### subscribe(subject, callback)

Subscribes to a NATS subject with message callback.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subject` | `string` | Yes | NATS subject to subscribe to |
| `callback` | `Function` | Yes | Message handler function |

**Callback Signature:**
```javascript
(data, subject, subscriptionId) => {
  // Handle received message
}
```

**Returns:** `Object|null` - Subscription object or null on failure

**Usage:**
```javascript
const subscription = await natsService.subscribe('sensors.temperature', (data, subject, subId) => {
  console.log(`Received on ${subject}:`, data)
  console.log('Subscription ID:', subId)
})

if (subscription) {
  console.log('Subscribed successfully')
}
```

#### unsubscribe(subscription)

Unsubscribes from a NATS subject.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscription` | `Object` | Yes | Subscription object to unsubscribe |

**Usage:**
```javascript
await natsService.unsubscribe(subscription)
console.log('Unsubscribed')
```

#### onStatusChange(listener)

Adds a connection status change listener.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listener` | `Function` | Yes | Status change callback |

**Listener Signature:**
```javascript
(status, errorMessage) => {
  // Handle status change
}
```

**Usage:**
```javascript
natsService.onStatusChange((status, error) => {
  console.log('NATS status:', status)
  if (error) {
    console.error('NATS error:', error)
  }
})
```

#### removeStatusListener(listener)

Removes a status change listener.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listener` | `Function` | Yes | Listener to remove |

#### isConnected()

Checks if connected to NATS server.

**Returns:** `boolean` - Connection status

**Usage:**
```javascript
if (natsService.isConnected()) {
  await natsService.publish('test.message', { data: 'test' })
}
```

#### getSubscriptions()

Gets all active subscriptions.

**Returns:** `Map` - Map of subscription ID to subscription object

#### getSubscriptionBySubject(subject)

Gets subscription by subject/topic.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subject` | `string` | Yes | Subject to lookup |

**Returns:** `Object|undefined` - Subscription object if found

#### generateTestMessage(topic, data)

Generates a test message for debugging.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | `string` | No | `'test'` | Topic to publish to |
| `data` | `Object` | No | `{test: 'message', timestamp: ISO}` | Message data |

**Returns:** `boolean` - Success status

**Usage:**
```javascript
// Generate test message
natsService.generateTestMessage('test.debug', {
  message: 'Debug test',
  source: 'ui'
})
```

---

## NatsConfigService

### Overview
Manages NATS connection configuration persistence in localStorage.

### Constructor

```javascript
new NatsConfigService()
```

### Methods

#### getConfig()

Gets NATS configuration from localStorage.

**Returns:** `Object` - NATS configuration

```javascript
{
  url: string,
  user: string,
  pass: string,
  token: string,
  autoConnect: boolean,
  subjects: Array<string>
}
```

**Usage:**
```javascript
const config = natsConfigService.getConfig()
console.log('NATS URL:', config.url)
```

#### saveConfig(config)

Saves NATS configuration to localStorage.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `Object` | Yes | Configuration to save |

**Usage:**
```javascript
const config = {
  url: 'ws://localhost:8080',
  user: 'myuser',
  pass: 'mypassword',
  autoConnect: true,
  subjects: ['sensors.*', 'alerts.>']
}

natsConfigService.saveConfig(config)
```

#### getDefaultConfig()

Gets default NATS configuration.

**Returns:** `Object` - Default configuration

```javascript
{
  url: 'ws://localhost:8080',
  user: '',
  pass: '',
  token: '',
  autoConnect: false,
  subjects: []
}
```

#### validateConfig(config)

Validates NATS configuration.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `Object` | Yes | Configuration to validate |

**Returns:** `Object` - Validation result

```javascript
{
  valid: boolean,
  errors: Array<string>
}
```

**Usage:**
```javascript
const validation = natsConfigService.validateConfig(config)

if (!validation.valid) {
  console.error('Config errors:', validation.errors)
} else {
  natsConfigService.saveConfig(config)
}
```

**Validation Rules:**
- URL is required and must start with `ws://` or `wss://`
- Either token OR username/password must be provided
- Cannot have both token and username/password

---

## NatsConnectionManager

### Overview
Global connection manager that handles connection lifecycle, auto-connect, and reconnection logic.

### Constructor

```javascript
new NatsConnectionManager()
```

### Methods

#### initialize()

Initializes the connection manager (call once at app startup).

**Usage:**
```javascript
// In main.js or app initialization
natsConnectionManager.initialize()
```

**Features:**
- Sets up status change listeners
- Handles unexpected disconnections
- Adds storage event listeners for cross-tab synchronization

#### attemptAutoConnect()

Attempts to establish connection if auto-connect is enabled.

**Returns:** `Promise<boolean>` - Whether auto-connect was attempted

**Usage:**
```javascript
// Called automatically after authentication
const attempted = await natsConnectionManager.attemptAutoConnect()
```

#### connect(config)

Manually connects to NATS with given configuration.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `Object` | Yes | Connection configuration |

**Returns:** `Promise<boolean>` - Connection success

**Usage:**
```javascript
const config = natsConfigService.getConfig()
const success = await natsConnectionManager.connect(config)
```

#### disconnect()

Manually disconnects from NATS.

**Returns:** `Promise<void>`

**Usage:**
```javascript
await natsConnectionManager.disconnect()
```

#### resetConnectionState()

Resets connection state to allow reconnection attempts.

**Usage:**
```javascript
// After connection issues, reset to allow retry
natsConnectionManager.resetConnectionState()
await natsConnectionManager.attemptAutoConnect()
```

#### getStatus()

Gets current connection status.

**Returns:** `string` - Connection status

#### isConnected()

Checks if currently connected.

**Returns:** `boolean` - Connection status

#### sendTestMessage()

Sends a test message to verify connection.

**Returns:** `boolean` - Whether message was sent

**Usage:**
```javascript
if (natsConnectionManager.sendTestMessage()) {
  console.log('Test message sent')
}
```

---

## AuditLogService

### Overview
Manages audit logs for tracking system activities and changes.

### Collection Schema
- **Collection:** `audit_logs`
- **JSON Fields:** `before_changes`, `after_changes`
- **Expand Fields:** `user_id`

**Schema Fields:**
- `id`: Unique identifier
- `event_type`: Type of event (create_request, update_request, etc.)
- `collection_name`: Name of affected collection
- `record_id`: ID of affected record
- `user_id`: User who performed the action
- `request_method`: HTTP method used
- `request_url`: Request URL
- `before_changes`: JSON of data before change
- `after_changes`: JSON of data after change
- `timestamp`: When the event occurred

### Constructor

```javascript
new AuditLogService()
```

### Methods

#### getRecentActivity(options)

Gets recent activity logs.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `options` | `Object` | No | `{}` | Query options |

**Options:**
- `limit`: Maximum logs to return (default: 10)
- `sortBy`: Field to sort by (default: 'timestamp')
- `sortDirection`: 'asc' or 'desc' (default: 'desc')

**Returns:** `Promise<Array>` - Recent activity logs

**Usage:**
```javascript
const recentLogs = await auditLogService.getRecentActivity({
  limit: 20,
  sortBy: 'timestamp',
  sortDirection: 'desc'
})

console.log(`Found ${recentLogs.length} recent activities`)
```

#### formatLogForDisplay(log)

Formats audit log for UI display.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `log` | `Object` | Yes | Raw audit log from API |

**Returns:** `Object` - Formatted log for UI

```javascript
{
  id: string,
  type: string,           // 'create', 'update', 'delete', 'login', 'info'
  title: string,          // Human-readable title
  timestamp: string,      // Formatted timestamp
  user: string,           // User name
  details: {
    collection: string,
    recordId: string,
    method: string,
    url: string,
    changes: Object,
    eventType: string
  }
}
```

**Usage:**
```javascript
const logs = await auditLogService.getRecentActivity()
const formattedLogs = logs.map(log => auditLogService.formatLogForDisplay(log))

// Use in UI components
formattedLogs.forEach(log => {
  console.log(`${log.timestamp}: ${log.title}`)
})
```

---

## Usage Examples

### Complete NATS Setup

```javascript
// Initialize NATS services at app startup
import natsConnectionManager from './services/nats/natsConnectionManager'
import { natsConfigService } from './services/nats/natsConfigService'

// 1. Initialize connection manager
natsConnectionManager.initialize()

// 2. Set up configuration
const natsConfig = {
  url: 'ws://localhost:8080',
  user: 'iot_platform',
  pass: 'secure_password',
  autoConnect: true,
  subjects: ['sensors.*', 'devices.*', 'alerts.>']
}

// 3. Validate and save configuration
const validation = natsConfigService.validateConfig(natsConfig)
if (validation.valid) {
  natsConfigService.saveConfig(natsConfig)
} else {
  console.error('Invalid NATS config:', validation.errors)
}

// 4. Attempt auto-connect after user authentication
const connectSuccess = await natsConnectionManager.attemptAutoConnect()
if (connectSuccess) {
  console.log('NATS connected automatically')
}
```

### Message Publishing

```javascript
// Publish sensor data
const publishSensorData = async (deviceId, sensorData) => {
  if (!natsService.isConnected()) {
    console.warn('NATS not connected, cannot publish sensor data')
    return false
  }
  
  const message = {
    deviceId,
    ...sensorData,
    timestamp: new Date().toISOString(),
    source: 'iot-platform'
  }
  
  const subject = `sensors.${deviceId}.data`
  return await natsService.publish(subject, message)
}

// Publish device status
const publishDeviceStatus = async (deviceId, status) => {
  const subject = `devices.${deviceId}.status`
  return await natsService.publish(subject, {
    deviceId,
    status,
    timestamp: new Date().toISOString()
  })
}

// Usage
await publishSensorData('temp-001', {
  temperature: 23.5,
  humidity: 45
})

await publishDeviceStatus('temp-001', {
  online: true,
  battery: 85
})
```

### Message Subscription

```javascript
// Subscribe to sensor data
const subscribeSensorData = async () => {
  const subscription = await natsService.subscribe('sensors.*.data', (data, subject) => {
    console.log(`Sensor data from ${subject}:`, data)
    
    // Update UI with sensor data
    updateSensorDisplay(data.deviceId, data)
  })
  
  return subscription
}

// Subscribe to device alerts
const subscribeDeviceAlerts = async () => {
  return await natsService.subscribe('alerts.devices.>', (alert, subject) => {
    console.log(`Device alert on ${subject}:`, alert)
    
    // Show alert in UI
    showDeviceAlert(alert)
  })
}

// Subscribe to all device status updates
const subscribeDeviceStatus = async () => {
  return await natsService.subscribe('devices.*.status', (status, subject) => {
    const deviceId = subject.split('.')[1]
    updateDeviceStatus(deviceId, status)
  })
}

// Set up all subscriptions
const setupSubscriptions = async () => {
  if (!natsService.isConnected()) {
    console.warn('Cannot set up subscriptions: NATS not connected')
    return
  }
  
  const subscriptions = await Promise.all([
    subscribeSensorData(),
    subscribeDeviceAlerts(),
    subscribeDeviceStatus()
  ])
  
  console.log(`Set up ${subscriptions.filter(s => s).length} subscriptions`)
  return subscriptions
}
```

### Connection State Management

```javascript
// React to connection status changes
natsService.onStatusChange((status, errorMessage) => {
  switch (status) {
    case 'connecting':
      showConnectionStatus('Connecting to NATS...', 'info')
      break
      
    case 'connected':
      showConnectionStatus('Connected to NATS', 'success')
      // Set up subscriptions after connection
      setupSubscriptions()
      break
      
    case 'disconnected':
      showConnectionStatus('Disconnected from NATS', 'warning')
      // Clear any UI that depends on real-time data
      clearRealTimeData()
      break
      
    case 'error':
      showConnectionStatus(`NATS Error: ${errorMessage}`, 'error')
      break
  }
})

// Manual connection management
const handleManualConnect = async () => {
  const config = natsConfigService.getConfig()
  
  // Validate config before connecting
  const validation = natsConfigService.validateConfig(config)
  if (!validation.valid) {
    showError(`Configuration errors: ${validation.errors.join(', ')}`)
    return
  }
  
  const success = await natsConnectionManager.connect(config)
  if (success) {
    showSuccess('Connected to NATS manually')
  } else {
    showError('Failed to connect to NATS')
  }
}

const handleManualDisconnect = async () => {
  await natsConnectionManager.disconnect()
  showInfo('Disconnected from NATS')
}
```

### Audit Log Integration

```javascript
// Display recent activity in dashboard
const loadRecentActivity = async () => {
  try {
    const logs = await auditLogService.getRecentActivity({
      limit: 10
    })
    
    const formattedLogs = logs.map(log => 
      auditLogService.formatLogForDisplay(log)
    )
    
    // Update UI with formatted logs
    displayActivityFeed(formattedLogs)
    
  } catch (error) {
    console.error('Failed to load recent activity:', error)
  }
}

// Real-time activity updates via NATS
const subscribeToAuditLogs = async () => {
  return await natsService.subscribe('system.audit.*', (auditData, subject) => {
    // Format and add to activity feed
    const formattedLog = auditLogService.formatLogForDisplay(auditData)
    addToActivityFeed(formattedLog)
  })
}
```

### Error Handling

```javascript
// Comprehensive error handling for NATS operations
const safeNatsOperation = async (operation, context = '') => {
  try {
    return await operation()
  } catch (error) {
    console.error(`NATS operation failed${context}:`, error)
    
    // Handle specific error types
    if (error.message.includes('connection')) {
      showError('NATS connection lost. Attempting to reconnect...')
      natsConnectionManager.resetConnectionState()
      await natsConnectionManager.attemptAutoConnect()
    } else if (error.message.includes('permission')) {
      showError('Insufficient permissions for NATS operation')
    } else {
      showError(`NATS operation failed: ${error.message}`)
    }
    
    return null
  }
}

// Usage
const subscription = await safeNatsOperation(
  () => natsService.subscribe('sensors.*', handleSensorData),
  ' during sensor subscription'
)
```

## Integration with Vue Components

```javascript
// Vue component with NATS integration
export default {
  setup() {
    const isConnected = ref(false)
    const messages = ref([])
    
    // Watch connection status
    const updateConnectionStatus = (status) => {
      isConnected.value = status === 'connected'
    }
    
    onMounted(() => {
      // Set up status listener
      natsService.onStatusChange(updateConnectionStatus)
      
      // Check initial status
      isConnected.value = natsService.isConnected()
      
      // Set up subscriptions if connected
      if (isConnected.value) {
        setupMessageSubscription()
      }
    })
    
    onUnmounted(() => {
      // Clean up status listener
      natsService.removeStatusListener(updateConnectionStatus)
    })
    
    const setupMessageSubscription = async () => {
      await natsService.subscribe('app.messages.*', (message) => {
        messages.value.unshift(message)
        if (messages.value.length > 100) {
          messages.value = messages.value.slice(0, 100)
        }
      })
    }
    
    return {
      isConnected,
      messages
    }
  }
}
```
