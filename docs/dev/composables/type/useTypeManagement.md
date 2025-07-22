# useTypeManagement

## Overview

The `useTypeManagement` composable provides base functionality for all type management operations in the IoT platform. It serves as a foundation for specialized type composables (edge types, location types, thing types, etc.) and implements common patterns for CRUD operations, validation, and navigation.

## Location

```
src/composables/useTypeManagement.js
```

## Purpose

- **Base Type Operations**: Common CRUD operations for all type entities
- **Reactive Data Integration**: Caching and automatic updates
- **Validation Framework**: Code validation and uniqueness checking
- **Navigation Patterns**: Consistent navigation across all type management
- **Error Handling**: Standardized error handling for type operations
- **Extensibility**: Foundation for specialized type composables

## Dependencies

```javascript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { useApiOperation } from '@/composables/useApiOperation'
import { useTypesStore } from '@/stores/types'
import { useReactiveData } from '@/composables/useReactiveData'
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeService` | `Object` | Yes | Service instance for the specific type |
| `routeNames` | `Object` | Yes | Route names for navigation |
| `entityName` | `string` | Yes | Display name of the entity (e.g., 'Edge Type') |

### Route Names Structure

```javascript
{
  list: 'edge-types',          // List view route name
  detail: 'edge-type-detail',  // Detail view route name  
  create: 'create-edge-type',  // Create form route name
  edit: 'edit-edge-type'       // Edit form route name
}
```

## Returns

```javascript
{
  // State
  types: ComputedRef<Array>,
  loading: Ref<boolean>,
  error: Ref<string|null>,
  
  // Helpers
  formatDate: Function,
  validateCode: Function,
  
  // Operations
  fetchTypes: Function,
  fetchType: Function,
  createType: Function,
  updateType: Function,
  deleteType: Function,
  
  // Navigation
  navigateToTypeList: Function,
  navigateToTypeDetail: Function,
  navigateToTypeEdit: Function,
  navigateToTypeCreate: Function
}
```

---

## State Properties

### types

Reactive computed reference to the list of types from cache.

**Type:** `ComputedRef<Array>`

**Description:** Returns cached type data with automatic updates when cache is invalidated.

### loading

Reactive reference to loading state for type operations.

**Type:** `Ref<boolean>`

### error

Reactive reference to error state for type operations.

**Type:** `Ref<string|null>`

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
const formattedDate = formatDate('2024-01-15T10:30:00Z')
// Output: "Jan 15, 2024 10:30"
```

### validateCode(code)

Validates type code format and uniqueness.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Type code to validate |

**Returns:** `boolean` - True if valid format

**Validation Rules:**
- 2-20 characters
- Lowercase alphanumeric and hyphens only
- Must start with letter
- Cannot end with hyphen
- Must be unique within the type collection

**Usage:**

```javascript
const isValid = validateCode('building-type')  // true
const isInvalid = validateCode('Building-Type') // false (uppercase)
```

---

## Operation Methods

### fetchTypes(params)

Fetches list of types with optional filtering.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Object` | No | Query parameters |

**Returns:** `Promise<Array>` - List of types

**Usage:**

```javascript
// Fetch all types
await fetchTypes()

// Fetch with filters
await fetchTypes({
  active: true,
  skipCache: true
})
```

### fetchType(id)

Fetches a single type by ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Type ID |

**Returns:** `Promise<Object>` - Type data

### createType(typeData)

Creates a new type.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `typeData` | `Object` | Yes | Type data to create |

**Required Fields:**
- `code`: Unique type code
- `name`: Display name
- `description`: Type description

**Optional Fields:**
- `active`: Active status (default: true)
- `metadata`: Additional type metadata
- `icon`: Icon identifier
- `color`: Color code for styling

**Returns:** `Promise<Object>` - Created type data

**Usage:**

```javascript
const newType = await createType({
  code: 'meeting-room',
  name: 'Meeting Room',
  description: 'Conference and meeting rooms',
  active: true,
  metadata: {
    capacity_range: { min: 2, max: 50 },
    equipment: ['projector', 'whiteboard']
  },
  icon: 'pi-users',
  color: '#3b82f6'
})
```

### updateType(id, typeData)

Updates an existing type.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Type ID |
| `typeData` | `Object` | Yes | Type data to update |

**Returns:** `Promise<Object>` - Updated type data

### deleteType(id, code)

Deletes a type.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Type ID |
| `code` | `string` | Yes | Type code for display |

**Returns:** `Promise<boolean>` - Success status

**Note:** This operation will fail if the type is in use by any entities.

---

## Navigation Methods

### navigateToTypeList(query)

Navigates to the type list page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `Object` | No | Query parameters for the route |

### navigateToTypeDetail(id)

Navigates to type detail page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Type ID |

### navigateToTypeEdit(id)

Navigates to type edit page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Type ID |

### navigateToTypeCreate(query)

Navigates to type creation page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `Object` | No | Pre-fill data for the form |

---

## Internal Methods

These methods are used internally and by specialized composables:

### getStoreCollectionName(entityName)

Maps entity name to store collection name.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | `string` | Yes | Entity name (e.g., 'Edge Type') |

**Returns:** `string` - Store collection name

**Mapping:**
- 'Edge Type' → 'edgeTypes'
- 'Edge Region' → 'edgeRegions'
- 'Location Type' → 'locationTypes'
- 'Thing Type' → 'thingTypes'

### mapToCollectionName(entityName)

Maps entity name to API collection name.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | `string` | Yes | Entity name |

**Returns:** `string` - API collection name

**Mapping:**
- 'Edge Type' → 'edge_types'
- 'Edge Region' → 'edge_regions'
- 'Location Type' → 'location_types'
- 'Thing Type' → 'thing_types'

---

## Usage Examples

### Creating a Specialized Type Composable

```javascript
// src/composables/useEdgeType.js
import { useTypeManagement } from './useTypeManagement'
import { edgeTypeService } from '@/services'

/**
 * Composable for edge type management
 */
export function useEdgeType() {
  // Route names for navigation
  const routeNames = {
    list: 'edge-types',
    detail: 'edge-type-detail',
    create: 'create-edge-type',
    edit: 'edit-edge-type'
  }
  
  // Use base type management composable
  const baseTypeManagement = useTypeManagement(
    edgeTypeService,
    routeNames,
    'Edge Type'
  )
  
  // Add edge type specific functionality
  const getTypeOptions = async () => {
    try {
      return await edgeTypeService.getTypeOptions()
    } catch (error) {
      console.error('Error fetching edge type options:', error)
      return []
    }
  }
  
  return {
    // Include all base functionality
    ...baseTypeManagement,
    
    // Additional edge type specific functionality
    getTypeOptions
  }
}
```

### Type Management Component

```vue
<template>
  <div class="type-management">
    <!-- Header with actions -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ entityName }}s</h1>
      <Button 
        label="Add Type"
        icon="pi pi-plus"
        @click="navigateToTypeCreate()"
      />
    </div>
    
    <!-- Types data table -->
    <DataTable 
      :value="types" 
      :loading="loading"
      class="p-datatable-striped"
      sortField="code"
      :sortOrder="1"
    >
      <Column field="code" header="Code" sortable>
        <template #body="{ data }">
          <code class="text-sm bg-gray-100 px-2 py-1 rounded">
            {{ data.code }}
          </code>
        </template>
      </Column>
      
      <Column field="name" header="Name" sortable />
      
      <Column field="description" header="Description">
        <template #body="{ data }">
          <span class="max-w-xs truncate block">
            {{ data.description }}
          </span>
        </template>
      </Column>
      
      <Column field="active" header="Status">
        <template #body="{ data }">
          <Badge 
            :value="data.active ? 'Active' : 'Inactive'"
            :severity="data.active ? 'success' : 'secondary'"
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
          <div class="flex gap-1">
            <Button 
              icon="pi pi-eye"
              class="p-button-sm p-button-text"
              @click="navigateToTypeDetail(data.id)"
              title="View details"
            />
            <Button 
              icon="pi pi-edit"
              class="p-button-sm p-button-text"
              @click="navigateToTypeEdit(data.id)"
              title="Edit type"
            />
            <Button 
              icon="pi pi-trash"
              class="p-button-sm p-button-text p-button-danger"
              @click="handleDelete(data)"
              title="Delete type"
            />
          </div>
        </template>
      </Column>
    </DataTable>
    
    <!-- Delete confirmation dialog -->
    <ConfirmDialog 
      v-model:visible="showDeleteDialog"
      :message="deleteMessage"
      header="Confirm Deletion"
      icon="pi pi-exclamation-triangle"
      accept-class="p-button-danger"
      @accept="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTypeManagement } from '@/composables/useTypeManagement'
import { useConfirmation } from '@/composables/useConfirmation'

const props = defineProps({
  typeService: { type: Object, required: true },
  routeNames: { type: Object, required: true },
  entityName: { type: String, required: true }
})

const { 
  types, 
  loading, 
  fetchTypes,
  deleteType,
  formatDate,
  navigateToTypeDetail,
  navigateToTypeEdit,
  navigateToTypeCreate
} = useTypeManagement(
  props.typeService,
  props.routeNames,
  props.entityName
)

const { confirmDelete: confirmDeleteType, deleteDialog, showDeleteDialog } = useConfirmation()

const deleteMessage = computed(() => {
  if (!deleteDialog.value.item) return ''
  
  return `Are you sure you want to delete ${props.entityName} "${deleteDialog.value.identifier}"? This action cannot be undone and will fail if the type is currently in use.`
})

const handleDelete = (type) => {
  confirmDeleteType(type, props.entityName, 'code')
}

const confirmDelete = async () => {
  if (deleteDialog.value.item) {
    const success = await deleteType(
      deleteDialog.value.item.id,
      deleteDialog.value.item.code
    )
    if (success) {
      showDeleteDialog.value = false
    }
  }
}

onMounted(() => {
  fetchTypes()
})
</script>
```

### Type Form Component

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <Card>
      <template #title>
        {{ mode === 'create' ? 'Create' : 'Edit' }} {{ entityName }}
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Code field -->
          <div>
            <label class="block text-sm font-medium mb-2">Code</label>
            <InputText
              v-model="form.code"
              :class="{ 'p-invalid': v$.code.$error }"
              placeholder="e.g., meeting-room"
              :disabled="mode === 'edit'"
            />
            <small v-if="v$.code.$error" class="p-error">
              {{ v$.code.$errors[0].$message }}
            </small>
            <small class="text-gray-600">
              Lowercase letters, numbers, and hyphens only
            </small>
          </div>
          
          <!-- Name field -->
          <div>
            <label class="block text-sm font-medium mb-2">Name</label>
            <InputText
              v-model="form.name"
              :class="{ 'p-invalid': v$.name.$error }"
              placeholder="e.g., Meeting Room"
            />
          </div>
          
          <!-- Description field -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Description</label>
            <Textarea
              v-model="form.description"
              :class="{ 'p-invalid': v$.description.$error }"
              rows="3"
              class="w-full"
              placeholder="Describe this type..."
            />
          </div>
          
          <!-- Active status -->
          <div>
            <label class="block text-sm font-medium mb-2">Status</label>
            <div class="flex items-center">
              <Checkbox
                v-model="form.active"
                inputId="active"
                :binary="true"
              />
              <label for="active" class="ml-2">Active</label>
            </div>
          </div>
          
          <!-- Icon selection -->
          <div>
            <label class="block text-sm font-medium mb-2">Icon</label>
            <Dropdown
              v-model="form.icon"
              :options="iconOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select icon"
            >
              <template #value="{ value }">
                <div v-if="value" class="flex items-center gap-2">
                  <i :class="value"></i>
                  <span>{{ getIconLabel(value) }}</span>
                </div>
              </template>
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <i :class="option.value"></i>
                  <span>{{ option.label }}</span>
                </div>
              </template>
            </Dropdown>
          </div>
          
          <!-- Color selection -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Color</label>
            <div class="flex gap-2">
              <div 
                v-for="color in colorOptions" 
                :key="color"
                class="w-8 h-8 rounded cursor-pointer border-2"
                :class="{ 'border-gray-800': form.color === color, 'border-gray-300': form.color !== color }"
                :style="{ backgroundColor: color }"
                @click="form.color = color"
              ></div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2">
          <Button 
            type="submit"
            :label="mode === 'create' ? 'Create Type' : 'Update Type'"
            :loading="loading"
          />
          <Button 
            type="button"
            label="Cancel"
            class="p-button-secondary"
            @click="handleCancel"
          />
        </div>
      </template>
    </Card>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useTypeManagement } from '@/composables/useTypeManagement'

const props = defineProps({
  typeService: { type: Object, required: true },
  routeNames: { type: Object, required: true },
  entityName: { type: String, required: true },
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['success', 'cancel'])

const { 
  createType, 
  updateType, 
  validateCode,
  loading 
} = useTypeManagement(
  props.typeService,
  props.routeNames,
  props.entityName
)

// Form state
const form = ref({
  code: '',
  name: '',
  description: '',
  active: true,
  icon: '',
  color: '#3b82f6'
})

// Validation rules
const rules = {
  code: { 
    required,
    validFormat: helpers.withMessage('Invalid code format', validateCode)
  },
  name: { required },
  description: { required }
}

const v$ = useVuelidate(rules, form)

// Icon options
const iconOptions = [
  { label: 'Building', value: 'pi pi-building' },
  { label: 'Home', value: 'pi pi-home' },
  { label: 'Users', value: 'pi pi-users' },
  { label: 'Cog', value: 'pi pi-cog' },
  { label: 'Desktop', value: 'pi pi-desktop' }
]

// Color options
const colorOptions = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
]

const getIconLabel = (iconClass) => {
  const option = iconOptions.find(opt => opt.value === iconClass)
  return option ? option.label : iconClass
}

const handleSubmit = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  let result
  if (props.mode === 'create') {
    result = await createType(form.value)
  } else {
    result = await updateType(props.initialData.id, form.value)
  }
  
  if (result) {
    emit('success', result)
  }
}

const handleCancel = () => {
  emit('cancel')
}

// Initialize form with provided data
onMounted(() => {
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    Object.assign(form.value, props.initialData)
  }
})
</script>
```

---

## Best Practices

### 1. Extend Rather Than Modify

```javascript
// ✅ Good - extend base functionality
export function useEdgeType() {
  const baseTypeManagement = useTypeManagement(
    edgeTypeService,
    routeNames,
    'Edge Type'
  )
  
  const getTypeOptions = async () => {
    // Edge type specific functionality
  }
  
  return {
    ...baseTypeManagement,
    getTypeOptions
  }
}

// ❌ Avoid - modifying base composable
// Don't modify useTypeManagement directly
```

### 2. Use Consistent Route Names

```javascript
// ✅ Good - consistent naming pattern
const routeNames = {
  list: 'edge-types',
  detail: 'edge-type-detail', 
  create: 'create-edge-type',
  edit: 'edit-edge-type'
}

// ❌ Avoid - inconsistent naming
const routeNames = {
  list: 'edges-types',  // Wrong prefix
  detail: 'type-detail', // Missing context
  create: 'new-edge-type', // Different pattern
  edit: 'modify-edge-type' // Different pattern
}
```

### 3. Validate Type Codes Properly

```javascript
// ✅ Good - use provided validation
const { validateCode } = useTypeManagement(service, routes, 'Edge Type')

const isValidCode = validateCode('meeting-room') // true
const isInvalidCode = validateCode('Meeting_Room') // false

// ❌ Avoid - custom validation that differs from standard
const customValidate = (code) => /^[A-Za-z]+$/.test(code)
```

### 4. Handle Entity Relationships

```javascript
// ✅ Good - check usage before deletion
const deleteTypeWithCheck = async (typeId, typeCode) => {
  try {
    // Check if type is in use
    const isInUse = await typeService.isTypeInUse(typeId)
    
    if (isInUse) {
      toast.add({
        severity: 'warn',
        summary: 'Cannot Delete',
        detail: `Type "${typeCode}" is currently in use and cannot be deleted.`
      })
      return false
    }
    
    return await deleteType(typeId, typeCode)
  } catch (error) {
    // Handle deletion error
    return false
  }
}
```

### 5. Provide Meaningful Metadata

```javascript
// ✅ Good - structured metadata for types
const typeMetadata = {
  capacity_range: { min: 1, max: 100 },
  equipment: ['projector', 'whiteboard'],
  booking_rules: {
    advance_booking_days: 30,
    max_duration_hours: 8
  },
  attributes: [
    { name: 'size', type: 'number', required: true },
    { name: 'accessibility', type: 'boolean', required: false }
  ]
}

await createType({
  code: 'meeting-room',
  name: 'Meeting Room',
  description: 'Conference and meeting rooms',
  metadata: typeMetadata
})
```

The `useTypeManagement` composable provides a solid foundation for all type management operations, ensuring consistency and reducing code duplication across different type entities in the IoT platform.
