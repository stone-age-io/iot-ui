# Type Services API Documentation

## Overview

The Type Services manage entity type definitions across the IoT Platform. They provide CRUD operations for edge types, edge regions, location types, and thing types. All type services extend the base `TypeService` class for consistent functionality.

## TypeService (Base Class)

### Overview
Base service class for all type management. Provides common operations for type entities.

### Collection Schema
- **JSON Fields:** None
- **Expand Fields:** None

**Common Schema Fields:**
- `id`: Unique identifier (auto-generated)
- `type`: Display name of the type
- `code`: Unique code for the type
- `description`: Optional detailed description
- `created`: Creation timestamp (auto-generated)
- `updated`: Update timestamp (auto-generated)

### Constructor

```javascript
new TypeService(collectionName, options)
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collectionName` | `string` | Yes | PocketBase collection name |
| `options` | `Object` | No | Service configuration options |

### Methods

#### getTypes(params)

Gets a paginated list of types.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Object>`

#### getType(id)

Gets a single type by ID.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Type ID |

**Returns:** `Promise<Object>`

#### createType(type)

Creates a new type.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `Object` | Yes | Type data |

**Returns:** `Promise<Object>`

#### updateType(id, type)

Updates an existing type.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Type ID |
| `type` | `Object` | Yes | Updated type data |

**Returns:** `Promise<Object>`

#### deleteType(id)

Deletes a type.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Type ID |

**Returns:** `Promise<Object>`

#### isCodeInUse(code, excludeId)

Checks if a type code is already in use.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Type code to check |
| `excludeId` | `string` | No | ID to exclude from check |

**Returns:** `Promise<boolean>` - True if code is in use

**Usage:**
```javascript
const isUsed = await typeService.isCodeInUse('new-code')
if (isUsed) {
  console.error('Code already in use')
}
```

---

## EdgeTypeService

### Overview
Manages edge type definitions (e.g., Building, Data Center, Server).

### Collection
- **Collection:** `edge_types`

### Constructor

```javascript
new EdgeTypeService()
```

### Methods

#### getTypeOptions()

Gets all active edge types formatted for dropdown options.

**Returns:** `Promise<Array>`

```javascript
[
  { label: "Building", value: "bld" },
  { label: "Data Center", value: "dc" },
  { label: "Server", value: "srv" },
  // ...
]
```

**Usage:**
```javascript
const edgeTypes = await edgeTypeService.getTypeOptions()
// Use in dropdown component
```

#### validateCode(code)

Validates edge type code format.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Code to validate |

**Returns:** `boolean` - True if valid

**Format:** 2-4 lowercase letters

**Usage:**
```javascript
const isValid = edgeTypeService.validateCode('bld') // true
const isInvalid = edgeTypeService.validateCode('BUILDING') // false
```

---

## EdgeRegionService

### Overview
Manages edge region definitions (e.g., North America, Europe, Asia).

### Collection
- **Collection:** `edge_regions`

### Constructor

```javascript
new EdgeRegionService()
```

### Methods

#### getRegionOptions()

Gets all active edge regions formatted for dropdown options.

**Returns:** `Promise<Array>`

```javascript
[
  { label: "North America", value: "na" },
  { label: "Europe", value: "eu" },
  { label: "Asia Pacific", value: "ap" },
  // ...
]
```

**Usage:**
```javascript
const edgeRegions = await edgeRegionService.getRegionOptions()
```

#### validateCode(code)

Validates edge region code format.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Code to validate |

**Returns:** `boolean` - True if valid

**Format:** 2-4 lowercase letters

---

## LocationTypeService

### Overview
Manages location type definitions (e.g., Meeting Room, Office, Warehouse).

### Collection
- **Collection:** `location_types`

### Constructor

```javascript
new LocationTypeService()
```

### Methods

#### getTypeOptions()

Gets all active location types formatted for dropdown options.

**Returns:** `Promise<Array>`

```javascript
[
  { label: "Meeting Room", value: "meeting-room" },
  { label: "Office", value: "office" },
  { label: "Warehouse", value: "warehouse" },
  // ...
]
```

#### validateCode(code)

Validates location type code format.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Code to validate |

**Returns:** `boolean` - True if valid

**Format:** Kebab-case (lowercase with hyphens)

**Usage:**
```javascript
const isValid = locationTypeService.validateCode('meeting-room') // true
const isInvalid = locationTypeService.validateCode('Meeting Room') // false
```

---

## ThingTypeService

### Overview
Manages thing (device) type definitions (e.g., Temperature Sensor, Camera, Reader).

### Collection
- **Collection:** `thing_types`

### Constructor

```javascript
new ThingTypeService()
```

### Methods

#### getTypeOptions()

Gets all active thing types formatted for dropdown options.

**Returns:** `Promise<Array>`

```javascript
[
  { label: "Temperature Sensor", value: "temperature-sensor" },
  { label: "Camera", value: "camera" },
  { label: "Reader", value: "reader" },
  // ...
]
```

#### getTypeAbbreviation(typeCode)

Gets abbreviated code for a thing type to use in thing codes.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Thing type code |

**Returns:** `string` - Abbreviated code

**Abbreviation Map:**
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

**Usage:**
```javascript
const abbrev = thingTypeService.getTypeAbbreviation('temperature-sensor')
// Returns: 'temp'
```

#### validateCode(code)

Validates thing type code format.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Code to validate |

**Returns:** `boolean` - True if valid

**Format:** Kebab-case (lowercase with hyphens)

## Usage Examples

### Creating Type Definitions

```javascript
// Create edge type
const newEdgeType = {
  type: 'Building',
  code: 'bld',
  description: 'Physical building installations'
}

const edgeType = await edgeTypeService.createType(newEdgeType)

// Create location type
const newLocationType = {
  type: 'Meeting Room',
  code: 'meeting-room',
  description: 'Conference and meeting spaces'
}

const locationType = await locationTypeService.createType(newLocationType)

// Create thing type
const newThingType = {
  type: 'Temperature Sensor',
  code: 'temperature-sensor',
  description: 'Environmental temperature monitoring device'
}

const thingType = await thingTypeService.createType(newThingType)
```

### Form Integration

```javascript
// Get type options for form dropdowns
const getFormTypeOptions = async () => {
  const [edgeTypes, edgeRegions, locationTypes, thingTypes] = await Promise.all([
    edgeTypeService.getTypeOptions(),
    edgeRegionService.getRegionOptions(),
    locationTypeService.getTypeOptions(),
    thingTypeService.getTypeOptions()
  ])
  
  return {
    edgeTypes,
    edgeRegions,
    locationTypes,
    thingTypes
  }
}

// Use in Vue component
const typeOptions = await getFormTypeOptions()
```

### Code Validation

```javascript
// Validate codes before creation
const validateTypeData = (typeData, service) => {
  const errors = []
  
  // Validate required fields
  if (!typeData.type) errors.push('Type name is required')
  if (!typeData.code) errors.push('Type code is required')
  
  // Validate code format
  if (typeData.code && !service.validateCode(typeData.code)) {
    errors.push('Invalid code format')
  }
  
  return errors
}

// Usage
const errors = validateTypeData(newEdgeType, edgeTypeService)
if (errors.length > 0) {
  console.error('Validation errors:', errors)
  return
}

// Check for duplicate codes
const isDuplicate = await edgeTypeService.isCodeInUse(newEdgeType.code)
if (isDuplicate) {
  console.error('Code already exists')
  return
}

await edgeTypeService.createType(newEdgeType)
```

### Bulk Type Management

```javascript
// Create multiple types
const createBulkTypes = async (types, service) => {
  const results = []
  
  for (const typeData of types) {
    try {
      // Validate code
      if (!service.validateCode(typeData.code)) {
        throw new Error(`Invalid code format: ${typeData.code}`)
      }
      
      // Check for duplicates
      const isDuplicate = await service.isCodeInUse(typeData.code)
      if (isDuplicate) {
        throw new Error(`Code already exists: ${typeData.code}`)
      }
      
      // Create type
      const result = await service.createType(typeData)
      results.push({ success: true, data: result.data })
    } catch (error) {
      results.push({ success: false, error: error.message, code: typeData.code })
    }
  }
  
  return results
}

// Example: Create multiple edge types
const edgeTypesToCreate = [
  { type: 'Building', code: 'bld', description: 'Physical buildings' },
  { type: 'Data Center', code: 'dc', description: 'Data center facilities' },
  { type: 'Gateway', code: 'gw', description: 'Network gateways' }
]

const results = await createBulkTypes(edgeTypesToCreate, edgeTypeService)
console.log('Bulk creation results:', results)
```

### Type Usage Analytics

```javascript
// Get type usage statistics
const getTypeUsageStats = async (typeService, entityService) => {
  const types = await typeService.getTypes()
  const stats = []
  
  for (const type of types.data.items) {
    // Get entities using this type
    const entities = await entityService.getList({
      type: type.code
    })
    
    stats.push({
      type: type.type,
      code: type.code,
      usageCount: entities.data.items.length,
      lastUsed: entities.data.items.length > 0 
        ? Math.max(...entities.data.items.map(e => new Date(e.created).getTime()))
        : null
    })
  }
  
  return stats.sort((a, b) => b.usageCount - a.usageCount)
}

// Get edge type usage
const edgeTypeStats = await getTypeUsageStats(edgeTypeService, edgeService)
console.log('Most used edge types:', edgeTypeStats.slice(0, 5))
```

### Type Migration

```javascript
// Migrate entities from old type to new type
const migrateEntityType = async (entityService, oldTypeCode, newTypeCode) => {
  // Get all entities with old type
  const entities = await entityService.getList({
    type: oldTypeCode
  })
  
  const results = []
  
  for (const entity of entities.data.items) {
    try {
      await entityService.update(entity.id, {
        type: newTypeCode
      })
      results.push({ success: true, entityId: entity.id })
    } catch (error) {
      results.push({ success: false, entityId: entity.id, error: error.message })
    }
  }
  
  return results
}

// Example: Migrate edge types
const migrationResults = await migrateEntityType(edgeService, 'old-code', 'new-code')
console.log(`Migrated ${migrationResults.filter(r => r.success).length} entities`)
```

### Integration with Entity Services

```javascript
// How entity services use type services
export class EdgeService extends BaseService {
  async getEdgeTypes() {
    return await edgeTypeService.getTypeOptions()
  }
  
  async getEdgeRegions() {
    return await edgeRegionService.getRegionOptions()
  }
  
  async validateEdgeData(edgeData) {
    const errors = []
    
    // Validate type exists
    const types = await this.getEdgeTypes()
    if (!types.find(t => t.value === edgeData.type)) {
      errors.push('Invalid edge type')
    }
    
    // Validate region exists
    const regions = await this.getEdgeRegions()
    if (!regions.find(r => r.value === edgeData.region)) {
      errors.push('Invalid edge region')
    }
    
    return errors
  }
}
```

## Error Handling

```javascript
// Comprehensive error handling for type operations
const handleTypeOperation = async (operation, context = '') => {
  try {
    return await operation()
  } catch (error) {
    switch (error.response?.status) {
      case 400:
        console.error(`Invalid type data${context}:`, error.response.data)
        break
      case 409:
        console.error(`Type conflict${context} (duplicate code?)`)
        break
      case 404:
        console.error(`Type not found${context}`)
        break
      default:
        console.error(`Type operation failed${context}:`, error.message)
    }
    throw error
  }
}

// Usage
try {
  await handleTypeOperation(
    () => edgeTypeService.createType(typeData),
    ' during edge type creation'
  )
} catch (error) {
  // Handle in UI
}
```

## Best Practices

1. **Code Validation**: Always validate codes before creation
2. **Duplicate Checking**: Check for existing codes to prevent conflicts
3. **Consistent Naming**: Use consistent naming conventions for codes
4. **Usage Tracking**: Monitor type usage before deletion
5. **Migration Planning**: Plan entity migration when changing types
6. **Validation Rules**: Implement appropriate validation for each type category

## Integration with Stores

Type services integrate with the TypesStore for centralized caching:

```javascript
// Store integration example
const typesStore = useTypesStore()

// Load types into store
await typesStore.loadEdgeTypes()
await typesStore.loadLocationTypes()

// Access from store
const edgeTypes = computed(() => typesStore.edgeTypes)
const getTypeName = (code) => typesStore.getTypeName(code, 'edgeTypes')
```
