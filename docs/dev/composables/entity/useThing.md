# useThing

## Overview

The `useThing` composable manages IoT device/thing entities with state tracking, position management, and comprehensive CRUD operations. It provides specialized functionality for managing IoT devices within the platform, including real-time state monitoring, spatial positioning, and device lifecycle management.

## Location

```
src/composables/useThing.js
```

## Purpose

- **Thing Entity Management**: Complete CRUD operations for IoT thing entities
- **State Tracking**: Real-time device state monitoring and management
- **Position Management**: Spatial positioning and coordinate tracking
- **Device Lifecycle**: Device provisioning, activation, and deactivation
- **Type Integration**: Seamless integration with thing types
- **Reactive Data**: Integration with caching system for optimal performance
- **Message Handling**: Integration with device messaging and telemetry
- **Navigation Helpers**: Consistent navigation patterns

## Dependencies

```javascript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  thingService, 
  generateThingCode, 
  validateThingCode,
  getThingTypeAbbreviation 
} from '@/services'
import { useApiOperation } from '@/composables/useApiOperation'
import { useTypesStore } from '@/stores/types'
import { useReactiveData } from '@/composables/useReactiveData'
```

## Returns

```javascript
{
  // State
  things: ComputedRef<Array>,
  loading: Ref<boolean>,
  error: Ref<string|null>,
  thingTypes: ComputedRef<Array>,
  
  // Helpers
  formatDate: Function,
  formatTime: Function,
  getTypeName: Function,
  getTypeClass: Function,
  getStateClass: Function,
  hasPosition: Function,
  validateThingCode: Function,
  generateThingCode: Function,
  
  // Operations
  fetchThings: Function,
  fetchThing: Function,
  createThing: Function,
  updateThing: Function,
  deleteThing: Function,
  updateThingPosition: Function,
  updateThingState: Function,
  activateThing: Function,
  deactivateThing: Function,
  
  // Navigation
  navigateToThingList: Function,
  navigateToThingDetail: Function,
  navigateToThingEdit: Function,
  navigateToThingCreate: Function
}
```

---

## State Properties

### things

Reactive computed reference to the list of things from cache.

**Type:** `ComputedRef<Array>`

**Description:** Returns cached thing data with automatic updates when cache is invalidated.

### loading

Reactive reference to loading state for thing operations.

**Type:** `Ref<boolean>`

### error

Reactive reference to error state for thing operations.

**Type:** `Ref<string|null>`

### thingTypes

Reactive computed reference to available thing types from the types store.

**Type:** `ComputedRef<Array>`

**Example Data:**

```javascript
[
  { id: '1', code: 'sensor', name: 'Sensor', description: 'Environmental sensor' },
  { id: '2', code: 'actuator', name: 'Actuator', description: 'Control actuator' },
  { id: '3', code: 'gateway', name: 'Gateway', description: 'Communication gateway' }
]
```

---

## Helper Methods

### formatDate(dateString)

Formats ISO date string for display.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateString` | `string` | Yes | ISO date string |

**Returns:** `string` - Formatted date or 'N/A' if invalid

### formatTime(dateObj)

Formats Date object as time for display.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateObj` | `Date` | Yes | Date object |

**Returns:** `string` - Formatted time (HH:mm:ss)

**Usage:**

```javascript
const { formatTime } = useThing()

const timeString = formatTime(new Date())
// Output: "14:30:45"
```

### getTypeName(typeCode)

Gets display name for thing type code.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Thing type code |

**Returns:** `string` - Type display name or the code if not found

### getTypeClass(typeCode)

Gets CSS class for thing type badge styling.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Thing type code |

**Returns:** `string` - CSS class name

### getStateClass(state)

Gets CSS class for thing state badge styling.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `string` | Yes | Thing state |

**Returns:** `string` - CSS class name for state visualization

**State Classes:**

```javascript
const stateClasses = {
  'online': 'bg-green-100 text-green-800',
  'offline': 'bg-red-100 text-red-800', 
  'idle': 'bg-yellow-100 text-yellow-800',
  'error': 'bg-red-100 text-red-800',
  'maintenance': 'bg-blue-100 text-blue-800'
}
```

**Usage:**

```vue
<template>
  <Badge 
    :value="thing.state"
    :class="getStateClass(thing.state)"
  />
</template>
```

### hasPosition(thing)

Checks if thing has position coordinates.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thing` | `Object` | Yes | Thing object |

**Returns:** `boolean` - True if position coordinates exist

**Usage:**

```javascript
const { hasPosition } = useThing()

if (hasPosition(device)) {
  console.log(`Device at: ${device.position.x}, ${device.position.y}`)
}
```

### validateThingCode(code)

Validates thing code format.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Thing code to validate |

**Returns:** `boolean` - True if valid format

**Validation Rules:**
- 3-30 characters
- Alphanumeric, hyphens, and underscores
- Must start with letter or number
- Cannot end with hyphen or underscore

### generateThingCode(typeCode, locationCode, sequence)

Generates a new thing code based on type, location, and sequence.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Thing type code |
| `locationCode` | `string` | No | Location code for context |
| `sequence` | `number` | No | Sequence number (auto-generated if not provided) |

**Returns:** `string` - Generated thing code

**Usage:**

```javascript
const { generateThingCode } = useThing()

// With location context
const code1 = generateThingCode('sensor', 'room-101', 1)
// Output: "SENS-R101-001"

// Without location context
const code2 = generateThingCode('actuator')
// Output: "ACT-001"
```

---

## Operation Methods

### fetchThings(params)

Fetches list of things with optional filtering.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Array>` - List of things

**Usage:**

```javascript
const { fetchThings } = useThing()

// Fetch all things
await fetchThings()

// Fetch with filters
await fetchThings({
  type: 'sensor',
  location_id: 'room-101',
  state: 'online',
  skipCache: true
})
```

### fetchThing(id)

Fetches a single thing by ID with expanded relationships.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |

**Returns:** `Promise<Object>` - Thing data

### createThing(thingData)

Creates a new thing.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thingData` | `Object` | Yes | Thing data to create |

**Required Fields:**
- `code`: Unique thing code
- `name`: Thing display name
- `type`: Thing type code
- `location_id`: Associated location ID

**Optional Fields:**
- `description`: Thing description
- `serial_number`: Device serial number
- `manufacturer`: Device manufacturer
- `model`: Device model
- `firmware_version`: Current firmware version
- `position`: Spatial position within location
- `metadata`: Device-specific metadata
- `state`: Initial state (default: 'offline')

**Returns:** `Promise<Object>` - Created thing data

**Usage:**

```javascript
const { createThing } = useThing()

const newThing = await createThing({
  code: 'SENS-R101-001',
  name: 'Temperature Sensor 001',
  type: 'sensor',
  location_id: 'room-101',
  description: 'Environmental temperature and humidity sensor',
  serial_number: 'TS2024001',
  manufacturer: 'SensorTech',
  model: 'TH-2000',
  firmware_version: '1.2.3',
  position: {
    x: 5.5,
    y: 2.8,
    z: 1.2
  },
  metadata: {
    measurement_interval: 30,
    accuracy: 0.1,
    range: { min: -40, max: 80 }
  }
})
```

### updateThing(id, thingData)

Updates an existing thing.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |
| `thingData` | `Object` | Yes | Thing data to update |

**Returns:** `Promise<Object>` - Updated thing data

### deleteThing(id, code)

Deletes a thing.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |
| `code` | `string` | Yes | Thing code for display |

**Returns:** `Promise<boolean>` - Success status

### updateThingPosition(id, position)

Updates thing's position coordinates.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |
| `position` | `Object` | Yes | Position coordinates |

**Position Object:**

```javascript
{
  x: number,     // X coordinate
  y: number,     // Y coordinate  
  z?: number,    // Z coordinate (optional)
  rotation?: number  // Rotation angle (optional)
}
```

**Returns:** `Promise<Object>` - Updated thing data

**Usage:**

```javascript
const { updateThingPosition } = useThing()

await updateThingPosition('thing-123', {
  x: 10.5,
  y: 8.2,
  z: 1.5,
  rotation: 45
})
```

### updateThingState(id, state, metadata)

Updates thing's operational state.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |
| `state` | `string` | Yes | New state |
| `metadata` | `Object` | No | Additional state metadata |

**Valid States:**
- `online`: Device is active and communicating
- `offline`: Device is not responding
- `idle`: Device is connected but not active
- `error`: Device has reported an error
- `maintenance`: Device is in maintenance mode

**Returns:** `Promise<Object>` - Updated thing data

**Usage:**

```javascript
const { updateThingState } = useThing()

// Simple state change
await updateThingState('thing-123', 'online')

// State change with metadata
await updateThingState('thing-123', 'error', {
  error_code: 'TEMP_OUT_OF_RANGE',
  error_message: 'Temperature sensor reading out of range',
  timestamp: new Date().toISOString()
})
```

### activateThing(id)

Activates a thing (sets state to online and performs activation steps).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |

**Returns:** `Promise<Object>` - Updated thing data

### deactivateThing(id)

Deactivates a thing (sets state to offline and performs deactivation steps).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |

**Returns:** `Promise<Object>` - Updated thing data

---

## Navigation Methods

### navigateToThingList(query)

Navigates to the thing list page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `Object` | No | Query parameters for filtering |

### navigateToThingDetail(id)

Navigates to thing detail page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |

### navigateToThingEdit(id)

Navigates to thing edit page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Thing ID |

### navigateToThingCreate(query)

Navigates to thing creation page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `Object` | No | Pre-fill data (e.g., location_id, type) |

---

## Usage Examples

### Thing Dashboard with State Monitoring

```vue
<template>
  <div class="thing-dashboard">
    <!-- Summary cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card v-for="state in stateSummary" :key="state.name">
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold" :class="state.color">
              {{ state.count }}
            </div>
            <div class="text-sm text-gray-600">{{ state.name }}</div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Things list with real-time updates -->
    <DataTable 
      :value="things" 
      :loading="loading"
      class="p-datatable-striped"
      :rowClass="getRowClass"
    >
      <Column field="code" header="Code" sortable />
      <Column field="name" header="Name" sortable />
      
      <Column field="type" header="Type">
        <template #body="{ data }">
          <Badge 
            :value="getTypeName(data.type)"
            :class="getTypeClass(data.type)"
          />
        </template>
      </Column>
      
      <Column field="state" header="Status">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <div 
              class="w-2 h-2 rounded-full"
              :class="getStateIndicatorClass(data.state)"
            ></div>
            <Badge 
              :value="data.state"
              :class="getStateClass(data.state)"
            />
          </div>
        </template>
      </Column>
      
      <Column field="last_seen" header="Last Seen">
        <template #body="{ data }">
          <div v-if="data.last_seen">
            <div>{{ formatDate(data.last_seen) }}</div>
            <div class="text-xs text-gray-500">
              {{ formatTime(new Date(data.last_seen)) }}
            </div>
          </div>
          <span v-else class="text-gray-400">Never</span>
        </template>
      </Column>
      
      <Column field="position" header="Position">
        <template #body="{ data }">
          <span v-if="hasPosition(data)">
            {{ data.position.x }}, {{ data.position.y }}
            <span v-if="data.position.z">, {{ data.position.z }}</span>
          </span>
          <span v-else class="text-gray-400">No position</span>
        </template>
      </Column>
      
      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button 
              icon="pi pi-eye"
              class="p-button-sm p-button-text"
              @click="navigateToThingDetail(data.id)"
            />
            <Button 
              icon="pi pi-edit"
              class="p-button-sm p-button-text"
              @click="navigateToThingEdit(data.id)"
            />
            <Button 
              :icon="data.state === 'online' ? 'pi pi-pause' : 'pi pi-play'"
              class="p-button-sm p-button-text"
              :class="data.state === 'online' ? 'p-button-warning' : 'p-button-success'"
              @click="toggleThingState(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useThing } from '@/composables/useThing'

const { 
  things, 
  loading,
  fetchThings,
  activateThing,
  deactivateThing,
  formatDate,
  formatTime,
  getTypeName,
  getTypeClass,
  getStateClass,
  hasPosition,
  navigateToThingDetail,
  navigateToThingEdit
} = useThing()

// State summary for dashboard cards
const stateSummary = computed(() => {
  const states = ['online', 'offline', 'idle', 'error']
  return states.map(state => ({
    name: state.charAt(0).toUpperCase() + state.slice(1),
    count: things.value.filter(thing => thing.state === state).length,
    color: getStateColor(state)
  }))
})

const getStateColor = (state) => {
  const colors = {
    online: 'text-green-600',
    offline: 'text-red-600',
    idle: 'text-yellow-600',
    error: 'text-red-600'
  }
  return colors[state] || 'text-gray-600'
}

const getStateIndicatorClass = (state) => {
  const classes = {
    online: 'bg-green-400 animate-pulse',
    offline: 'bg-red-400',
    idle: 'bg-yellow-400',
    error: 'bg-red-400 animate-ping'
  }
  return classes[state] || 'bg-gray-400'
}

const getRowClass = (data) => {
  if (data.state === 'error') return 'bg-red-50'
  if (data.state === 'offline') return 'bg-gray-50'
  return ''
}

const toggleThingState = async (thing) => {
  if (thing.state === 'online') {
    await deactivateThing(thing.id)
  } else {
    await activateThing(thing.id)
  }
}

// Auto-refresh every 30 seconds
let refreshInterval

onMounted(() => {
  fetchThings()
  refreshInterval = setInterval(() => {
    fetchThings({ skipCache: true })
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
```

### Thing Positioning on Floor Plan

```vue
<template>
  <div class="floor-plan-container">
    <!-- Floor plan image with positioned things -->
    <div 
      ref="floorPlanRef"
      class="relative bg-gray-100 border rounded-lg overflow-hidden"
      @click="handleFloorPlanClick"
    >
      <!-- Floor plan image -->
      <img 
        v-if="location.floorplan"
        :src="getFloorPlanUrl(location)"
        alt="Floor plan"
        class="w-full h-auto"
        @load="handleImageLoad"
      />
      
      <!-- Thing markers -->
      <div 
        v-for="thing in positionedThings" 
        :key="thing.id"
        class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        :style="getThingPosition(thing)"
        @click.stop="selectThing(thing)"
        @mousedown="startDrag(thing, $event)"
      >
        <!-- Thing marker -->
        <div 
          class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          :class="getStateIndicatorClass(thing.state)"
          :title="`${thing.name} (${thing.state})`"
        >
          <i class="pi pi-circle-fill text-xs"></i>
        </div>
        
        <!-- Thing label -->
        <div 
          v-if="selectedThing?.id === thing.id"
          class="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white rounded shadow-lg p-2 min-w-max z-10"
        >
          <div class="font-medium">{{ thing.name }}</div>
          <div class="text-xs text-gray-600">{{ thing.code }}</div>
          <div class="text-xs">
            <Badge 
              :value="thing.state"
              :class="getStateClass(thing.state)"
            />
          </div>
        </div>
      </div>
      
      <!-- Selection highlight -->
      <div 
        v-if="selectedThing && hasPosition(selectedThing)"
        class="absolute w-8 h-8 border-2 border-blue-500 rounded-full pointer-events-none"
        :style="getThingPosition(selectedThing, 8)"
      ></div>
    </div>
    
    <!-- Thing details panel -->
    <Card v-if="selectedThing" class="mt-4">
      <template #title>
        <div class="flex justify-between items-center">
          <span>{{ selectedThing.name }}</span>
          <Button 
            icon="pi pi-times"
            class="p-button-text p-button-sm"
            @click="selectedThing = null"
          />
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <strong>Code:</strong> {{ selectedThing.code }}
          </div>
          <div>
            <strong>Type:</strong> 
            <Badge 
              :value="getTypeName(selectedThing.type)"
              :class="getTypeClass(selectedThing.type)"
            />
          </div>
          <div>
            <strong>State:</strong>
            <Badge 
              :value="selectedThing.state"
              :class="getStateClass(selectedThing.state)"
            />
          </div>
          <div v-if="hasPosition(selectedThing)">
            <strong>Position:</strong>
            {{ selectedThing.position.x }}, {{ selectedThing.position.y }}
            <span v-if="selectedThing.position.z">, {{ selectedThing.position.z }}</span>
          </div>
        </div>
        
        <div class="flex gap-2 mt-4">
          <Button 
            label="View Details"
            @click="navigateToThingDetail(selectedThing.id)"
          />
          <Button 
            label="Edit"
            class="p-button-secondary"
            @click="navigateToThingEdit(selectedThing.id)"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useThing } from '@/composables/useThing'

const props = defineProps({
  location: { type: Object, required: true }
})

const { 
  things,
  updateThingPosition,
  getTypeName,
  getTypeClass,
  getStateClass,
  hasPosition,
  navigateToThingDetail,
  navigateToThingEdit
} = useThing()

const floorPlanRef = ref(null)
const selectedThing = ref(null)
const dragState = ref({
  isDragging: false,
  thing: null,
  startX: 0,
  startY: 0
})

// Things that have positions and belong to this location
const positionedThings = computed(() => {
  return things.value.filter(thing => 
    thing.location_id === props.location.id && hasPosition(thing)
  )
})

// Convert thing coordinates to CSS position
const getThingPosition = (thing, offset = 12) => {
  if (!hasPosition(thing) || !floorPlanRef.value) return {}
  
  const rect = floorPlanRef.value.getBoundingClientRect()
  const img = floorPlanRef.value.querySelector('img')
  
  if (!img) return {}
  
  // Calculate position as percentage of image dimensions
  const x = (thing.position.x / 100) * img.clientWidth
  const y = (thing.position.y / 100) * img.clientHeight
  
  return {
    left: `${x}px`,
    top: `${y}px`,
    zIndex: selectedThing.value?.id === thing.id ? 20 : 10
  }
}

const getStateIndicatorClass = (state) => {
  const classes = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    idle: 'bg-yellow-500',
    error: 'bg-red-500'
  }
  return classes[state] || 'bg-gray-500'
}

const selectThing = (thing) => {
  selectedThing.value = thing
}

// Handle click on floor plan to deselect
const handleFloorPlanClick = (event) => {
  if (event.target.tagName === 'IMG') {
    selectedThing.value = null
  }
}

// Drag functionality for repositioning things
const startDrag = (thing, event) => {
  dragState.value = {
    isDragging: true,
    thing,
    startX: event.clientX,
    startY: event.clientY
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', endDrag)
}

const handleDrag = (event) => {
  if (!dragState.value.isDragging) return
  
  // Update thing position based on mouse movement
  const deltaX = event.clientX - dragState.value.startX
  const deltaY = event.clientY - dragState.value.startY
  
  // Convert pixel movement to percentage
  const img = floorPlanRef.value?.querySelector('img')
  if (!img) return
  
  const xPercent = (deltaX / img.clientWidth) * 100
  const yPercent = (deltaY / img.clientHeight) * 100
  
  // Update thing position (optimistically)
  const thing = dragState.value.thing
  thing.position.x = Math.max(0, Math.min(100, thing.position.x + xPercent))
  thing.position.y = Math.max(0, Math.min(100, thing.position.y + yPercent))
  
  dragState.value.startX = event.clientX
  dragState.value.startY = event.clientY
}

const endDrag = async () => {
  if (!dragState.value.isDragging) return
  
  const thing = dragState.value.thing
  
  // Save new position to server
  await updateThingPosition(thing.id, {
    x: thing.position.x,
    y: thing.position.y,
    z: thing.position.z
  })
  
  dragState.value.isDragging = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
}

const handleImageLoad = () => {
  // Force re-calculation of positions after image loads
  // This ensures things are positioned correctly
}

onMounted(() => {
  // Load things for this location
})
</script>
```

---

## Best Practices

### 1. Use State Classes for Visual Feedback

```vue
<!-- ✅ Good - clear visual state indicators -->
<template>
  <div class="flex items-center gap-2">
    <div 
      class="w-3 h-3 rounded-full"
      :class="{
        'bg-green-500 animate-pulse': thing.state === 'online',
        'bg-red-500': thing.state === 'offline',
        'bg-yellow-500': thing.state === 'idle',
        'bg-red-500 animate-ping': thing.state === 'error'
      }"
    ></div>
    <Badge :value="thing.state" :class="getStateClass(thing.state)" />
  </div>
</template>
```

### 2. Validate Positions Before Updates

```javascript
// ✅ Good - validate coordinates
const updatePosition = async (thingId, newPosition) => {
  // Validate coordinates are within bounds
  if (newPosition.x < 0 || newPosition.x > 100 ||
      newPosition.y < 0 || newPosition.y > 100) {
    throw new Error('Position coordinates must be between 0 and 100')
  }
  
  return updateThingPosition(thingId, newPosition)
}
```

### 3. Handle Real-time Updates

```javascript
// ✅ Good - auto-refresh for real-time monitoring
const { fetchThings } = useThing()

// Set up auto-refresh for thing states
const startMonitoring = () => {
  const interval = setInterval(() => {
    fetchThings({ skipCache: true, stateOnly: true })
  }, 30000) // Every 30 seconds
  
  return interval
}

onMounted(() => {
  const monitoringInterval = startMonitoring()
  
  onUnmounted(() => {
    clearInterval(monitoringInterval)
  })
})
```

### 4. Use Proper Code Generation

```javascript
// ✅ Good - context-aware code generation
const { generateThingCode } = useThing()

const createThingWithCode = async (thingData) => {
  if (!thingData.code) {
    // Generate code based on type and location
    thingData.code = generateThingCode(
      thingData.type, 
      thingData.location_code
    )
  }
  
  return createThing(thingData)
}
```

### 5. Manage Device Lifecycle Properly

```javascript
// ✅ Good - proper activation/deactivation
const { activateThing, deactivateThing } = useThing()

const handleDeviceProvisioning = async (deviceData) => {
  // Create device in inactive state
  const device = await createThing({
    ...deviceData,
    state: 'offline'
  })
  
  // Perform activation steps
  try {
    await activateThing(device.id)
    console.log('Device activated successfully')
  } catch (error) {
    console.error('Failed to activate device:', error)
    // Device remains in offline state
  }
}
```

The `useThing` composable provides comprehensive IoT device management with specialized support for state monitoring, spatial positioning, and device lifecycle management, making it ideal for complex IoT deployments and real-time monitoring scenarios.
