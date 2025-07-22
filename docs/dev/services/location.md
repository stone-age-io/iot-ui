# LocationService API Documentation

## Overview

The `LocationService` manages physical locations within edge installations. It supports hierarchical location structures, floor plan management, coordinate tracking, and file uploads. Locations can be rooms, zones, floors, or any spatial division within an edge.

## Collection Schema

- **Collection:** `locations`
- **JSON Fields:** `metadata`
- **Expand Fields:** `edge_id`, `parent_id`

## Constructor

```javascript
new LocationService()
```

No parameters required. Uses predefined configuration.

## Methods

### Inherited from BaseService

All standard CRUD operations are available:
- `getList(params)` - Get paginated location list
- `getById(id)` - Get single location
- `create(location)` - Create new location
- `update(id, location)` - Update existing location
- `delete(id)` - Delete location

### getChildLocations(parentId, params)

Retrieves child locations for a given parent location.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parentId` | `string` | Yes | Parent location ID |
| `params` | `Object` | No | Additional query parameters |

**Returns:** `Promise<Object>`

```javascript
{
  data: {
    items: Array, // Child locations
    // ... pagination info
  }
}
```

**Usage:**
```javascript
const childLocations = await locationService.getChildLocations('parent-id-123', {
  sort: 'name'
})
```

### getRootLocations(params)

Retrieves root locations (locations without a parent).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const rootLocations = await locationService.getRootLocations({
  sort: 'created'
})
```

### uploadFloorPlan(id, formData)

Uploads a floor plan image for a location.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |
| `formData` | `FormData` | Yes | FormData containing the floorplan file |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
const formData = new FormData()
formData.append('floorplan', fileInput.files[0])

const response = await locationService.uploadFloorPlan('location-id-123', formData)
```

### getFloorPlanImageUrl(location)

Gets the floor plan image URL using ConfigService.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | `Object` | Yes | Location object with floorplan field |

**Returns:** `string|null` - Floor plan image URL or null

**Usage:**
```javascript
const imageUrl = locationService.getFloorPlanImageUrl(location)
if (imageUrl) {
  // Display floor plan
  console.log('Floor plan available:', imageUrl)
}
```

### getFloorPlanThumbnailUrl(location, size)

Gets the floor plan thumbnail URL.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `location` | `Object` | Yes | - | Location object with floorplan field |
| `size` | `string` | No | `'800x600'` | Thumbnail size |

**Returns:** `string|null` - Thumbnail URL or null

**Usage:**
```javascript
const thumbnailUrl = locationService.getFloorPlanThumbnailUrl(location, '400x300')
```

### getFloorPlanDownloadUrl(location)

Gets the downloadable floor plan URL.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | `Object` | Yes | Location object with floorplan field |

**Returns:** `string|null` - Download URL or null

**Usage:**
```javascript
const downloadUrl = locationService.getFloorPlanDownloadUrl(location)
```

### updateLocationCoordinates(id, coordinates)

Updates location global coordinates (for global maps).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |
| `coordinates` | `Object` | Yes | `{lat, lng}` coordinates |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await locationService.updateLocationCoordinates('location-id-123', {
  lat: 40.7128,
  lng: -74.0060
})
```

### updateLocationIndoorCoordinates(id, coordinates)

Updates location indoor coordinates (for floor plan positioning).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |
| `coordinates` | `Object` | Yes | `{x, y}` coordinates on floor plan |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await locationService.updateLocationIndoorCoordinates('location-id-123', {
  x: 150,
  y: 200
})
```

### isCircularReference(locationId, potentialParentId)

Checks if setting a parent would create a circular reference.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `locationId` | `string` | Yes | Location ID to check |
| `potentialParentId` | `string` | Yes | Potential parent ID |

**Returns:** `Promise<boolean>` - True if circular reference would occur

**Usage:**
```javascript
const wouldBeCircular = await locationService.isCircularReference(
  'child-id',
  'potential-parent-id'
)

if (wouldBeCircular) {
  console.error('Cannot set parent: would create circular reference')
}
```

### computeLocationPath(parentPath, locationCode)

Computes location path based on parent-child relationship.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parentPath` | `string` | Yes | Parent location path |
| `locationCode` | `string` | Yes | Location code |

**Returns:** `string` - Computed path

**Usage:**
```javascript
const path = locationService.computeLocationPath('floor-1/north-wing', 'room-101')
// Returns: 'floor-1/north-wing/room-101'
```

### updateLocationPath(id, parentId)

Updates location path based on parent change.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |
| `parentId` | `string` | Yes | New parent ID |

**Returns:** `Promise<Object>`

**Usage:**
```javascript
await locationService.updateLocationPath('location-id', 'new-parent-id')
```

### transformParams(transformedParams, originalParams)

Transforms query parameters for location-specific filtering.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transformedParams` | `Object` | Yes | Parameters being transformed |
| `originalParams` | `Object` | Yes | Original input parameters |

**Supported Original Parameters:**
- `edge_id`: Filter by edge ID
- `parent_id`: Filter by parent ID
- `parent_id_empty`: Filter for root locations (no parent)

## Location Code Utilities

### validateLocationCode(code)

Validates location code format following pattern: `{type}-{number}`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Location code to validate |

**Returns:** `boolean`

**Usage:**
```javascript
import { validateLocationCode } from '../services'

const isValid = validateLocationCode('room-101') // true
const isInvalid = validateLocationCode('invalid') // false
```

### generateLocationCode(type, number)

Generates location code from type and number.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `string` | Yes | Location type |
| `number` | `string|number` | Yes | Identifying number/code |

**Returns:** `string` - Formatted location code

**Usage:**
```javascript
import { generateLocationCode } from '../services'

const code = generateLocationCode('room', '101') // 'room-101'
const code2 = generateLocationCode('floor', 2) // 'floor-2'
```

### parseLocationPath(path)

Parses location path into segments.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Location path |

**Returns:** `Array` - Array of path segments

**Usage:**
```javascript
import { parseLocationPath } from '../services'

const segments = parseLocationPath('floor-1/north-wing/room-101')
// Returns: ['floor-1', 'north-wing', 'room-101']
```

### computeLocationPath(parentPath, locationCode)

Computes path from parent path and location code.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parentPath` | `string` | Yes | Parent location path |
| `locationCode` | `string` | Yes | Location code |

**Returns:** `string` - Computed path

**Usage:**
```javascript
import { computeLocationPath } from '../services'

const path = computeLocationPath('floor-1', 'room-101') // 'floor-1/room-101'
```

## Location Types

Pre-defined location types for dropdown usage:

```javascript
import { locationTypes } from '../services'

// Available types:
[
  { label: 'Zone', value: 'zone' },
  { label: 'Room', value: 'room' },
  { label: 'Station', value: 'station' },
  { label: 'Area', value: 'area' },
  { label: 'Section', value: 'section' },
  { label: 'Floor', value: 'floor' },
  { label: 'Wing', value: 'wing' },
  { label: 'Virtual', value: 'virtual' },
  { label: 'Meeting Room', value: 'meeting-room' },
  { label: 'Server Room', value: 'server-room' },
  { label: 'Storage Room', value: 'storage-room' },
  { label: 'Entrance', value: 'entrance' },
  { label: 'Reception Area', value: 'reception-area' },
  { label: 'Security Zone', value: 'security-zone' }
]
```

## Usage Examples

### Create Hierarchical Locations

```javascript
// Create root location (floor)
const floor = await locationService.create({
  code: 'floor-1',
  name: 'First Floor',
  type: 'floor',
  edge_id: 'edge-id-123',
  metadata: {
    area: 5000,
    capacity: 200
  }
})

// Create child location (wing)
const wing = await locationService.create({
  code: 'north-wing',
  name: 'North Wing',
  type: 'wing',
  edge_id: 'edge-id-123',
  parent_id: floor.data.id,
  path: 'floor-1/north-wing'
})

// Create room in wing
const room = await locationService.create({
  code: 'room-101',
  name: 'Conference Room 101',
  type: 'meeting-room',
  edge_id: 'edge-id-123',
  parent_id: wing.data.id,
  path: 'floor-1/north-wing/room-101'
})
```

### Upload and Manage Floor Plans

```javascript
// Upload floor plan
const formData = new FormData()
formData.append('floorplan', fileInput.files[0])
await locationService.uploadFloorPlan('location-id', formData)

// Get floor plan URLs
const location = await locationService.getById('location-id')
const imageUrl = locationService.getFloorPlanImageUrl(location.data)
const thumbnailUrl = locationService.getFloorPlanThumbnailUrl(location.data, '600x400')
const downloadUrl = locationService.getFloorPlanDownloadUrl(location.data)
```

### Position Locations on Maps

```javascript
// Set global coordinates (for world map)
await locationService.updateLocationCoordinates('location-id', {
  lat: 40.7128,
  lng: -74.0060
})

// Set indoor coordinates (for floor plan)
await locationService.updateLocationIndoorCoordinates('location-id', {
  x: 150,
  y: 200
})
```

### Filter Locations

```javascript
// Get all locations in an edge
const edgeLocations = await locationService.getList({
  edge_id: 'edge-id-123',
  sort: 'path'
})

// Get root locations only
const rootLocations = await locationService.getRootLocations()

// Get child locations
const children = await locationService.getChildLocations('parent-id')
```

### Prevent Circular References

```javascript
// Check before setting parent
const wouldBeCircular = await locationService.isCircularReference(
  'child-location-id',
  'potential-parent-id'
)

if (!wouldBeCircular) {
  await locationService.update('child-location-id', {
    parent_id: 'potential-parent-id'
  })
  
  // Update path to reflect new hierarchy
  await locationService.updateLocationPath('child-location-id', 'potential-parent-id')
}
```

## Error Handling

```javascript
try {
  await locationService.uploadFloorPlan('location-id', formData)
} catch (error) {
  if (error.response?.status === 413) {
    console.error('File too large')
  } else if (error.response?.status === 400) {
    console.error('Invalid file type')
  } else {
    console.error('Upload failed:', error.message)
  }
}
