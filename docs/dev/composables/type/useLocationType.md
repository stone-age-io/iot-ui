# useLocationType

## Overview

The `useLocationType` composable manages location type definitions and provides specialized functionality for spatial location categorization. It extends the base `useTypeManagement` composable with location-specific features like capacity management, equipment tracking, and spatial characteristics.

## Location

```
src/composables/useLocationType.js
```

## Purpose

- **Location Type Management**: Complete CRUD operations for location type definitions
- **Type Options**: Formatted options for dropdown components
- **Spatial Characteristics**: Room capacity, dimensions, and layout management
- **Equipment Integration**: Equipment and amenity tracking per location type
- **Validation**: Location type-specific validation rules
- **Inheritance**: Extends base type management functionality

## Dependencies

```javascript
import { useTypeManagement } from './useTypeManagement'
import { locationTypeService } from '@/services'
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
  
  // Location type specific
  getTypeOptions: Function
}
```

---

## Location Type Specific Methods

### getTypeOptions()

Returns location types formatted for dropdown components.

**Returns:** `Promise<Array>`

**Return Structure:**

```javascript
[
  { label: "Meeting Room", value: "meeting-room" },
  { label: "Office", value: "office" },
  { label: "Warehouse", value: "warehouse" },
  { label: "Laboratory", value: "lab" },
  { label: "Reception", value: "reception" },
  { label: "Kitchen", value: "kitchen" }
]
```

**Usage:**

```javascript
const { getTypeOptions } = useLocationType()

const typeOptions = await getTypeOptions()

// Use in dropdown component
<Dropdown
  v-model="selectedType"
  :options="typeOptions"
  optionLabel="label"
  optionValue="value"
  placeholder="Select location type"
/>
```

---

## Location Type Validation

Location types follow specific validation rules:

### Code Format
- **Length**: 3-30 characters
- **Pattern**: Lowercase letters, numbers, and hyphens
- **Examples**: `meeting-room`, `office`, `warehouse`, `lab-clean`

### Common Location Type Codes
- `office` - Standard office space
- `meeting-room` - Conference and meeting rooms
- `warehouse` - Storage and warehouse areas
- `lab` - Laboratory spaces
- `reception` - Reception and lobby areas
- `kitchen` - Kitchen and dining areas
- `bathroom` - Restroom facilities
- `server-room` - Technical server rooms
- `storage` - General storage areas
- `hallway` - Corridors and passages

---

## Usage Examples

### Location Type Management with Capacity Planning

```vue
<template>
  <div class="location-type-management">
    <!-- Header with capacity overview -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Location Types</h1>
        <p class="text-gray-600">Manage spatial categories and capacity planning</p>
      </div>
      <Button 
        label="Add Location Type"
        icon="pi pi-plus"
        @click="navigateToTypeCreate()"
      />
    </div>
    
    <!-- Type overview cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card 
        v-for="category in typeCategories" 
        :key="category.name"
        class="text-center"
      >
        <template #content>
          <div class="space-y-2">
            <i :class="category.icon" class="text-2xl text-blue-600"></i>
            <div class="font-medium">{{ category.name }}</div>
            <div class="text-sm text-gray-600">{{ category.count }} types</div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Location types table with capacity info -->
    <DataTable 
      :value="types" 
      :loading="loading"
      class="p-datatable-striped"
      sortField="name"
      :sortOrder="1"
    >
      <Column field="code" header="Code" sortable>
        <template #body="{ data }">
          <code class="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
            {{ data.code }}
          </code>
        </template>
      </Column>
      
      <Column field="name" header="Type Name" sortable />
      
      <Column field="category" header="Category">
        <template #body="{ data }">
          <Badge 
            :value="data.metadata?.category || 'General'"
            :class="getCategoryClass(data.metadata?.category)"
          />
        </template>
      </Column>
      
      <Column field="capacity" header="Capacity Range">
        <template #body="{ data }">
          <div v-if="data.metadata?.capacity">
            <span class="text-sm">
              {{ data.metadata.capacity.min }} - {{ data.metadata.capacity.max }} people
            </span>
          </div>
          <span v-else class="text-gray-400">Not specified</span>
        </template>
      </Column>
      
      <Column field="equipment" header="Standard Equipment">
        <template #body="{ data }">
          <div v-if="data.metadata?.equipment?.length" class="flex flex-wrap gap-1">
            <Badge 
              v-for="item in data.metadata.equipment.slice(0, 3)" 
              :key="item"
              :value="item"
              class="text-xs"
            />
            <Badge 
              v-if="data.metadata.equipment.length > 3"
              :value="`+${data.metadata.equipment.length - 3}`"
              class="text-xs"
              severity="secondary"
            />
          </div>
          <span v-else class="text-gray-400">None</span>
        </template>
      </Column>
      
      <Column field="usage_count" header="Usage">
        <template #body="{ data }">
          <Badge 
            :value="data.usage_count || 0"
            :severity="data.usage_count > 0 ? 'info' : 'secondary'"
          />
          <span class="ml-2 text-sm text-gray-600">locations</span>
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
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useLocationType } from '@/composables/useLocationType'
import { useConfirmation } from '@/composables/useConfirmation'

const { 
  types, 
  loading,
  fetchTypes,
  deleteType,
  navigateToTypeDetail,
  navigateToTypeEdit,
  navigateToTypeCreate
} = useLocationType()

const { confirmDelete, deleteDialog } = useConfirmation()

// Categorize types for overview
const typeCategories = computed(() => {
  const categories = {
    'Work Spaces': { count: 0, icon: 'pi pi-users' },
    'Meeting Rooms': { count: 0, icon: 'pi pi-comments' },
    'Technical': { count: 0, icon: 'pi pi-cog' },
    'Common Areas': { count: 0, icon: 'pi pi-home' }
  }
  
  types.value.forEach(type => {
    const category = type.metadata?.category || 'Common Areas'
    if (categories[category]) {
      categories[category].count++
    }
  })
  
  return Object.entries(categories).map(([name, data]) => ({
    name,
    ...data
  }))
})

const getCategoryClass = (category) => {
  const classes = {
    'Work Spaces': 'bg-blue-100 text-blue-800',
    'Meeting Rooms': 'bg-green-100 text-green-800',
    'Technical': 'bg-orange-100 text-orange-800',
    'Common Areas': 'bg-purple-100 text-purple-800'
  }
  return classes[category] || 'bg-gray-100 text-gray-800'
}

const handleDelete = (type) => {
  confirmDelete(type, 'Location Type', 'code')
}

onMounted(() => {
  fetchTypes()
})
</script>
```

### Location Type Form with Capacity and Equipment

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Basic information -->
      <Card>
        <template #title>Basic Information</template>
        <template #content>
          <div class="space-y-4">
            <!-- Code field -->
            <div>
              <label class="block text-sm font-medium mb-2">Code *</label>
              <InputText
                v-model="form.code"
                :class="{ 'p-invalid': v$.code.$error }"
                placeholder="e.g., meeting-room"
                :disabled="mode === 'edit'"
              />
              <small v-if="v$.code.$error" class="p-error">
                {{ v$.code.$errors[0].$message }}
              </small>
            </div>
            
            <!-- Name field -->
            <div>
              <label class="block text-sm font-medium mb-2">Name *</label>
              <InputText
                v-model="form.name"
                :class="{ 'p-invalid': v$.name.$error }"
                placeholder="e.g., Meeting Room"
              />
            </div>
            
            <!-- Category -->
            <div>
              <label class="block text-sm font-medium mb-2">Category</label>
              <Dropdown
                v-model="form.category"
                :options="categoryOptions"
                placeholder="Select category"
              />
            </div>
            
            <!-- Description -->
            <div>
              <label class="block text-sm font-medium mb-2">Description *</label>
              <Textarea
                v-model="form.description"
                :class="{ 'p-invalid': v$.description.$error }"
                rows="3"
                class="w-full"
                placeholder="Describe the location type..."
              />
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Capacity and dimensions -->
      <Card>
        <template #title>Capacity & Dimensions</template>
        <template #content>
          <div class="space-y-4">
            <!-- Capacity range -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Min Capacity</label>
                <InputNumber
                  v-model="form.capacity.min"
                  :min="0"
                  :max="1000"
                  placeholder="0"
                />
                <small class="text-gray-600">People</small>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Max Capacity</label>
                <InputNumber
                  v-model="form.capacity.max"
                  :min="1"
                  :max="1000"
                  placeholder="10"
                />
                <small class="text-gray-600">People</small>
              </div>
            </div>
            
            <!-- Dimensions -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Typical Width (m)</label>
                <InputNumber
                  v-model="form.dimensions.width"
                  :step="0.1"
                  placeholder="5.0"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Typical Length (m)</label>
                <InputNumber
                  v-model="form.dimensions.length"
                  :step="0.1"
                  placeholder="8.0"
                />
              </div>
            </div>
            
            <!-- Area calculation -->
            <div v-if="calculatedArea" class="bg-gray-50 p-3 rounded">
              <strong>Calculated Area:</strong> {{ calculatedArea }} m²
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Equipment and amenities -->
      <Card class="lg:col-span-2">
        <template #title>Equipment & Amenities</template>
        <template #content>
          <div class="space-y-4">
            <!-- Standard equipment -->
            <div>
              <label class="block text-sm font-medium mb-2">Standard Equipment</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div 
                  v-for="item in equipmentOptions" 
                  :key="item.value"
                  class="flex items-center"
                >
                  <Checkbox
                    v-model="form.equipment"
                    :inputId="item.value"
                    :value="item.value"
                  />
                  <label :for="item.value" class="ml-2 text-sm">{{ item.label }}</label>
                </div>
              </div>
            </div>
            
            <!-- Custom equipment -->
            <div>
              <label class="block text-sm font-medium mb-2">Custom Equipment</label>
              <div class="flex gap-2">
                <InputText
                  v-model="newEquipment"
                  placeholder="Add custom equipment"
                  @keyup.enter="addCustomEquipment"
                />
                <Button 
                  icon="pi pi-plus"
                  @click="addCustomEquipment"
                  :disabled="!newEquipment.trim()"
                />
              </div>
              
              <!-- Custom equipment tags -->
              <div v-if="customEquipmentList.length" class="flex flex-wrap gap-2 mt-2">
                <Badge 
                  v-for="item in customEquipmentList" 
                  :key="item"
                  :value="item"
                  class="cursor-pointer"
                  @click="removeCustomEquipment(item)"
                >
                  <template #default>
                    {{ item }} <i class="pi pi-times ml-1"></i>
                  </template>
                </Badge>
              </div>
            </div>
            
            <!-- Amenities -->
            <div>
              <label class="block text-sm font-medium mb-2">Amenities</label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.amenities.wifi"
                    inputId="wifi"
                    :binary="true"
                  />
                  <label for="wifi" class="ml-2">WiFi</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.amenities.accessible"
                    inputId="accessible"
                    :binary="true"
                  />
                  <label for="accessible" class="ml-2">Wheelchair Accessible</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.amenities.natural_light"
                    inputId="natural_light"
                    :binary="true"
                  />
                  <label for="natural_light" class="ml-2">Natural Light</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.amenities.climate_control"
                    inputId="climate_control"
                    :binary="true"
                  />
                  <label for="climate_control" class="ml-2">Climate Control</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.amenities.security_camera"
                    inputId="security_camera"
                    :binary="true"
                  />
                  <label for="security_camera" class="ml-2">Security Camera</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.amenities.phone"
                    inputId="phone"
                    :binary="true"
                  />
                  <label for="phone" class="ml-2">Phone</label>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Actions -->
    <div class="flex gap-2 mt-6">
      <Button 
        type="submit"
        :label="mode === 'create' ? 'Create Location Type' : 'Update Location Type'"
        :loading="loading"
      />
      <Button 
        type="button"
        label="Cancel"
        class="p-button-secondary"
        @click="handleCancel"
      />
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { useLocationType } from '@/composables/useLocationType'

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
} = useLocationType()

// Form state
const form = ref({
  code: '',
  name: '',
  description: '',
  category: 'Common Areas',
  capacity: {
    min: 1,
    max: 10
  },
  dimensions: {
    width: null,
    length: null
  },
  equipment: [],
  amenities: {
    wifi: false,
    accessible: false,
    natural_light: false,
    climate_control: false,
    security_camera: false,
    phone: false
  }
})

const newEquipment = ref('')

// Validation rules
const rules = {
  code: { required, unique: validateCode },
  name: { required },
  description: { required }
}

const v$ = useVuelidate(rules, form)

// Options
const categoryOptions = [
  'Work Spaces',
  'Meeting Rooms', 
  'Technical',
  'Common Areas'
]

const equipmentOptions = [
  { label: 'Projector', value: 'projector' },
  { label: 'Whiteboard', value: 'whiteboard' },
  { label: 'TV/Monitor', value: 'tv_monitor' },
  { label: 'Conference Phone', value: 'conference_phone' },
  { label: 'Computer', value: 'computer' },
  { label: 'Printer', value: 'printer' },
  { label: 'Scanner', value: 'scanner' },
  { label: 'Flipchart', value: 'flipchart' }
]

// Computed properties
const calculatedArea = computed(() => {
  if (form.value.dimensions.width && form.value.dimensions.length) {
    return (form.value.dimensions.width * form.value.dimensions.length).toFixed(1)
  }
  return null
})

const customEquipmentList = computed(() => {
  return form.value.equipment.filter(item => 
    !equipmentOptions.some(opt => opt.value === item)
  )
})

// Methods
const addCustomEquipment = () => {
  const equipment = newEquipment.value.trim()
  if (equipment && !form.value.equipment.includes(equipment)) {
    form.value.equipment.push(equipment)
    newEquipment.value = ''
  }
}

const removeCustomEquipment = (item) => {
  const index = form.value.equipment.indexOf(item)
  if (index > -1) {
    form.value.equipment.splice(index, 1)
  }
}

const handleSubmit = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  // Prepare data with metadata
  const typeData = {
    code: form.value.code,
    name: form.value.name,
    description: form.value.description,
    metadata: {
      category: form.value.category,
      capacity: form.value.capacity,
      dimensions: form.value.dimensions,
      equipment: form.value.equipment,
      amenities: form.value.amenities
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
    // Map basic fields
    form.value.code = props.initialData.code || ''
    form.value.name = props.initialData.name || ''
    form.value.description = props.initialData.description || ''
    
    // Extract metadata
    if (props.initialData.metadata) {
      const meta = props.initialData.metadata
      form.value.category = meta.category || 'Common Areas'
      form.value.capacity = meta.capacity || { min: 1, max: 10 }
      form.value.dimensions = meta.dimensions || { width: null, length: null }
      form.value.equipment = meta.equipment || []
      form.value.amenities = meta.amenities || {
        wifi: false,
        accessible: false,
        natural_light: false,
        climate_control: false,
        security_camera: false,
        phone: false
      }
    }
  }
})
</script>
```

---

## Best Practices

### 1. Use Descriptive Location Type Codes

```javascript
// ✅ Good - descriptive and clear codes
const locationTypeCodes = {
  MEETING_ROOM: 'meeting-room',
  OFFICE: 'office',
  WAREHOUSE: 'warehouse',
  LAB_CLEAN: 'lab-clean',
  SERVER_ROOM: 'server-room'
}

// ❌ Avoid - ambiguous or unclear codes
const badCodes = {
  ROOM: 'rm',          // Too generic
  MEETING: 'mtg',      // Abbreviation unclear
  SPACE: 'space1'      // Contains numbers
}
```

### 2. Structure Capacity and Equipment Data

```javascript
// ✅ Good - structured metadata for location types
const locationTypeData = {
  code: 'meeting-room',
  name: 'Meeting Room',
  description: 'Conference and meeting spaces',
  metadata: {
    category: 'Meeting Rooms',
    capacity: {
      min: 2,
      max: 20
    },
    dimensions: {
      width: 4.0,
      length: 6.0,
      height: 2.8
    },
    equipment: [
      'projector',
      'whiteboard', 
      'conference_phone'
    ],
    amenities: {
      wifi: true,
      accessible: true,
      natural_light: true,
      climate_control: true
    },
    booking_rules: {
      advance_booking_days: 30,
      max_duration_hours: 8,
      requires_approval: false
    }
  }
}
```

### 3. Validate Capacity Constraints

```javascript
// ✅ Good - validate capacity requirements
const validateLocationCapacity = (locationData, locationType) => {
  const typeCapacity = locationType.metadata?.capacity
  
  if (!typeCapacity) return true
  
  if (locationData.capacity < typeCapacity.min) {
    throw new Error(`Capacity below minimum for ${locationType.name} (${typeCapacity.min})`)
  }
  
  if (locationData.capacity > typeCapacity.max) {
    throw new Error(`Capacity exceeds maximum for ${locationType.name} (${typeCapacity.max})`)
  }
  
  return true
}
```

### 4. Provide Equipment Templates

```javascript
// ✅ Good - equipment templates by location type
const getEquipmentTemplate = (typeCode) => {
  const templates = {
    'meeting-room': [
      'projector',
      'whiteboard',
      'conference_phone',
      'flipchart'
    ],
    'office': [
      'desk',
      'chair',
      'computer',
      'phone'
    ],
    'lab': [
      'lab_bench',
      'fume_hood',
      'safety_equipment',
      'microscope'
    ],
    'server-room': [
      'server_rack',
      'ups',
      'cooling_system',
      'monitoring_system'
    ]
  }
  
  return templates[typeCode] || []
}
```

### 5. Handle Type-Specific Validation

```javascript
// ✅ Good - type-specific validation rules
const validateByLocationType = (locationData, typeCode) => {
  const validators = {
    'server-room': (data) => {
      if (!data.security_level || data.security_level < 3) {
        throw new Error('Server rooms require security level 3 or higher')
      }
      if (!data.climate_control) {
        throw new Error('Server rooms require climate control')
      }
    },
    'lab': (data) => {
      if (!data.safety_equipment) {
        throw new Error('Labs require safety equipment specification')
      }
      if (!data.ventilation_rating) {
        throw new Error('Labs require ventilation rating')
      }
    },
    'meeting-room': (data) => {
      if (data.capacity > 50 && !data.av_equipment) {
        throw new Error('Large meeting rooms require AV equipment')
      }
    }
  }
  
  const validator = validators[typeCode]
  if (validator) {
    validator(locationData)
  }
  
  return true
}
```

The `useLocationType` composable provides comprehensive location type management with capacity planning, equipment tracking, and amenity management, making it ideal for facility management and space planning scenarios.
