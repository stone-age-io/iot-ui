# useEdge

## Overview

The `useEdge` composable manages edge entities with comprehensive CRUD operations, formatting helpers, validation utilities, and navigation methods. It integrates with the reactive data caching system and provides edge-specific business logic for the IoT platform.

## Location

```
src/composables/useEdge.js
```

## Purpose

- **Edge Entity Management**: Complete CRUD operations for edge entities
- **Reactive Data**: Integration with caching system for optimal performance
- **Type Integration**: Seamless integration with edge types and regions
- **Metadata Handling**: Specialized metadata operations for edge configuration
- **Validation Utilities**: Edge code validation and generation
- **Navigation Helpers**: Consistent navigation patterns
- **Formatting Utilities**: Display helpers for edge data

## Dependencies

```javascript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { edgeService, validateEdgeCode, generateEdgeCode } from '@/services'
import { useApiOperation } from '@/composables/useApiOperation'
import { useTypesStore } from '@/stores/types'
import { useReactiveData } from '@/composables/useReactiveData'
```

## Returns

```javascript
{
  // State
  edges: ComputedRef<Array>,
  loading: Ref<boolean>,
  error: Ref<string|null>,
  edgeTypes: ComputedRef<Array>,
  edgeRegions: ComputedRef<Array>,
  
  // Helpers
  formatDate: Function,
  getTypeName: Function,
  getRegionName: Function,
  getTypeClass: Function,
  getRegionClass: Function,
  validateEdgeCode: Function,
  generateEdgeCode: Function,
  
  // Operations
  fetchEdges: Function,
  fetchEdge: Function,
  createEdge: Function,
  updateEdge: Function,
  deleteEdge: Function,
  updateEdgeMetadata: Function,
  
  // Navigation
  navigateToEdgeList: Function,
  navigateToEdgeDetail: Function,
  navigateToEdgeEdit: Function,
  navigateToEdgeCreate: Function,
  navigateToLocations: Function,
  navigateToCreateLocation: Function
}
```

---

## State Properties

### edges

Reactive computed reference to the list of edges from cache.

**Type:** `ComputedRef<Array>`

**Description:** Returns the cached edge data, automatically updated when cache is invalidated.

### loading

Reactive reference to loading state for edge operations.

**Type:** `Ref<boolean>`

### error

Reactive reference to error state for edge operations.

**Type:** `Ref<string|null>`

### edgeTypes

Reactive computed reference to available edge types from the types store.

**Type:** `ComputedRef<Array>`

**Example Data:**

```javascript
[
  { id: '1', code: 'bld', name: 'Building', description: 'Building edge server' },
  { id: '2', code: 'dc', name: 'Data Center', description: 'Data center edge' }
]
```

### edgeRegions

Reactive computed reference to available edge regions from the types store.

**Type:** `ComputedRef<Array>`

**Example Data:**

```javascript
[
  { id: '1', code: 'na', name: 'North America', description: 'North America region' },
  { id: '2', code: 'eu', name: 'Europe', description: 'Europe region' }
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

**Usage:**

```javascript
const { formatDate } = useEdge()

const formattedDate = formatDate('2024-01-15T10:30:00Z')
// Output: "Jan 15, 2024 10:30"
```

### getTypeName(typeCode)

Gets display name for edge type code.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Edge type code |

**Returns:** `string` - Type display name or the code if not found

**Usage:**

```javascript
const { getTypeName } = useEdge()

const typeName = getTypeName('bld')
// Output: "Building"
```

### getRegionName(regionCode)

Gets display name for edge region code.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionCode` | `string` | Yes | Edge region code |

**Returns:** `string` - Region display name or the code if not found

### getTypeClass(typeCode)

Gets CSS class for edge type badge styling.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Edge type code |

**Returns:** `string` - CSS class name

**Usage:**

```vue
<template>
  <Badge 
    :value="getTypeName(edge.type)" 
    :class="getTypeClass(edge.type)"
  />
</template>
```

### getRegionClass(regionCode)

Gets CSS class for edge region badge styling.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionCode` | `string` | Yes | Edge region code |

**Returns:** `string` - CSS class name

### validateEdgeCode(code)

Validates edge code format.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Edge code to validate |

**Returns:** `boolean` - True if valid format

**Validation Rules:**
- 3-20 characters
- Alphanumeric and hyphens only
- Must start with letter
- Cannot end with hyphen

**Usage:**

```javascript
const { validateEdgeCode } = useEdge()

const isValid = validateEdgeCode('EDG-001')  // true
const isInvalid = validateEdgeCode('123')    // false
```

### generateEdgeCode(typeCode, regionCode, sequence)

Generates a new edge code based on type, region, and sequence.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeCode` | `string` | Yes | Edge type code |
| `regionCode` | `string` | Yes | Edge region code |
| `sequence` | `number` | No | Sequence number (auto-generated if not provided) |

**Returns:** `string` - Generated edge code

**Usage:**

```javascript
const { generateEdgeCode } = useEdge()

const newCode = generateEdgeCode('bld', 'na', 1)
// Output: "BLD-NA-001"
```

---

## Operation Methods

### fetchEdges(params)

Fetches list of edges with optional filtering.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Array>` - List of edges

**Usage:**

```javascript
const { fetchEdges } = useEdge()

// Fetch all edges
await fetchEdges()

// Fetch with filters
await fetchEdges({
  type: 'bld',
  region: 'na',
  skipCache: true
})
```

### fetchEdge(id)

Fetches a single edge by ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Edge ID |

**Returns:** `Promise<Object>` - Edge data

**Usage:**

```javascript
const { fetchEdge } = useEdge()

const edge = await fetchEdge('edge-123')
console.log(edge.code) // Access edge properties
```

### createEdge(edgeData)

Creates a new edge.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `edgeData` | `Object` | Yes | Edge data to create |

**Required Fields:**
- `code`: Unique edge code
- `name`: Edge display name
- `type`: Edge type code
- `region`: Edge region code

**Optional Fields:**
- `description`: Edge description
- `metadata`: Edge metadata object
- `location`: Physical location details

**Returns:** `Promise<Object>` - Created edge data

**Usage:**

```javascript
const { createEdge } = useEdge()

const newEdge = await createEdge({
  code: 'BLD-NA-001',
  name: 'Building North America 1',
  type: 'bld',
  region: 'na',
  description: 'Primary building edge server',
  metadata: {
    capacity: 100,
    protocol: 'mqtt'
  }
})
```

### updateEdge(id, edgeData)

Updates an existing edge.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Edge ID |
| `edgeData` | `Object` | Yes | Edge data to update |

**Returns:** `Promise<Object>` - Updated edge data

**Usage:**

```javascript
const { updateEdge } = useEdge()

const updatedEdge = await updateEdge('edge-123', {
  name: 'Updated Edge Name',
  description: 'Updated description'
})
```

### deleteEdge(id, code)

Deletes an edge.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Edge ID |
| `code` | `string` | Yes | Edge code for display in confirmation |

**Returns:** `Promise<boolean>` - Success status

**Usage:**

```javascript
const { deleteEdge } = useEdge()

const success = await deleteEdge('edge-123', 'BLD-NA-001')
if (success) {
  console.log('Edge deleted successfully')
}
```

### updateEdgeMetadata(id, metadata, merge)

Updates edge metadata specifically.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | `string` | Yes | - | Edge ID |
| `metadata` | `Object` | Yes | - | Metadata object |
| `merge` | `boolean` | No | `true` | Whether to merge with existing metadata |

**Returns:** `Promise<Object>` - Updated edge data

**Usage:**

```javascript
const { updateEdgeMetadata } = useEdge()

// Merge with existing metadata
await updateEdgeMetadata('edge-123', {
  capacity: 200,
  lastMaintenance: '2024-01-15'
})

// Replace all metadata
await updateEdgeMetadata('edge-123', {
  status: 'active',
  version: '2.0'
}, false)
```

---

## Navigation Methods

### navigateToEdgeList(query)

Navigates to the edge list page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `Object` | No | Query parameters for the route |

**Usage:**

```javascript
const { navigateToEdgeList } = useEdge()

// Navigate to list
navigateToEdgeList()

// Navigate with filters
navigateToEdgeList({ type: 'bld', region: 'na' })
```

### navigateToEdgeDetail(id)

Navigates to edge detail page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Edge ID |

**Usage:**

```javascript
const { navigateToEdgeDetail } = useEdge()

navigateToEdgeDetail('edge-123')
```

### navigateToEdgeEdit(id)

Navigates to edge edit page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Edge ID |

### navigateToEdgeCreate(query)

Navigates to edge creation page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `Object` | No | Pre-fill data for the form |

### navigateToLocations(edgeId)

Navigates to locations list filtered by edge.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `edgeId` | `string` | Yes | Edge ID for filtering |

### navigateToCreateLocation(edgeId)

Navigates to create location page with edge pre-selected.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `edgeId` | `string` | Yes | Edge ID to pre-select |

---

## Usage Examples

### Basic Edge Management

```vue
<template>
  <div>
    <!-- Edge list -->
    <DataTable :value="edges" :loading="loading">
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
      <Column field="created" header="Created">
        <template #body="{ data }">
          {{ formatDate(data.created) }}
        </template>
      </Column>
      <Column header="Actions">
        <template #body="{ data }">
          <Button 
            icon="pi pi-eye"
            class="p-button-sm"
            @click="navigateToEdgeDetail(data.id)"
          />
          <Button 
            icon="pi pi-edit"
            class="p-button-sm p-button-warning"
            @click="navigateToEdgeEdit(data.id)"
          />
          <Button 
            icon="pi pi-trash"
            class="p-button-sm p-button-danger"
            @click="handleDelete(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useEdge } from '@/composables/useEdge'
import { useConfirmation } from '@/composables/useConfirmation'

const { 
  edges, 
  loading, 
  fetchEdges, 
  deleteEdge,
  formatDate,
  getTypeName,
  getTypeClass,
  navigateToEdgeDetail,
  navigateToEdgeEdit
} = useEdge()

const { confirmDelete, deleteDialog, showDeleteDialog } = useConfirmation()

onMounted(() => {
  fetchEdges()
})

const handleDelete = (edge) => {
  confirmDelete(edge, 'Edge', 'code')
}

const confirmDeleteEdge = async () => {
  if (deleteDialog.value.item) {
    await deleteEdge(deleteDialog.value.item.id, deleteDialog.value.item.code)
  }
}
</script>
```

### Edge Form Component

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Code field -->
      <div>
        <label class="block text-sm font-medium mb-2">Code</label>
        <InputText
          v-model="form.code"
          :class="{ 'p-invalid': v$.code.$error }"
          placeholder="e.g., BLD-NA-001"
        />
        <small v-if="v$.code.$error" class="p-error">
          {{ v$.code.$errors[0].$message }}
        </small>
      </div>
      
      <!-- Name field -->
      <div>
        <label class="block text-sm font-medium mb-2">Name</label>
        <InputText
          v-model="form.name"
          :class="{ 'p-invalid': v$.name.$error }"
        />
      </div>
      
      <!-- Type dropdown -->
      <div>
        <label class="block text-sm font-medium mb-2">Type</label>
        <Dropdown
          v-model="form.type"
          :options="edgeTypes"
          optionLabel="name"
          optionValue="code"
          placeholder="Select type"
          :class="{ 'p-invalid': v$.type.$error }"
        />
      </div>
      
      <!-- Region dropdown -->
      <div>
        <label class="block text-sm font-medium mb-2">Region</label>
        <Dropdown
          v-model="form.region"
          :options="edgeRegions"
          optionLabel="name"
          optionValue="code"
          placeholder="Select region"
          :class="{ 'p-invalid': v$.region.$error }"
        />
      </div>
      
      <!-- Description -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium mb-2">Description</label>
        <Textarea
          v-model="form.description"
          rows="3"
          class="w-full"
        />
      </div>
      
      <!-- Metadata -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium mb-2">Metadata</label>
        <Textarea
          v-model="metadataJson"
          rows="5"
          class="w-full font-mono"
          placeholder='{"key": "value"}'
        />
      </div>
    </div>
    
    <!-- Actions -->
    <div class="flex gap-2 mt-6">
      <Button 
        type="submit"
        :loading="loading"
        :label="mode === 'create' ? 'Create Edge' : 'Update Edge'"
      />
      <Button 
        type="button"
        class="p-button-secondary"
        label="Generate Code"
        @click="generateCode"
        v-if="mode === 'create'"
      />
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useEdge } from '@/composables/useEdge'

const props = defineProps({
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: () => ({}) }
})

const { 
  edgeTypes, 
  edgeRegions, 
  createEdge, 
  updateEdge,
  validateEdgeCode,
  generateEdgeCode,
  loading 
} = useEdge()

// Form state
const form = ref({
  code: '',
  name: '',
  type: '',
  region: '',
  description: '',
  metadata: {}
})

// Metadata as JSON string for editing
const metadataJson = ref('{}')

// Validation rules
const rules = {
  code: { 
    required,
    validFormat: helpers.withMessage('Invalid code format', validateEdgeCode)
  },
  name: { required },
  type: { required },
  region: { required }
}

const v$ = useVuelidate(rules, form)

// Watch metadata JSON for parsing
watch(metadataJson, (newValue) => {
  try {
    form.value.metadata = JSON.parse(newValue)
  } catch (e) {
    // Invalid JSON, keep previous value
  }
})

// Generate code based on type and region
const generateCode = () => {
  if (form.value.type && form.value.region) {
    form.value.code = generateEdgeCode(form.value.type, form.value.region)
  }
}

// Form submission
const handleSubmit = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  if (props.mode === 'create') {
    await createEdge(form.value)
  } else {
    await updateEdge(props.initialData.id, form.value)
  }
}

// Initialize form with provided data
if (props.initialData) {
  Object.assign(form.value, props.initialData)
  metadataJson.value = JSON.stringify(props.initialData.metadata || {}, null, 2)
}
</script>
```

### Edge Detail with Metadata Management

```vue
<template>
  <div v-if="edge">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ edge.name }}</h1>
        <p class="text-gray-600">{{ edge.code }}</p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Edit"
          icon="pi pi-edit"
          @click="navigateToEdgeEdit(edge.id)"
        />
        <Button 
          label="Locations"
          icon="pi pi-map"
          class="p-button-secondary"
          @click="navigateToLocations(edge.id)"
        />
      </div>
    </div>
    
    <!-- Basic info -->
    <Card class="mb-6">
      <template #title>Basic Information</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>Type:</strong>
            <Badge 
              :value="getTypeName(edge.type)"
              :class="getTypeClass(edge.type)"
              class="ml-2"
            />
          </div>
          <div>
            <strong>Region:</strong>
            <Badge 
              :value="getRegionName(edge.region)"
              :class="getRegionClass(edge.region)"
              class="ml-2"
            />
          </div>
          <div>
            <strong>Created:</strong> {{ formatDate(edge.created) }}
          </div>
          <div>
            <strong>Updated:</strong> {{ formatDate(edge.updated) }}
          </div>
        </div>
        
        <div v-if="edge.description" class="mt-4">
          <strong>Description:</strong>
          <p class="mt-1">{{ edge.description }}</p>
        </div>
      </template>
    </Card>
    
    <!-- Metadata management -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <span>Metadata</span>
          <Button 
            label="Edit Metadata"
            icon="pi pi-edit"
            class="p-button-sm"
            @click="showMetadataEditor = true"
          />
        </div>
      </template>
      <template #content>
        <pre v-if="edge.metadata" class="bg-gray-100 p-4 rounded overflow-auto">
{{ JSON.stringify(edge.metadata, null, 2) }}
        </pre>
        <p v-else class="text-gray-500">No metadata configured</p>
      </template>
    </Card>
    
    <!-- Metadata editor dialog -->
    <Dialog 
      v-model:visible="showMetadataEditor"
      header="Edit Metadata"
      :style="{ width: '50vw' }"
    >
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Metadata JSON</label>
        <Textarea
          v-model="metadataJson"
          rows="15"
          class="w-full font-mono"
          :class="{ 'p-invalid': !isValidJson }"
        />
        <small v-if="!isValidJson" class="p-error">
          Invalid JSON format
        </small>
      </div>
      
      <template #footer>
        <Button 
          label="Cancel"
          icon="pi pi-times"
          class="p-button-text"
          @click="showMetadataEditor = false"
        />
        <Button 
          label="Save"
          icon="pi pi-check"
          :disabled="!isValidJson"
          @click="saveMetadata"
          :loading="loading"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEdge } from '@/composables/useEdge'

const route = useRoute()
const { 
  fetchEdge, 
  updateEdgeMetadata,
  formatDate,
  getTypeName,
  getRegionName,
  getTypeClass,
  getRegionClass,
  navigateToEdgeEdit,
  navigateToLocations,
  loading
} = useEdge()

const edge = ref(null)
const showMetadataEditor = ref(false)
const metadataJson = ref('{}')

const isValidJson = computed(() => {
  try {
    JSON.parse(metadataJson.value)
    return true
  } catch {
    return false
  }
})

const loadEdge = async () => {
  edge.value = await fetchEdge(route.params.id)
  if (edge.value) {
    metadataJson.value = JSON.stringify(edge.value.metadata || {}, null, 2)
  }
}

const saveMetadata = async () => {
  if (!isValidJson.value) return
  
  const metadata = JSON.parse(metadataJson.value)
  const updatedEdge = await updateEdgeMetadata(edge.value.id, metadata, false)
  
  if (updatedEdge) {
    edge.value = updatedEdge
    showMetadataEditor.value = false
  }
}

onMounted(loadEdge)
</script>
```

---

## Best Practices

### 1. Use Reactive Data for Lists

```javascript
// ✅ Good - uses reactive data with caching
const { edges } = useEdge()

// Edges are automatically updated when cache is invalidated
watchEffect(() => {
  console.log('Edges updated:', edges.value.length)
})
```

### 2. Leverage Helper Functions

```vue
<!-- ✅ Good - uses helper functions -->
<template>
  <div>
    <Badge 
      :value="getTypeName(edge.type)" 
      :class="getTypeClass(edge.type)"
    />
    <span>{{ formatDate(edge.created) }}</span>
  </div>
</template>

<!-- ❌ Avoid - manual formatting -->
<template>
  <div>
    <Badge :value="edge.type" />
    <span>{{ new Date(edge.created).toLocaleDateString() }}</span>
  </div>
</template>
```

### 3. Use Navigation Helpers

```javascript
// ✅ Good - consistent navigation
const { navigateToEdgeDetail } = useEdge()
navigateToEdgeDetail(edge.id)

// ❌ Avoid - manual router usage
router.push({ name: 'edge-detail', params: { id: edge.id } })
```

### 4. Handle Metadata Properly

```javascript
// ✅ Good - merge metadata safely
await updateEdgeMetadata(edgeId, {
  newProperty: 'value'
}, true) // Merge with existing

// ✅ Good - replace metadata completely
await updateEdgeMetadata(edgeId, {
  status: 'active',
  version: '2.0'
}, false) // Replace all metadata
```

### 5. Validate Edge Codes

```javascript
// ✅ Good - validate before creation
const { validateEdgeCode, generateEdgeCode } = useEdge()

const createNewEdge = (formData) => {
  if (!validateEdgeCode(formData.code)) {
    // Generate a valid code
    formData.code = generateEdgeCode(formData.type, formData.region)
  }
  
  return createEdge(formData)
}
```

The `useEdge` composable provides a comprehensive solution for managing edge entities in the IoT platform, with robust caching, validation, and navigation capabilities that ensure consistent behavior across the application.
