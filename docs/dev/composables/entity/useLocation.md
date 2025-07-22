# useLocation

## Overview

The `useLocation` composable manages location entities with hierarchical support, floor plan handling, path management, and comprehensive CRUD operations. It provides specialized functionality for managing physical locations within edge installations, including parent-child relationships and spatial data.

## Location

```
src/composables/useLocation.js
```

## Purpose

- **Location Entity Management**: Complete CRUD operations for location entities
- **Hierarchical Support**: Parent-child location relationships
- **Floor Plan Management**: Upload and display floor plan images
- **Path Management**: Location path parsing and formatting
- **Reactive Data**: Integration with caching system
- **Type Integration**: Seamless integration with location types
- **Spatial Data**: Coordinate and position management
- **Navigation Helpers**: Consistent navigation patterns

## Dependencies

```javascript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { 
  locationService, 
  parseLocationPath, 
  validateLocationCode, 
  generateLocationCode, 
  computeLocationPath
} from '@/services'
import { useApiOperation } from '@/composables/useApiOperation'
import { useTypesStore } from '@/stores/types'
import { useReactiveData } from '@/composables/useReactiveData'
```

## Returns

```javascript
{
  // State
  locations: ComputedRef<Array>,
  childLocations: Ref<Array>,
  loading: Ref<boolean>,
  childrenLoading: Ref<boolean>,
  error: Ref<string|null>,
  locationTypeOptions: ComputedRef<Array>,
  
  // Helpers
  formatDate: Function,
  getTypeName: Function,
  getTypeClass: Function,
  formatPath: Function,
  getPathSegments: Function,
  hasMetadata: Function,
  hasFloorPlan: Function,
  hasParent: Function,
  getParentInfo: Function,
  parseLocationCode: Function,
  
  // Operations
  fetchLocations: Function,
  fetchLocation: Function,
  fetchChildLocations: Function,
  fetchRootLocations: Function,
  createLocation: Function,
  updateLocation: Function,
  deleteLocation: Function,
  uploadFloorPlan: Function,
  
  // Navigation
  navigateToLocationList: Function,
  navigateToLocationDetail: Function,
  navigateToLocationEdit: Function,
  navigateToLocationCreate: Function
}
```

---

## State Properties

### locations

Reactive computed reference to the list of locations from cache.

**Type:** `ComputedRef<Array>`

**Description:** Returns cached location data with automatic updates when cache is invalidated.

### childLocations

Reactive array containing child locations for the currently selected parent.

**Type:** `Ref<Array>`

**Description:** Used for hierarchical location browsing and display.

### loading / childrenLoading

Reactive references to loading states for different operations.

**Type:** `Ref<boolean>`

- `loading`: General location operations
- `childrenLoading`: Child location fetching operations

### locationTypeOptions

Reactive computed reference to available location types from the types store.

**Type:** `ComputedRef<Array>`

**Example Data:**

```javascript
[
  { id: '1', code: 'room', name: 'Room', description: 'Meeting room or office' },
  { id: '2', code: 'floor', name: 'Floor', description: 'Building floor' },
  { id: '3', code: 'zone', name: 'Zone', description: 'Area within a floor' }
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

### getTypeName(typeCode)

Gets display name for location type code.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Location type code |

**Returns:** `string` - Type display name or the code if not found

### getTypeClass(typeCode)

Gets CSS class for location type badge styling.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Location type code |

**Returns:** `string` - CSS class name

### formatPath(path)

Formats location path for display with breadcrumb-style separators.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Location path (e.g., "floor1/room101") |

**Returns:** `string` - Formatted path (e.g., "floor1 > room101")

**Usage:**

```javascript
const { formatPath } = useLocation()

const formattedPath = formatPath('building/floor2/room201')
// Output: "building > floor2 > room201"
```

### getPathSegments(path)

Parses location path into segments with navigation data.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Location path |

**Returns:** `Array` - Array of path segments

**Return Structure:**

```javascript
[
  {
    name: "building",
    path: "building",
    isLast: false
  },
  {
    name: "floor2", 
    path: "building/floor2",
    isLast: false
  },
  {
    name: "room201",
    path: "building/floor2/room201", 
    isLast: true
  }
]
```

**Usage:**

```vue
<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li 
        v-for="segment in getPathSegments(location.path)" 
        :key="segment.path"
        class="breadcrumb-item"
        :class="{ 'active': segment.isLast }"
      >
        <router-link 
          v-if="!segment.isLast"
          :to="{ name: 'locations', query: { path: segment.path } }"
        >
          {{ segment.name }}
        </router-link>
        <span v-else>{{ segment.name }}</span>
      </li>
    </ol>
  </nav>
</template>
```

### hasMetadata(location)

Checks if location has metadata.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | `Object` | Yes | Location object |

**Returns:** `boolean` - True if metadata exists and is not empty

### hasFloorPlan(location)

Checks if location has a floor plan file.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | `Object` | Yes | Location object |

**Returns:** `boolean` - True if floor plan exists

**Usage:**

```vue
<template>
  <div v-if="hasFloorPlan(location)">
    <img 
      :src="getFloorPlanUrl(location)" 
      alt="Floor plan"
      class="max-w-full h-auto"
    />
  </div>
  <div v-else class="text-gray-500">
    No floor plan available
  </div>
</template>
```

### hasParent(location)

Checks if location has a parent location.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | `Object` | Yes | Location object |

**Returns:** `boolean` - True if parent exists

### getParentInfo(location)

Gets parent location information from expanded data.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | `Object` | Yes | Location object with expanded parent_id |

**Returns:** `Object|null` - Parent info or null if no parent

**Return Structure:**

```javascript
{
  id: "parent-id",
  code: "parent-code", 
  name: "Parent Location",
  type: "floor"
}
```

### parseLocationCode(code)

Parses location code to extract type and number components.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Location code (e.g., "room-101") |

**Returns:** `Object` - Parsed components

**Return Structure:**

```javascript
{
  type: "room",     // Type portion before last hyphen
  number: "101"     // Number portion after last hyphen
}
```

**Usage:**

```javascript
const { parseLocationCode } = useLocation()

const parsed = parseLocationCode('meeting-room-205')
// Output: { type: "meeting-room", number: "205" }
```

---

## Operation Methods

### fetchLocations(params)

Fetches list of locations with optional filtering.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Array>` - List of locations

**Usage:**

```javascript
const { fetchLocations } = useLocation()

// Fetch all locations
await fetchLocations()

// Fetch with filters
await fetchLocations({
  edge_id: 'edge-123',
  type: 'room',
  skipCache: true
})
```

### fetchLocation(id)

Fetches a single location by ID with expanded relationships.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |

**Returns:** `Promise<Object>` - Location data with parsed metadata

**Usage:**

```javascript
const { fetchLocation } = useLocation()

const location = await fetchLocation('location-123')
console.log(location.metadata) // Automatically parsed JSON
```

### fetchChildLocations(parentId)

Fetches child locations for a given parent location.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parentId` | `string` | Yes | Parent location ID |

**Returns:** `Promise<Array>` - List of child locations

**Usage:**

```javascript
const { fetchChildLocations, childLocations } = useLocation()

await fetchChildLocations('floor-1')
console.log(childLocations.value) // Child locations array
```

### fetchRootLocations(params)

Fetches locations without parents (root level locations).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Additional query parameters |

**Returns:** `Promise<Array>` - List of root locations

**Usage:**

```javascript
const { fetchRootLocations } = useLocation()

const rootLocations = await fetchRootLocations({
  edge_id: 'edge-123'
})
```

### createLocation(locationData)

Creates a new location.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `locationData` | `Object` | Yes | Location data to create |

**Required Fields:**
- `code`: Unique location code
- `name`: Location display name
- `type`: Location type code
- `edge_id`: Associated edge ID

**Optional Fields:**
- `parent_id`: Parent location ID
- `description`: Location description
- `metadata`: Location metadata object
- `coordinates`: Spatial coordinates
- `floorplan`: Floor plan file

**Returns:** `Promise<Object>` - Created location data

**Usage:**

```javascript
const { createLocation } = useLocation()

const newLocation = await createLocation({
  code: 'room-101',
  name: 'Conference Room 101',
  type: 'meeting-room',
  edge_id: 'edge-123',
  parent_id: 'floor-1',
  description: 'Large conference room with projector',
  metadata: {
    capacity: 12,
    equipment: ['projector', 'whiteboard']
  },
  coordinates: {
    x: 10.5,
    y: 15.2,
    width: 5.0,
    height: 8.0
  }
})
```

### updateLocation(id, locationData)

Updates an existing location.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |
| `locationData` | `Object` | Yes | Location data to update |

**Returns:** `Promise<Object>` - Updated location data

### deleteLocation(id, code)

Deletes a location.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |
| `code` | `string` | Yes | Location code for display |

**Returns:** `Promise<boolean>` - Success status

### uploadFloorPlan(id, file)

Uploads a floor plan image for a location.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |
| `file` | `File` | Yes | Floor plan image file |

**Returns:** `Promise<Object>` - Updated location data

**Usage:**

```javascript
const { uploadFloorPlan } = useLocation()

const handleFileUpload = async (locationId, file) => {
  const formData = new FormData()
  formData.append('floorplan', file)
  
  const updatedLocation = await uploadFloorPlan(locationId, formData)
  console.log('Floor plan uploaded:', updatedLocation.floorplan)
}
```

---

## Navigation Methods

### navigateToLocationList(query)

Navigates to the location list page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `Object` | No | Query parameters for filtering |

### navigateToLocationDetail(id)

Navigates to location detail page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |

### navigateToLocationEdit(id)

Navigates to location edit page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Location ID |

### navigateToLocationCreate(query)

Navigates to location creation page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `Object` | No | Pre-fill data (e.g., edge_id, parent_id) |

---

## Usage Examples

### Hierarchical Location Browser

```vue
<template>
  <div class="location-browser">
    <!-- Breadcrumb navigation -->
    <nav class="mb-4" v-if="currentPath">
      <ol class="flex items-center space-x-2 text-sm">
        <li>
          <router-link 
            :to="{ name: 'locations' }"
            class="text-blue-600 hover:text-blue-800"
          >
            All Locations
          </router-link>
        </li>
        <li 
          v-for="segment in getPathSegments(currentPath)" 
          :key="segment.path"
          class="flex items-center"
        >
          <span class="mx-2">/</span>
          <router-link 
            v-if="!segment.isLast"
            :to="{ name: 'locations', query: { path: segment.path } }"
            class="text-blue-600 hover:text-blue-800"
          >
            {{ segment.name }}
          </router-link>
          <span v-else class="text-gray-500">{{ segment.name }}</span>
        </li>
      </ol>
    </nav>
    
    <!-- Current level locations -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card 
        v-for="location in currentLocations" 
        :key="location.id"
        class="cursor-pointer hover:shadow-lg transition-shadow"
        @click="handleLocationClick(location)"
      >
        <template #header>
          <div class="p-4 border-b">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-semibold">{{ location.name }}</h3>
                <p class="text-sm text-gray-600">{{ location.code }}</p>
              </div>
              <Badge 
                :value="getTypeName(location.type)"
                :class="getTypeClass(location.type)"
              />
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="space-y-2">
            <div v-if="location.description" class="text-sm">
              {{ location.description }}
            </div>
            
            <div class="flex justify-between text-xs text-gray-500">
              <span>{{ formatDate(location.created) }}</span>
              <span v-if="location.children_count > 0">
                {{ location.children_count }} child locations
              </span>
            </div>
            
            <!-- Floor plan thumbnail -->
            <div v-if="hasFloorPlan(location)" class="mt-2">
              <img 
                :src="getFloorPlanThumbnailUrl(location)"
                alt="Floor plan"
                class="w-full h-24 object-cover rounded"
              />
            </div>
          </div>
        </template>
        
        <template #footer>
          <div class="flex justify-between">
            <Button 
              icon="pi pi-eye"
              class="p-button-sm p-button-text"
              @click.stop="navigateToLocationDetail(location.id)"
            />
            <Button 
              icon="pi pi-edit"
              class="p-button-sm p-button-text"
              @click.stop="navigateToLocationEdit(location.id)"
            />
            <Button 
              icon="pi pi-plus"
              class="p-button-sm p-button-text"
              @click.stop="createChildLocation(location)"
              title="Add child location"
            />
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Add location button -->
    <Button 
      label="Add Location"
      icon="pi pi-plus"
      class="mt-4"
      @click="handleAddLocation"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocation } from '@/composables/useLocation'

const route = useRoute()
const router = useRouter()

const { 
  locations,
  childLocations,
  fetchLocations,
  fetchChildLocations,
  fetchRootLocations,
  getPathSegments,
  getTypeName,
  getTypeClass,
  formatDate,
  hasFloorPlan,
  navigateToLocationDetail,
  navigateToLocationEdit,
  navigateToLocationCreate
} = useLocation()

const currentPath = ref(route.query.path || '')
const currentParentId = ref(route.query.parent_id || null)

// Current locations to display (root or children)
const currentLocations = computed(() => {
  return currentParentId.value ? childLocations.value : locations.value
})

// Load locations based on current path/parent
const loadCurrentLocations = async () => {
  if (currentParentId.value) {
    await fetchChildLocations(currentParentId.value)
  } else {
    await fetchRootLocations()
  }
}

// Handle location click (navigate into hierarchy)
const handleLocationClick = (location) => {
  if (location.children_count > 0) {
    // Navigate to children
    router.push({
      name: 'locations',
      query: {
        parent_id: location.id,
        path: location.path
      }
    })
  } else {
    // Navigate to detail
    navigateToLocationDetail(location.id)
  }
}

// Handle add location
const handleAddLocation = () => {
  const query = {}
  if (currentParentId.value) {
    query.parent_id = currentParentId.value
  }
  if (route.query.edge_id) {
    query.edge_id = route.query.edge_id
  }
  
  navigateToLocationCreate(query)
}

// Create child location
const createChildLocation = (parentLocation) => {
  navigateToLocationCreate({
    parent_id: parentLocation.id,
    edge_id: parentLocation.edge_id
  })
}

// Watch route changes
watch(() => route.query, (newQuery) => {
  currentPath.value = newQuery.path || ''
  currentParentId.value = newQuery.parent_id || null
  loadCurrentLocations()
})

onMounted(loadCurrentLocations)
</script>
```

### Location Form with Spatial Coordinates

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Basic information -->
      <Card>
        <template #title>Basic Information</template>
        <template #content>
          <div class="space-y-4">
            <!-- Code -->
            <div>
              <label class="block text-sm font-medium mb-2">Code</label>
              <InputText
                v-model="form.code"
                :class="{ 'p-invalid': v$.code.$error }"
                placeholder="e.g., room-101"
              />
            </div>
            
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium mb-2">Name</label>
              <InputText
                v-model="form.name"
                :class="{ 'p-invalid': v$.name.$error }"
              />
            </div>
            
            <!-- Type -->
            <div>
              <label class="block text-sm font-medium mb-2">Type</label>
              <Dropdown
                v-model="form.type"
                :options="locationTypeOptions"
                optionLabel="name"
                optionValue="code"
                placeholder="Select type"
                :class="{ 'p-invalid': v$.type.$error }"
              />
            </div>
            
            <!-- Parent location -->
            <div>
              <label class="block text-sm font-medium mb-2">Parent Location</label>
              <Dropdown
                v-model="form.parent_id"
                :options="availableParents"
                optionLabel="name"
                optionValue="id"
                placeholder="No parent (root level)"
                filter
              />
            </div>
            
            <!-- Description -->
            <div>
              <label class="block text-sm font-medium mb-2">Description</label>
              <Textarea
                v-model="form.description"
                rows="3"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Spatial coordinates -->
      <Card>
        <template #title>Spatial Information</template>
        <template #content>
          <div class="space-y-4">
            <!-- Coordinates -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">X Position</label>
                <InputNumber
                  v-model="form.coordinates.x"
                  :step="0.1"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Y Position</label>
                <InputNumber
                  v-model="form.coordinates.y"
                  :step="0.1"
                  placeholder="0.0"
                />
              </div>
            </div>
            
            <!-- Dimensions -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Width</label>
                <InputNumber
                  v-model="form.coordinates.width"
                  :step="0.1"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Height</label>
                <InputNumber
                  v-model="form.coordinates.height"
                  :step="0.1"
                  placeholder="0.0"
                />
              </div>
            </div>
            
            <!-- Floor plan upload -->
            <div>
              <label class="block text-sm font-medium mb-2">Floor Plan</label>
              <FileUpload
                mode="basic"
                accept="image/*"
                :maxFileSize="5000000"
                @select="handleFileSelect"
                :auto="false"
                chooseLabel="Select Floor Plan"
              />
              <small class="text-gray-600">
                Supported formats: JPG, PNG, SVG (max 5MB)
              </small>
            </div>
            
            <!-- Floor plan preview -->
            <div v-if="floorPlanPreview" class="mt-4">
              <img 
                :src="floorPlanPreview"
                alt="Floor plan preview"
                class="max-w-full h-48 object-contain border rounded"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Actions -->
    <div class="flex gap-2 mt-6">
      <Button 
        type="submit"
        :loading="loading"
        :label="mode === 'create' ? 'Create Location' : 'Update Location'"
      />
      <Button 
        type="button"
        class="p-button-secondary"
        label="Cancel"
        @click="handleCancel"
      />
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { useLocation } from '@/composables/useLocation'

const props = defineProps({
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: () => ({}) },
  availableParents: { type: Array, default: () => [] }
})

const { 
  locationTypeOptions,
  createLocation,
  updateLocation,
  uploadFloorPlan,
  loading
} = useLocation()

// Form state
const form = ref({
  code: '',
  name: '',
  type: '',
  parent_id: null,
  description: '',
  coordinates: {
    x: null,
    y: null,
    width: null,
    height: null
  }
})

const selectedFile = ref(null)
const floorPlanPreview = ref(null)

// Validation rules
const rules = {
  code: { required },
  name: { required },
  type: { required }
}

const v$ = useVuelidate(rules, form)

// Handle file selection
const handleFileSelect = (event) => {
  const file = event.files[0]
  if (file) {
    selectedFile.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      floorPlanPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Form submission
const handleSubmit = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  let result
  if (props.mode === 'create') {
    result = await createLocation(form.value)
  } else {
    result = await updateLocation(props.initialData.id, form.value)
  }
  
  // Upload floor plan if selected
  if (result && selectedFile.value) {
    const formData = new FormData()
    formData.append('floorplan', selectedFile.value)
    await uploadFloorPlan(result.id, formData)
  }
}

const handleCancel = () => {
  // Navigate back or emit cancel event
}

// Initialize form with provided data
if (props.initialData) {
  Object.assign(form.value, props.initialData)
  
  if (props.initialData.coordinates) {
    Object.assign(form.value.coordinates, props.initialData.coordinates)
  }
}
</script>
```

---

## Best Practices

### 1. Use Hierarchical Data Efficiently

```javascript
// ✅ Good - separate loading for root and child locations
const loadLocations = async (parentId = null) => {
  if (parentId) {
    await fetchChildLocations(parentId)
  } else {
    await fetchRootLocations()
  }
}

// ❌ Avoid - loading all locations and filtering client-side
const loadLocations = async () => {
  const allLocations = await fetchLocations()
  const filtered = allLocations.filter(loc => loc.parent_id === parentId)
}
```

### 2. Handle Path Navigation Properly

```javascript
// ✅ Good - use path segments for navigation
const { getPathSegments } = useLocation()

const segments = getPathSegments(location.path)
segments.forEach(segment => {
  // Each segment has proper path for navigation
  console.log(segment.path) // Cumulative path to segment
})
```

### 3. Validate Spatial Data

```javascript
// ✅ Good - validate coordinates before submission
const validateCoordinates = (coords) => {
  return coords.x >= 0 && 
         coords.y >= 0 && 
         coords.width > 0 && 
         coords.height > 0
}

const createLocationWithValidation = async (locationData) => {
  if (locationData.coordinates && !validateCoordinates(locationData.coordinates)) {
    throw new Error('Invalid coordinates')
  }
  
  return createLocation(locationData)
}
```

### 4. Handle Floor Plans Appropriately

```javascript
// ✅ Good - check for floor plan before displaying
const { hasFloorPlan } = useLocation()

const displayFloorPlan = (location) => {
  if (hasFloorPlan(location)) {
    return locationService.getFloorPlanImageUrl(location)
  }
  return null
}
```

### 5. Use Metadata for Extended Properties

```javascript
// ✅ Good - structured metadata
const locationMetadata = {
  capacity: 12,
  equipment: ['projector', 'whiteboard', 'conference_phone'],
  accessibility: {
    wheelchair_accessible: true,
    hearing_loop: false
  },
  climate: {
    hvac_zone: 'A2',
    temperature_sensor: 'sensor-123'
  }
}

await createLocation({
  // ... basic fields
  metadata: locationMetadata
})
```

The `useLocation` composable provides comprehensive location management capabilities with special support for hierarchical relationships, spatial data, and floor plan management, making it ideal for complex facility management scenarios.
