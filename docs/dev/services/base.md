# EdgeService API Documentation

## Overview

The `EdgeService` manages edge installations (buildings, campuses, data centers) in the IoT Platform. It extends `BaseService` with edge-specific functionality including metadata management and type/region integration.

## Collection Schema

- **Collection:** `edges`
- **JSON Fields:** `metadata`
- **Expand Fields:** None

## Constructor

```javascript
new EdgeService()
```

No parameters required. Uses predefined configuration.

## Methods

### Inherited from BaseService

All standard CRUD operations are available:
- `getList(params)` - Get paginated edge list
- `getById(id)` - Get single edge
- `create(edge)` - Create new edge
- `update(id, edge)` - Update existing edge
- `delete(id)` - Delete edge

### updateEdgeMetadata(id, metadata, merge)

Updates edge metadata with optional merging.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | `string` | Yes | - | Edge ID |
| `metadata` | `Object` | Yes | - | Metadata to update |
| `merge` | `boolean` | No | `true` | Whether to merge with existing metadata |

**Returns:** `Promise<Object>`

```javascript
{
  data: Object // Updated edge with new metadata
}
```

**Usage:**
```javascript
// Merge with existing metadata
await edgeService.updateEdgeMetadata('edge-id-123', {
  location: { lat: 40.7128, lng: -74.0060 },
  capacity: 1000
})

// Replace all metadata
await edgeService.updateEdgeMetadata('edge-id-123', {
  newData: 'value'
}, false)
```

### getEdgeTypes()

Retrieves edge types from EdgeTypeService for dropdown options.

**Returns:** `Promise<Array>`

```javascript
[
  { label: "Building", value: "bld" },
  { label: "Data Center", value: "dc" },
  // ...
]
```

**Usage:**
```javascript
const edgeTypes = await edgeService.getEdgeTypes()
```

### getEdgeRegions()

Retrieves edge regions from EdgeRegionService for dropdown options.

**Returns:** `Promise<Array>`

```javascript
[
  { label: "North America", value: "na" },
  { label: "Europe", value: "eu" },
  // ...
]
```

**Usage:**
```javascript
const edgeRegions = await edgeService.getEdgeRegions()
```

### transformParams(transformedParams, originalParams)

Transforms query parameters for edge-specific filtering.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transformedParams` | `Object` | Yes | Parameters being transformed |
| `originalParams` | `Object` | Yes | Original input parameters |

**Supported Original Parameters:**
- `withMetadata`: Includes metadata fields in response
- `type`: Filters by edge type
- `region`: Filters by edge region

**Usage:**
```javascript
// Get edges with metadata
await edgeService.getList({ withMetadata: true })

// Filter by type
await edgeService.getList({ type: 'bld' })

// Filter by region
await edgeService.getList({ region: 'na' })
```

## Edge Code Utilities

### validateEdgeCode(code)

Validates edge code format following pattern: `[type]-[region]-[number]`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Edge code to validate |

**Returns:** `boolean`

**Valid Format:** 2-4 lowercase letters, hyphen, 2-4 lowercase letters, hyphen, 3-4 digits

**Usage:**
```javascript
import { validateEdgeCode } from '../services'

const isValid = validateEdgeCode('bld-na-001') // true
const isInvalid = validateEdgeCode('invalid') // false
```

### generateEdgeCode(type, region, number)

Generates edge code from components.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `string` | Yes | Edge type code (e.g., 'bld') |
| `region` | `string` | Yes | Region code (e.g., 'na') |
| `number` | `number` | Yes | Sequence number |

**Returns:** `string` - Formatted edge code

**Usage:**
```javascript
import { generateEdgeCode } from '../services'

const code = generateEdgeCode('bld', 'na', 1) // 'bld-na-001'
const code2 = generateEdgeCode('dc', 'eu', 42) // 'dc-eu-042'
```

## Usage Examples

### Create a New Edge

```javascript
import { edgeService } from '../services'

const newEdge = {
  type: 'bld',
  region: 'na', 
  number: 1,
  code: 'bld-na-001',
  name: 'Main Building',
  description: 'Primary office building',
  active: true,
  metadata: {
    floors: 5,
    capacity: 500,
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  }
}

const response = await edgeService.create(newEdge)
const createdEdge = response.data
```

### Update Edge Metadata

```javascript
// Add new metadata while preserving existing
await edgeService.updateEdgeMetadata('edge-id-123', {
  lastMaintenance: '2024-01-15',
  maintenanceSchedule: 'quarterly'
})

// Replace all metadata
await edgeService.updateEdgeMetadata('edge-id-123', {
  status: 'active',
  version: '2.0'
}, false)
```

### Filter Edges by Type and Region

```javascript
// Get all building edges in North America
const buildings = await edgeService.getList({
  type: 'bld',
  region: 'na',
  sort: 'name'
})

// Get edges with full metadata
const edgesWithMetadata = await edgeService.getList({
  withMetadata: true,
  sort: '-created'
})
```

### Retrieve Edge Details

```javascript
const response = await edgeService.getById('edge-id-123')
const edge = response.data

console.log(edge.name)
console.log(edge.metadata) // Automatically parsed from JSON
```

## Error Handling

The service handles common edge-specific errors:

```javascript
try {
  const edge = await edgeService.getById('invalid-id')
} catch (error) {
  if (error.response?.status === 404) {
    console.log('Edge not found')
  } else {
    console.error('Failed to fetch edge:', error.message)
  }
}
```

## Integration with Type Services

The EdgeService integrates with type management:

```javascript
// Get available types and regions for forms
const [edgeTypes, edgeRegions] = await Promise.all([
  edgeService.getEdgeTypes(),
  edgeService.getEdgeRegions()
])

// Use in dropdown components
<Dropdown 
  options={edgeTypes}
  optionLabel="label"
  optionValue="value"
/>
```

## Cache Behavior

- All operations respect the base caching strategy
- `getList()` and `getById()` are cached by default
- Cache is cleared after create/update/delete operations
- Use `skipCache: true` to bypass cache

```javascript
// Force fresh data
const freshEdges = await edgeService.getList({ skipCache: true })
```

## Organization Context

Edges are automatically scoped to the current user's organization:
- `create()` adds `organization_id` automatically
- `getList()` only returns edges from current organization
- PocketBase API rules enforce organization boundaries
