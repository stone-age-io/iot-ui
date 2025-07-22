# useEdgeRegion

## Overview

The `useEdgeRegion` composable manages edge region definitions and provides specialized functionality for geographical region operations. It extends the base `useTypeManagement` composable with region-specific features like geographical organization and timezone management.

## Location

```
src/composables/useEdgeRegion.js
```

## Purpose

- **Edge Region Management**: Complete CRUD operations for edge region definitions
- **Regional Options**: Formatted options for dropdown components
- **Geographical Organization**: Region-based geographical organization
- **Timezone Integration**: Regional timezone handling
- **Validation**: Region-specific validation rules
- **Inheritance**: Extends base type management functionality

## Dependencies

```javascript
import { useTypeManagement } from './useTypeManagement'
import { edgeRegionService } from '@/services'
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
  
  // Edge region specific
  getRegionOptions: Function
}
```

---

## Edge Region Specific Methods

### getRegionOptions()

Returns edge regions formatted for dropdown components.

**Returns:** `Promise<Array>`

**Return Structure:**

```javascript
[
  { label: "North America", value: "na" },
  { label: "Europe", value: "eu" },
  { label: "Asia Pacific", value: "ap" },
  { label: "South America", value: "sa" },
  { label: "Africa", value: "af" },
  { label: "Middle East", value: "me" }
]
```

**Usage:**

```javascript
const { getRegionOptions } = useEdgeRegion()

const regionOptions = await getRegionOptions()

// Use in dropdown component
<Dropdown
  v-model="selectedRegion"
  :options="regionOptions"
  optionLabel="label"
  optionValue="value"
  placeholder="Select region"
/>
```

---

## Edge Region Validation

Edge regions follow specific validation rules:

### Code Format
- **Length**: 2-4 characters
- **Pattern**: Lowercase letters only
- **Examples**: `na`, `eu`, `ap`, `sa`, `af`, `me`

### Common Edge Region Codes
- `na` - North America
- `eu` - Europe
- `ap` - Asia Pacific
- `sa` - South America
- `af` - Africa
- `me` - Middle East
- `oc` - Oceania

---

## Usage Examples

### Basic Edge Region Management

```vue
<template>
  <div class="edge-region-management">
    <!-- Header with regional context -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Edge Regions</h1>
        <p class="text-gray-600">Manage geographical regions for edge deployment</p>
      </div>
      <Button 
        label="Add Region"
        icon="pi pi-plus"
        @click="navigateToTypeCreate()"
      />
    </div>
    
    <!-- Regions map visualization -->
    <Card class="mb-6">
      <template #title>Regional Distribution</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            v-for="region in types" 
            :key="region.id"
            class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            :class="getRegionColorClass(region.code)"
            @click="navigateToTypeDetail(region.id)"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-medium">{{ region.name }}</h3>
              <Badge 
                :value="region.code.toUpperCase()"
                class="font-mono"
              />
            </div>
            <p class="text-sm text-gray-600 mb-3">{{ region.description }}</p>
            
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>Timezone:</strong> {{ region.metadata?.timezone || 'UTC' }}
              </div>
              <div>
                <strong>Edges:</strong> {{ region.usage_count || 0 }}
              </div>
              <div>
                <strong>Countries:</strong> {{ region.metadata?.countries?.length || 0 }}
              </div>
              <div>
                <strong>Status:</strong> 
                <span :class="region.active ? 'text-green-600' : 'text-red-600'">
                  {{ region.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
    
    <!-- Detailed regions table -->
    <DataTable 
      :value="types" 
      :loading="loading"
      class="p-datatable-striped"
      sortField="code"
      :sortOrder="1"
    >
      <Column field="code" header="Code" sortable>
        <template #body="{ data }">
          <code class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            {{ data.code }}
          </code>
        </template>
      </Column>
      
      <Column field="name" header="Region Name" sortable />
      
      <Column field="metadata.timezone" header="Timezone">
        <template #body="{ data }">
          {{ data.metadata?.timezone || 'UTC' }}
        </template>
      </Column>
      
      <Column field="metadata.countries" header="Countries">
        <template #body="{ data }">
          <div v-if="data.metadata?.countries?.length">
            <Badge 
              :value="data.metadata.countries.length"
              class="mr-2"
            />
            <span class="text-sm text-gray-600">
              {{ data.metadata.countries.slice(0, 3).join(', ') }}
              <span v-if="data.metadata.countries.length > 3">
                +{{ data.metadata.countries.length - 3 }} more
              </span>
            </span>
          </div>
          <span v-else class="text-gray-400">No countries defined</span>
        </template>
      </Column>
      
      <Column field="usage_count" header="Usage">
        <template #body="{ data }">
          <Badge 
            :value="data.usage_count || 0"
            :severity="data.usage_count > 0 ? 'info' : 'secondary'"
          />
          <span class="ml-2 text-sm text-gray-600">edges</span>
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
              :title="data.usage_count > 0 ? 'Cannot delete: region is in use' : 'Delete region'"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useEdgeRegion } from '@/composables/useEdgeRegion'
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
} = useEdgeRegion()

const { confirmDelete, deleteDialog, showDeleteDialog } = useConfirmation()

// Regional color classes for visual distinction
const getRegionColorClass = (regionCode) => {
  const colorMap = {
    na: 'border-blue-200 bg-blue-50',
    eu: 'border-green-200 bg-green-50',
    ap: 'border-purple-200 bg-purple-50',
    sa: 'border-yellow-200 bg-yellow-50',
    af: 'border-orange-200 bg-orange-50',
    me: 'border-red-200 bg-red-50'
  }
  return colorMap[regionCode] || 'border-gray-200 bg-gray-50'
}

const handleDelete = (region) => {
  confirmDelete(region, 'Edge Region', 'code')
}

const confirmDeleteRegion = async () => {
  if (deleteDialog.value.item) {
    await deleteType(deleteDialog.value.item.id, deleteDialog.value.item.code)
  }
}

onMounted(() => {
  fetchTypes()
})
</script>
```

### Edge Region Form

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <Card>
      <template #title>
        {{ mode === 'create' ? 'Create' : 'Edit' }} Edge Region
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic information -->
          <div class="space-y-4">
            <h3 class="font-medium">Basic Information</h3>
            
            <!-- Code field -->
            <div>
              <label class="block text-sm font-medium mb-2">Code *</label>
              <InputText
                v-model="form.code"
                :class="{ 'p-invalid': v$.code.$error }"
                placeholder="e.g., na"
                :disabled="mode === 'edit'"
                maxlength="4"
              />
              <small v-if="v$.code.$error" class="p-error">
                {{ v$.code.$errors[0].$message }}
              </small>
              <small class="text-gray-600">
                2-4 lowercase letters only
              </small>
            </div>
            
            <!-- Name field -->
            <div>
              <label class="block text-sm font-medium mb-2">Name *</label>
              <InputText
                v-model="form.name"
                :class="{ 'p-invalid': v$.name.$error }"
                placeholder="e.g., North America"
              />
            </div>
            
            <!-- Description field -->
            <div>
              <label class="block text-sm font-medium mb-2">Description *</label>
              <Textarea
                v-model="form.description"
                :class="{ 'p-invalid': v$.description.$error }"
                rows="3"
                class="w-full"
                placeholder="Describe the geographical region..."
              />
            </div>
          </div>
          
          <!-- Regional settings -->
          <div class="space-y-4">
            <h3 class="font-medium">Regional Settings</h3>
            
            <!-- Primary timezone -->
            <div>
              <label class="block text-sm font-medium mb-2">Primary Timezone</label>
              <Dropdown
                v-model="form.timezone"
                :options="timezoneOptions"
                optionLabel="label"
                optionValue="value"
                filter
                placeholder="Select timezone"
              />
            </div>
            
            <!-- Countries -->
            <div>
              <label class="block text-sm font-medium mb-2">Countries</label>
              <MultiSelect
                v-model="form.countries"
                :options="countryOptions"
                optionLabel="label"
                optionValue="value"
                filter
                placeholder="Select countries"
                :maxSelectedLabels="3"
                selectedItemsLabel="{0} countries selected"
              />
            </div>
            
            <!-- Coordinates (for mapping) -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Center Latitude</label>
                <InputNumber
                  v-model="form.coordinates.lat"
                  :min="-90"
                  :max="90"
                  :step="0.000001"
                  placeholder="0.000000"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Center Longitude</label>
                <InputNumber
                  v-model="form.coordinates.lng"
                  :min="-180"
                  :max="180"
                  :step="0.000001"
                  placeholder="0.000000"
                />
              </div>
            </div>
          </div>
          
          <!-- Operational settings -->
          <div class="md:col-span-2">
            <h3 class="font-medium mb-4">Operational Settings</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Active status -->
              <div class="flex items-center">
                <Checkbox
                  v-model="form.active"
                  inputId="active"
                  :binary="true"
                />
                <label for="active" class="ml-2">Active region</label>
              </div>
              
              <!-- Primary region -->
              <div class="flex items-center">
                <Checkbox
                  v-model="form.is_primary"
                  inputId="primary"
                  :binary="true"
                />
                <label for="primary" class="ml-2">Primary region</label>
              </div>
              
              <!-- DR region -->
              <div class="flex items-center">
                <Checkbox
                  v-model="form.disaster_recovery"
                  inputId="dr"
                  :binary="true"
                />
                <label for="dr" class="ml-2">Disaster recovery</label>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2">
          <Button 
            type="submit"
            :label="mode === 'create' ? 'Create Region' : 'Update Region'"
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
import { useEdgeRegion } from '@/composables/useEdgeRegion'

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
} = useEdgeRegion()

// Form state
const form = ref({
  code: '',
  name: '',
  description: '',
  timezone: 'UTC',
  countries: [],
  coordinates: {
    lat: null,
    lng: null
  },
  active: true,
  is_primary: false,
  disaster_recovery: false
})

// Region-specific validation rules
const rules = {
  code: { 
    required,
    minLength: minLength(2),
    maxLength: maxLength(4),
    validFormat: helpers.withMessage(
      'Code must be 2-4 lowercase letters only', 
      (value) => /^[a-z]{2,4}$/.test(value)
    ),
    unique: helpers.withMessage('Code must be unique', validateCode)
  },
  name: { required },
  description: { required }
}

const v$ = useVuelidate(rules, form)

// Timezone options (common timezones)
const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'America/Chicago (CST)', value: 'America/Chicago' },
  { label: 'Europe/London (GMT)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
  { label: 'Australia/Sydney (AEST)', value: 'Australia/Sydney' }
]

// Country options (subset for example)
const countryOptions = [
  // North America
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'CA' },
  { label: 'Mexico', value: 'MX' },
  
  // Europe
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Spain', value: 'ES' },
  { label: 'Italy', value: 'IT' },
  
  // Asia Pacific
  { label: 'Japan', value: 'JP' },
  { label: 'China', value: 'CN' },
  { label: 'South Korea', value: 'KR' },
  { label: 'Australia', value: 'AU' },
  { label: 'India', value: 'IN' },
  
  // Other regions
  { label: 'Brazil', value: 'BR' },
  { label: 'South Africa', value: 'ZA' },
  { label: 'Saudi Arabia', value: 'SA' }
]

const handleSubmit = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  // Prepare data with metadata
  const regionData = {
    code: form.value.code,
    name: form.value.name,
    description: form.value.description,
    active: form.value.active,
    metadata: {
      timezone: form.value.timezone,
      countries: form.value.countries,
      coordinates: form.value.coordinates,
      is_primary: form.value.is_primary,
      disaster_recovery: form.value.disaster_recovery
    }
  }
  
  let result
  if (props.mode === 'create') {
    result = await createType(regionData)
  } else {
    result = await updateType(props.initialData.id, regionData)
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
    form.value.active = props.initialData.active !== false
    
    // Extract metadata
    if (props.initialData.metadata) {
      const meta = props.initialData.metadata
      form.value.timezone = meta.timezone || 'UTC'
      form.value.countries = meta.countries || []
      form.value.coordinates = meta.coordinates || { lat: null, lng: null }
      form.value.is_primary = meta.is_primary || false
      form.value.disaster_recovery = meta.disaster_recovery || false
    }
  }
})
</script>
```

### Integration with Edge Management

```vue
<template>
  <div class="edge-region-selector">
    <!-- Region selection with visual indicators -->
    <div>
      <label class="block text-sm font-medium mb-2">Edge Region *</label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div 
          v-for="region in regionOptions" 
          :key="region.value"
          class="border-2 rounded-lg p-3 cursor-pointer transition-all"
          :class="getRegionSelectionClass(region.value)"
          @click="selectRegion(region.value)"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium">{{ region.label }}</span>
            <Badge 
              :value="region.value.toUpperCase()"
              class="font-mono text-xs"
            />
          </div>
          
          <div class="text-xs text-gray-600 space-y-1">
            <div>{{ getRegionTimezone(region.value) }}</div>
            <div>{{ getRegionCountryCount(region.value) }} countries</div>
          </div>
          
          <!-- Selection indicator -->
          <div v-if="form.region === region.value" class="mt-2">
            <i class="pi pi-check text-green-600"></i>
            <span class="text-sm text-green-600 ml-1">Selected</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Region-specific information -->
    <Card v-if="selectedRegionInfo" class="mt-4">
      <template #title>Regional Information</template>
      <template #content>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Primary Timezone:</strong> {{ selectedRegionInfo.metadata?.timezone }}
          </div>
          <div>
            <strong>Coordinates:</strong> 
            <span v-if="selectedRegionInfo.metadata?.coordinates?.lat">
              {{ selectedRegionInfo.metadata.coordinates.lat.toFixed(4) }}, 
              {{ selectedRegionInfo.metadata.coordinates.lng.toFixed(4) }}
            </span>
            <span v-else class="text-gray-400">Not specified</span>
          </div>
          <div class="col-span-2">
            <strong>Countries:</strong>
            <div class="flex flex-wrap gap-1 mt-1">
              <Badge 
                v-for="country in selectedRegionInfo.metadata?.countries" 
                :key="country"
                :value="country"
                class="text-xs"
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
import { useEdgeRegion } from '@/composables/useEdgeRegion'

const { getRegionOptions, types: regions } = useEdgeRegion()

const form = ref({
  region: ''
})

const regionOptions = ref([])

// Find selected region info
const selectedRegionInfo = computed(() => {
  if (!form.value.region) return null
  return regions.value.find(region => region.code === form.value.region)
})

// Load region options
const loadRegionOptions = async () => {
  regionOptions.value = await getRegionOptions()
}

const getRegionSelectionClass = (regionCode) => {
  const isSelected = form.value.region === regionCode
  return isSelected 
    ? 'border-blue-500 bg-blue-50' 
    : 'border-gray-200 hover:border-gray-300'
}

const selectRegion = (regionCode) => {
  form.value.region = regionCode
}

const getRegionTimezone = (regionCode) => {
  const region = regions.value.find(r => r.code === regionCode)
  return region?.metadata?.timezone || 'UTC'
}

const getRegionCountryCount = (regionCode) => {
  const region = regions.value.find(r => r.code === regionCode)
  return region?.metadata?.countries?.length || 0
}

// Load options on mount
onMounted(() => {
  loadRegionOptions()
})
</script>
```

---

## Best Practices

### 1. Use Standard Region Codes

```javascript
// ✅ Good - standard geographical codes
const regionCodes = {
  NORTH_AMERICA: 'na',
  EUROPE: 'eu',
  ASIA_PACIFIC: 'ap',
  SOUTH_AMERICA: 'sa',
  AFRICA: 'af',
  MIDDLE_EAST: 'me',
  OCEANIA: 'oc'
}

// ❌ Avoid - non-standard or confusing codes
const badCodes = {
  USA: 'usa',          // Too specific
  EUROPE: 'europe',    // Too long
  ASIA: 'AS'          // Uppercase
}
```

### 2. Include Comprehensive Regional Data

```javascript
// ✅ Good - comprehensive regional metadata
const regionData = {
  code: 'na',
  name: 'North America',
  description: 'North American region including USA, Canada, and Mexico',
  metadata: {
    timezone: 'America/New_York',
    countries: ['US', 'CA', 'MX'],
    coordinates: {
      lat: 39.8283,
      lng: -98.5795
    },
    is_primary: true,
    disaster_recovery: false,
    currency: 'USD',
    languages: ['en', 'es', 'fr']
  }
}
```

### 3. Handle Timezone Considerations

```javascript
// ✅ Good - timezone-aware operations
const { getRegionOptions } = useEdgeRegion()

const getRegionTime = (regionCode) => {
  const region = regions.find(r => r.code === regionCode)
  const timezone = region?.metadata?.timezone || 'UTC'
  
  return dayjs().tz(timezone).format('YYYY-MM-DD HH:mm:ss')
}

// Use in regional reports
const generateRegionalReport = (regionCode) => {
  const regionTime = getRegionTime(regionCode)
  console.log(`Report generated at ${regionTime} (${regionCode} time)`)
}
```

### 4. Validate Regional Constraints

```javascript
// ✅ Good - validate region-specific constraints
const validateRegionalDeployment = (edgeData) => {
  const region = regions.find(r => r.code === edgeData.region)
  
  if (!region || !region.active) {
    throw new Error(`Region ${edgeData.region} is not available`)
  }
  
  if (region.metadata?.is_primary === false && !edgeData.backup_region) {
    throw new Error('Secondary regions require a backup region')
  }
  
  return true
}
```

### 5. Provide Regional Insights

```javascript
// ✅ Good - regional analytics and insights
const getRegionalStats = async (regionCode) => {
  const region = regions.find(r => r.code === regionCode)
  
  const stats = {
    region: region.name,
    timezone: region.metadata?.timezone,
    edgeCount: await edgeService.countByRegion(regionCode),
    locationCount: await locationService.countByRegion(regionCode),
    activeDevices: await thingService.countActiveByRegion(regionCode),
    lastActivity: await getLastActivityByRegion(regionCode)
  }
  
  return stats
}
```

The `useEdgeRegion` composable provides comprehensive geographical region management with timezone awareness, country organization, and operational settings, making it ideal for managing global edge deployments across different geographical regions.
