# ThingService API Documentation

## Overview

The `ThingService` manages IoT devices (things) within the IoT Platform. It handles device state management, positioning, metadata updates, and provides utilities for device code generation and validation.

## Collection Schema

- **Collection:** `things`
- **JSON Fields:** `metadata`, `current_state`
- **Expand Fields:** `location_id`, `edge_id`

## Constructor

```javascript
new ThingService()
```

No parameters required. Uses predefined configuration.

## Methods

### Inherited from BaseService

All standard CRUD operations are available:
- `getList(params)` - Get paginated thing list
- `getById(id)` - Get single thing
- `create(thing)` - Create new thing
- `update(id, thing)` - Update existing thing
- `delete(id)` - Delete thing

### getThingsByLocation(locationId)

Retrieves all things for a specific location.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `locationId` | `string` | Yes | Location ID |

**Returns:** `Promise<Object>`

```javascript
{
  data: {
    items: Array, // Things in the location
    // ... pagination info
  }
}
```

**Usage:**
```javascript
const locationThings = await thingService.getThingsByLocation('location-id-123')
console.log(`Found ${locationThings.data.items.length} things in location`)
```

### updateThingState(id, state, merge)

Updates thing current state with optional merging.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | `string` | Yes | - | Thing ID |
| `state` | `Object` | Yes | - | State object to update |
| `merge` | `boolean` | No | `true` | Whether to merge with existing state |

**Returns:** `Promise<Object>`

```javascript
{
  data: Object // Updated thing with new state and last_seen timestamp
}
```

**Usage:**
```javascript
// Merge with existing state
await thingService.updateThingState('thing-id-123', {
  temperature: 22.5,
  humidity: 45,
  online: true
})

// Replace entire state
await thingService.updateThingState('thing-id-123', {
  status: 'maintenance'
}, false)
```

### updateThingPosition(id, coordinates)

Updates thing indoor position coordinates on floor plan.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |
| `coordinates` | `Object` | Yes | `{x, y}` coordinates on floor plan |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await thingService.updateThingPosition('thing-id-123', {
  x: 150,
  y: 200
})
```

### createThing(thingData)

Creates a new thing (wrapper around base create method).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thingData` | `Object` | Yes | Thing data |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const newThing = {
  code: 'rdr-floor1-001',
  name: 'Entry Reader',
  type: 'reader',
  location_id: 'location-id-123',
  edge_id: 'edge-id-123',
  metadata: {
    model: 'HID-R40',
    firmware: '1.2.3'
  },
  current_state: {
    online: true,
    battery: 100
  }
}

const response = await thingService.createThing(newThing)
```

### updateThing(id, thingData)

Updates an existing thing (wrapper around base update method).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |
| `thingData` | `Object` | Yes | Updated thing data |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await thingService.updateThing('thing-id-123', {
  name: 'Updated Reader Name',
  metadata: {
    model: 'HID-R50',
    firmware: '2.0.0'
  }
})
```

### transformParams(transformedParams, originalParams)

Transforms query parameters for thing-specific filtering.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transformedParams` | `Object` | Yes | Parameters being transformed |
| `originalParams` | `Object` | Yes | Original input parameters |

**Supported Original Parameters:**
- `location_id`: Filter by location ID
- `edge_id`: Filter by edge ID
- `type`: Filter by thing type

**Usage:**
```javascript
// Get things by location
await thingService.getList({ location_id: 'location-123' })

// Get things by edge
await thingService.getList({ edge_id: 'edge-123' })

// Get things by type
await thingService.getList({ type: 'reader' })

// Combine filters
await thingService.getList({ 
  location_id: 'location-123',
  type: 'reader'
})
```

## Thing Code Utilities

### validateThingCode(code)

Validates thing code format following pattern: `{type}-{location}-{number}`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Thing code to validate |

**Returns:** `boolean`

**Valid Format:** 3-4 lowercase letters, hyphen, location identifier, hyphen, 3-4 digits

**Usage:**
```javascript
import { validateThingCode } from '../services'

const isValid = validateThingCode('rdr-floor1-001') // true
const isInvalid = validateThingCode('invalid') // false
```

### generateThingCode(type, location, number)

Generates thing code from components.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `string` | Yes | Thing type abbreviation |
| `location` | `string` | Yes | Location identifier |
| `number` | `number` | Yes | Sequence number |

**Returns:** `string` - Formatted thing code

**Usage:**
```javascript
import { generateThingCode } from '../services'

const code = generateThingCode('rdr', 'floor1', 1) // 'rdr-floor1-001'
const code2 = generateThingCode('temp', 'room101', 5) // 'temp-room101-005'
```

### getThingTypeAbbreviation(thingType)

Converts thing type to abbreviation for code generation.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thingType` | `string` | Yes | Thing type (e.g., 'reader') |

**Returns:** `string` - Abbreviation (e.g., 'rdr')

**Usage:**
```javascript
import { getThingTypeAbbreviation } from '../services'

const abbrev = getThingTypeAbbreviation('reader') // 'rdr'
const abbrev2 = getThingTypeAbbreviation('temperature-sensor') // 'temp'
```

**Available Abbreviations:**
- `reader` → `rdr`
- `controller` → `ctrl`
- `lock` → `lock`
- `temperature-sensor` → `temp`
- `humidity-sensor` → `hum`
- `hvac` → `hvac`
- `lighting` → `light`
- `camera` → `cam`
- `motion-sensor` → `motion`
- `occupancy-sensor` → `occ`

## Thing Types

Pre-defined thing types for dropdown usage:

```javascript
import { thingTypes } from '../services'

// Available types:
[
  { label: 'Reader', value: 'reader' },
  { label: 'Controller', value: 'controller' },
  { label: 'Lock', value: 'lock' },
  { label: 'Temperature Sensor', value: 'temperature-sensor' },
  { label: 'Humidity Sensor', value: 'humidity-sensor' },
  { label: 'HVAC Unit', value: 'hvac' },
  { label: 'Lighting Controller', value: 'lighting' },
  { label: 'Camera', value: 'camera' },
  { label: 'Motion Sensor', value: 'motion-sensor' },
  { label: 'Occupancy Sensor', value: 'occupancy-sensor' }
]
```

## Usage Examples

### Create a New Thing

```javascript
import { thingService, generateThingCode, getThingTypeAbbreviation } from '../services'

const thingType = 'reader'
const locationCode = 'floor1'
const number = 1

const newThing = {
  code: generateThingCode(
    getThingTypeAbbreviation(thingType),
    locationCode,
    number
  ), // 'rdr-floor1-001'
  name: 'Main Entrance Reader',
  type: thingType,
  location_id: 'location-id-123',
  edge_id: 'edge-id-123',
  active: true,
  metadata: {
    model: 'HID-R40',
    firmware: '1.2.3',
    installDate: '2024-01-15',
    coordinates: {
      x: 100,
      y: 150
    }
  },
  current_state: {
    online: true,
    battery: 100,
    lastSeen: new Date().toISOString()
  }
}

const response = await thingService.createThing(newThing)
```

### Update Thing State

```javascript
// Update sensor readings (merge with existing state)
await thingService.updateThingState('sensor-id-123', {
  temperature: 23.5,
  humidity: 47,
  timestamp: new Date().toISOString()
})

// Update device status (replace entire state)
await thingService.updateThingState('device-id-123', {
  status: 'offline',
  lastError: 'Connection timeout',
  timestamp: new Date().toISOString()
}, false)
```

### Position Things on Floor Plan

```javascript
// Move thing to new position on floor plan
await thingService.updateThingPosition('thing-id-123', {
  x: 250,
  y: 300
})

// Bulk update positions
const things = await thingService.getThingsByLocation('location-id')
for (const thing of things.data.items) {
  await thingService.updateThingPosition(thing.id, {
    x: thing.metadata.coordinates?.x || 0,
    y: thing.metadata.coordinates?.y || 0
  })
}
```

### Filter and Query Things

```javascript
// Get all readers in a location
const readers = await thingService.getList({
  location_id: 'location-123',
  type: 'reader',
  sort: 'name'
})

// Get all things in an edge
const edgeThings = await thingService.getList({
  edge_id: 'edge-123',
  sort: '-created'
})

// Get things by location
const locationThings = await thingService.getThingsByLocation('location-123')
```

### Monitor Thing Status

```javascript
// Get thing with current state
const response = await thingService.getById('thing-id-123')
const thing = response.data

console.log('Thing status:', thing.current_state)
console.log('Last seen:', thing.last_seen)
console.log('Position:', thing.metadata?.coordinates)

// Update last seen timestamp
await thingService.updateThingState(thing.id, {
  ...thing.current_state,
  lastSeen: new Date().toISOString()
})
```

### Batch Operations

```javascript
// Create multiple things
const thingsToCreate = [
  {
    code: 'rdr-lobby-001',
    name: 'Lobby Reader 1',
    type: 'reader',
    location_id: 'lobby-id',
    edge_id: 'edge-id'
  },
  {
    code: 'rdr-lobby-002', 
    name: 'Lobby Reader 2',
    type: 'reader',
    location_id: 'lobby-id',
    edge_id: 'edge-id'
  }
]

const createdThings = await Promise.all(
  thingsToCreate.map(thing => thingService.createThing(thing))
)
```

## Error Handling

```javascript
try {
  await thingService.updateThingState('thing-id', newState)
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Thing not found')
  } else if (error.response?.status === 400) {
    console.error('Invalid state data')
  } else {
    console.error('Failed to update thing state:', error.message)
  }
}
```

## State Management Best Practices

1. **Merging States**: Use `merge: true` (default) to preserve existing state data
2. **Timestamps**: Always include timestamps in state updates
3. **Validation**: Validate state data before updating
4. **Error Handling**: Handle network errors and invalid data gracefully

```javascript
// Good state update pattern
const updateSensorReading = async (thingId, reading) => {
  try {
    await thingService.updateThingState(thingId, {
      ...reading,
      timestamp: new Date().toISOString(),
      lastUpdate: Date.now()
    })
  } catch (error) {
    console.error('Failed to update sensor reading:', error)
    // Handle error appropriately
  }
}
```
