# useEdgeType

## Overview

The `useEdgeType` composable manages edge type definitions and provides specialized functionality for edge type operations. It extends the base `useTypeManagement` composable with edge-specific features like type options generation and validation rules.

## Location

```
src/composables/useEdgeType.js
```

## Purpose

- **Edge Type Management**: Complete CRUD operations for edge type definitions
- **Type Options**: Formatted options for dropdown components
- **Validation**: Edge type-specific validation rules
- **Integration**: Seamless integration with edge entity management
- **Inheritance**: Extends base type management functionality

## Dependencies

```javascript
import { useTypeManagement } from './useTypeManagement'
import { edgeTypeService } from '@/services'
```

## Returns

Includes all methods from `useTypeManagement` plus:

```javascript
{
  // Inherited from useTypeManagement
  types: ComputedRef<Array>,
  loading: Ref<boolean>,
  error: Ref<string|null>,
  formatDate: Function,
  validateCode: Function,
  fetchTypes: Function,
  fetchType: Function,
  createType: Function,
  updateType: Function,
  deleteType: Function,
  navigateToTypeList: Function,
  navigateToTypeDetail: Function,
  navigateToTypeEdit: Function,
  navigateToTypeCreate: Function,
  
  // Edge type specific
  getTypeOptions: Function
}
```

---

## Edge Type Specific Methods

### getTypeOptions()

Returns edge types formatted for dropdown components.

**Returns:** `Promise<Array>`

**Return Structure:**

```javascript
[
  { label: "Building", value: "bld" },
  { label: "Data Center", value: "dc" },
  { label: "Server", value: "srv" },
  { label: "Gateway", value: "gw" }
]
```

**Usage:**

```javascript
const { getTypeOptions } = useEdgeType()

const typeOptions = await getTypeOptions()

// Use in dropdown component
<Dropdown
  v-model="selectedType"
  :options="typeOptions"
  optionLabel="label"
  optionValue="value"
  placeholder="Select edge type"
/>
```

---

## Edge Type Validation

Edge types follow specific validation rules:

### Code Format
- **Length**: 2-6 characters
- **Pattern**: Lowercase letters only
- **Examples**: `bld`, `dc`, `srv`, `gw`

### Common Edge Type Codes
- `bld` - Building edge server
- `dc` - Data center edge
- `srv` - Server edge
- `gw` - Gateway device
- `cell` - Cellular edge
- `wifi` - WiFi edge

---

## Usage Examples

### Basic Edge Type Management

```vue
<template>
  <div class="edge-type-management">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Edge Types</h1>
      <Button 
        label="Add Edge Type"
        icon="pi pi-plus"
        @click="navigateToTypeCreate()"
      />
    </div>
    
    <!-- Edge types table -->
    <DataTable 
      :value="types" 
      :loading="loading"
      class="p-datatable-striped"
    >
      <Column field="code" header="Code" sortable>
        <template #body="{ data }">
          <code class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {{ data.code }}
          </code>
        </template>
      </Column>
      
      <Column field="name" header="Name" sortable />
      
      <Column field="description" header="Description" />
      
      <Column field="usage_count" header="Usage">
        <template #body="{ data }">
          <Badge 
            :value="data.usage_count || 0"
            :severity="data.usage_count > 0 ? 'info' : 'secondary'"
          />
          <span class="ml-2 text-sm text-gray-600">edges</span>
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
            />
            <Button 
              icon="pi pi-edit"
              class="p-button-sm p-button-text"
              @click="navigateToTypeEdit(data.id)"
            />
            <Button 
              icon="pi pi-trash"
              class="p-button-sm p-button-text p-button-danger"
              @click="handleDelete(data)"
              :disabled="data.usage_count > 0"
              :title="data.usage_count > 0 ? 'Cannot delete: type is in use' : 'Delete type'"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useEdgeType } from '@/composables/useEdgeType'
import { useConfirmation } from '@/composables/useConfirmation'

const { 
  types, 
  loading,
  fetchTypes,
  deleteType,
  formatDate,
  navigateToTypeDetail,
  navigateToTypeEdit,
  navigateToTypeCreate
} = useEdgeType()

const { confirmDelete, deleteDialog, showDeleteDialog } = useConfirmation()

const handleDelete = (type) => {
  confirmDelete(type, 'Edge Type', 'code')
}

const confirmDeleteType = async () => {
  if (deleteDialog.value.item) {
    await deleteType(deleteDialog.value.item.id, deleteDialog.value.item.code)
  }
}

onMounted(() => {
  fetchTypes()
})
</script>
```

### Edge Type Form

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <Card>
      <template #title>
        {{ mode === 'create' ? 'Create' : 'Edit' }} Edge Type
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Code field -->
          <div>
            <label class="block text-sm font-medium mb-2">Code *</label>
            <InputText
              v-model="form.code"
              :class="{ 'p-invalid': v$.code.$error }"
              placeholder="e.g., bld"
              :disabled="mode === 'edit'"
              maxlength="6"
            />
            <small v-if="v$.code.$error" class="p-error">
              {{ v$.code.$errors[0].$message }}
            </small>
            <small class="text-gray-600">
              2-6 lowercase letters only
            </small>
          </div>
          
          <!-- Name field -->
          <div>
            <label class="block text-sm font-medium mb-2">Name *</label>
            <InputText
              v-model="form.name"
              :class="{ 'p-invalid': v$.name.$error }"
              placeholder="e.g., Building"
            />
          </div>
          
          <!-- Description field -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              v-model="form.description"
              :class="{ 'p-invalid': v$.description.$error }"
              rows="3"
              class="w-full"
              placeholder="Describe the edge type and its use cases..."
            />
          </div>
          
          <!-- Capabilities -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Capabilities</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div class="flex items-center">
                <Checkbox
                  v-model="form.capabilities.computing"
                  inputId="computing"
                  :binary="true"
                />
                <label for="computing" class="ml-2">Computing</label>
              </div>
              <div class="flex items-center">
                <Checkbox
                  v-model="form.capabilities.storage"
                  inputId="storage"
                  :binary="true"
                />
                <label for="storage" class="ml-2">Storage</label>
              </div>
              <div class="flex items-center">
                <Checkbox
                  v-model="form.capabilities.networking"
                  inputId="networking"
                  :binary="true"
                />
                <label for="networking" class="ml-2">Networking</label>
              </div>
              <div class="flex items-center">
                <Checkbox
                  v-model="form.capabilities.gateway"
                  inputId="gateway"
                  :binary="true"
                />
                <label for="gateway" class="ml-2">Gateway</label>
              </div>
            </div>
          </div>
          
          <!-- Performance specs -->
          <div>
            <label class="block text-sm font-medium mb-2">CPU Cores (min)</label>
            <InputNumber
              v-model="form.specs.min_cpu_cores"
              :min="1"
              :max="64"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">RAM (GB, min)</label>
            <InputNumber
              v-model="form.specs.min_ram_gb"
              :min="1"
              :max="512"
            />
          </div>
          
          <!-- Icon and color -->
          <div>
            <label class="block text-sm font-medium mb-2">Icon</label>
            <Dropdown
              v-model="form.icon"
              :options="edgeIconOptions"
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
          
          <div>
            <label class="block text-sm font-medium mb-2">Color</label>
            <div class="flex gap-2">
              <div 
                v-for="color in edgeColorOptions" 
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
            :label="mode === 'create' ? 'Create Edge Type' : 'Update Edge Type'"
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
import { required, helpers, minLength, maxLength } from '@vuelidate/validators'
import { useEdgeType } from '@/composables/useEdgeType'

const props = defineProps({
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['success', 'cancel'])

const { 
  createType, 
  updateType, 
  validateCode,
  loading 
} = useEdgeType()

// Form state
const form = ref({
  code: '',
  name: '',
  description: '',
  capabilities: {
    computing: false,
    storage: false,
    networking: false,
    gateway: false
  },
  specs: {
    min_cpu_cores: 1,
    min_ram_gb: 1
  },
  icon: 'pi pi-server',
  color: '#3b82f6'
})

// Edge-specific validation rules
const rules = {
  code: { 
    required,
    minLength: minLength(2),
    maxLength: maxLength(6),
    validFormat: helpers.withMessage(
      'Code must be 2-6 lowercase letters only', 
      (value) => /^[a-z]{2,6}$/.test(value)
    ),
    unique: helpers.withMessage('Code must be unique', validateCode)
  },
  name: { required },
  description: { required }
}

const v$ = useVuelidate(rules, form)

// Edge-specific icon options
const edgeIconOptions = [
  { label: 'Server', value: 'pi pi-server' },
  { label: 'Building', value: 'pi pi-building' },
  { label: 'Desktop', value: 'pi pi-desktop' },
  { label: 'Mobile', value: 'pi pi-mobile' },
  { label: 'Cloud', value: 'pi pi-cloud' },
  { label: 'Database', value: 'pi pi-database' }
]

// Edge-specific color options
const edgeColorOptions = [
  '#3b82f6', // Blue
  '#10b981', // Green  
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4'  // Cyan
]

const getIconLabel = (iconClass) => {
  const option = edgeIconOptions.find(opt => opt.value === iconClass)
  return option ? option.label : iconClass
}

const handleSubmit = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  // Prepare data with metadata
  const typeData = {
    ...form.value,
    metadata: {
      capabilities: form.value.capabilities,
      specs: form.value.specs
    }
  }
  
  let result
  if (props.mode === 'create') {
    result = await createType(typeData)
  } else {
    result = await updateType(props.initialData.id, typeData)
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
    
    // Extract capabilities and specs from metadata
    if (props.initialData.metadata) {
      if (props.initialData.metadata.capabilities) {
        Object.assign(form.value.capabilities, props.initialData.metadata.capabilities)
      }
      if (props.initialData.metadata.specs) {
        Object.assign(form.value.specs, props.initialData.metadata.specs)
      }
    }
  }
})
</script>
```

### Integration with Edge Management

```vue
<template>
  <div class="edge-create-form">
    <!-- Edge type selection -->
    <div>
      <label class="block text-sm font-medium mb-2">Edge Type *</label>
      <Dropdown
        v-model="form.type"
        :options="edgeTypeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select edge type"
        :loading="typeOptionsLoading"
        @change="handleTypeChange"
      >
        <template #option="{ option }">
          <div class="flex items-center gap-2">
            <i :class="getTypeIcon(option.value)" class="text-lg"></i>
            <div>
              <div class="font-medium">{{ option.label }}</div>
              <div class="text-xs text-gray-600">{{ getTypeDescription(option.value) }}</div>
            </div>
          </div>
        </template>
      </Dropdown>
    </div>
    
    <!-- Type-specific requirements (shown after type selection) -->
    <Card v-if="selectedTypeInfo" class="mt-4">
      <template #title>Type Requirements</template>
      <template #content>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Minimum CPU:</strong> {{ selectedTypeInfo.specs?.min_cpu_cores || 'N/A' }} cores
          </div>
          <div>
            <strong>Minimum RAM:</strong> {{ selectedTypeInfo.specs?.min_ram_gb || 'N/A' }} GB
          </div>
          <div class="col-span-2">
            <strong>Capabilities:</strong>
            <div class="flex gap-2 mt-1">
              <Badge 
                v-for="(enabled, capability) in selectedTypeInfo.capabilities" 
                :key="capability"
                v-if="enabled"
                :value="capability"
                class="capitalize"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useEdgeType } from '@/composables/useEdgeType'

const { getTypeOptions, types } = useEdgeType()

const form = ref({
  type: ''
})

const edgeTypeOptions = ref([])
const typeOptionsLoading = ref(false)

// Find selected type info
const selectedTypeInfo = computed(() => {
  if (!form.value.type) return null
  return types.value.find(type => type.code === form.value.type)
})

// Load type options
const loadTypeOptions = async () => {
  typeOptionsLoading.value = true
  try {
    edgeTypeOptions.value = await getTypeOptions()
  } finally {
    typeOptionsLoading.value = false
  }
}

const getTypeIcon = (typeCode) => {
  const type = types.value.find(t => t.code === typeCode)
  return type?.icon || 'pi pi-server'
}

const getTypeDescription = (typeCode) => {
  const type = types.value.find(t => t.code === typeCode)
  return type?.description || ''
}

const handleTypeChange = () => {
  // Perform type-specific validation or setup
  console.log('Edge type changed to:', form.value.type)
}

// Load options on mount
onMounted(() => {
  loadTypeOptions()
})
</script>
```

---

## Best Practices

### 1. Use Standard Edge Type Codes

```javascript
// ✅ Good - standard codes
const edgeTypeCodes = {
  BUILDING: 'bld',
  DATA_CENTER: 'dc', 
  SERVER: 'srv',
  GATEWAY: 'gw',
  CELLULAR: 'cell'
}

// ❌ Avoid - non-standard codes
const badCodes = {
  BUILDING: 'building',  // Too long
  DATA_CENTER: 'DC',     // Uppercase
  SERVER: 'server1'      // Contains numbers
}
```

### 2. Include Meaningful Metadata

```javascript
// ✅ Good - structured capabilities and specs
const edgeTypeData = {
  code: 'bld',
  name: 'Building',
  description: 'Building edge server for facility management',
  metadata: {
    capabilities: {
      computing: true,
      storage: true,
      networking: true,
      gateway: false
    },
    specs: {
      min_cpu_cores: 4,
      min_ram_gb: 8,
      min_storage_gb: 100
    },
    use_cases: [
      'IoT device management',
      'Local data processing',
      'Building automation'
    ]
  }
}
```

### 3. Validate Type Usage Before Deletion

```javascript
// ✅ Good - check usage before allowing deletion
const handleTypeDelete = async (typeId, typeCode) => {
  const usageCount = await edgeService.countByType(typeCode)
  
  if (usageCount > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot Delete',
      detail: `Edge type "${typeCode}" is used by ${usageCount} edge(s)`
    })
    return false
  }
  
  return await deleteType(typeId, typeCode)
}
```

### 4. Provide Visual Consistency

```javascript
// ✅ Good - consistent icon and color mapping
const getTypeVisuals = (typeCode) => {
  const visualMap = {
    bld: { icon: 'pi pi-building', color: '#3b82f6' },
    dc: { icon: 'pi pi-database', color: '#10b981' },
    srv: { icon: 'pi pi-server', color: '#f59e0b' },
    gw: { icon: 'pi pi-wifi', color: '#8b5cf6' }
  }
  
  return visualMap[typeCode] || { icon: 'pi pi-circle', color: '#6b7280' }
}
```

### 5. Cache Type Options

```javascript
// ✅ Good - cache type options for performance
let cachedTypeOptions = null

export const getEdgeTypeOptions = async () => {
  if (cachedTypeOptions) {
    return cachedTypeOptions
  }
  
  const { getTypeOptions } = useEdgeType()
  cachedTypeOptions = await getTypeOptions()
  
  return cachedTypeOptions
}

// Clear cache when types are modified
export const clearTypeOptionsCache = () => {
  cachedTypeOptions = null
}
```

The `useEdgeType` composable provides specialized edge type management with proper validation, formatting, and integration capabilities, making it easy to maintain consistent edge type definitions across the IoT platform.
