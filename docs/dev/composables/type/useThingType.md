# useThingType

## Overview

The `useThingType` composable manages IoT device/thing type definitions and provides specialized functionality for device categorization and capability management. It extends the base `useTypeManagement` composable with device-specific features like protocol support, measurement capabilities, and power requirements.

## Location

```
src/composables/useThingType.js
```

## Purpose

- **Thing Type Management**: Complete CRUD operations for IoT device type definitions
- **Type Options**: Formatted options for dropdown components
- **Device Capabilities**: Sensor, actuator, and communication capabilities
- **Protocol Support**: Communication protocol definitions per device type
- **Power Management**: Power consumption and battery specifications
- **Validation**: Thing type-specific validation rules
- **Inheritance**: Extends base type management functionality

## Dependencies

```javascript
import { useTypeManagement } from './useTypeManagement'
import { thingTypeService } from '@/services'
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
  
  // Thing type specific
  getTypeOptions: Function
}
```

---

## Thing Type Specific Methods

### getTypeOptions()

Returns thing types formatted for dropdown components.

**Returns:** `Promise<Array>`

**Return Structure:**

```javascript
[
  { label: "Temperature Sensor", value: "temp-sensor" },
  { label: "Motion Detector", value: "motion-detector" },
  { label: "Smart Light", value: "smart-light" },
  { label: "Door Lock", value: "door-lock" },
  { label: "Gateway", value: "gateway" },
  { label: "Camera", value: "camera" }
]
```

**Usage:**

```javascript
const { getTypeOptions } = useThingType()

const typeOptions = await getTypeOptions()

// Use in dropdown component
<Dropdown
  v-model="selectedType"
  :options="typeOptions"
  optionLabel="label"
  optionValue="value"
  placeholder="Select device type"
/>
```

---

## Thing Type Validation

Thing types follow specific validation rules:

### Code Format
- **Length**: 3-40 characters
- **Pattern**: Lowercase letters, numbers, and hyphens
- **Examples**: `temp-sensor`, `motion-detector`, `smart-light`

### Common Thing Type Codes
- `temp-sensor` - Temperature sensors
- `humidity-sensor` - Humidity sensors
- `motion-detector` - Motion detection devices
- `smart-light` - Intelligent lighting
- `door-lock` - Smart door locks
- `camera` - Security cameras
- `gateway` - Communication gateways
- `actuator` - Control actuators
- `switch` - Smart switches
- `meter` - Utility meters

---

## Usage Examples

### Thing Type Management with Device Capabilities

```vue
<template>
  <div class="thing-type-management">
    <!-- Header with device category overview -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Device Types</h1>
        <p class="text-gray-600">Manage IoT device categories and capabilities</p>
      </div>
      <Button 
        label="Add Device Type"
        icon="pi pi-plus"
        @click="navigateToTypeCreate()"
      />
    </div>
    
    <!-- Device category overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card 
        v-for="category in deviceCategories" 
        :key="category.name"
        class="text-center"
        :class="category.color"
      >
        <template #content>
          <div class="space-y-2">
            <i :class="category.icon" class="text-2xl"></i>
            <div class="font-medium">{{ category.name }}</div>
            <div class="text-sm opacity-75">{{ category.count }} types</div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Device types table with capabilities -->
    <DataTable 
      :value="types" 
      :loading="loading"
      class="p-datatable-striped"
      sortField="name"
      :sortOrder="1"
    >
      <Column field="code" header="Code" sortable>
        <template #body="{ data }">
          <code class="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
            {{ data.code }}
          </code>
        </template>
      </Column>
      
      <Column field="name" header="Device Type" sortable>
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i :class="getDeviceIcon(data.metadata?.category)" class="text-lg"></i>
            <span>{{ data.name }}</span>
          </div>
        </template>
      </Column>
      
      <Column field="category" header="Category">
        <template #body="{ data }">
          <Badge 
            :value="data.metadata?.category || 'Generic'"
            :class="getCategoryClass(data.metadata?.category)"
          />
        </template>
      </Column>
      
      <Column field="capabilities" header="Capabilities">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Badge 
              v-for="capability in getDeviceCapabilities(data)" 
              :key="capability"
              :value="capability"
              class="text-xs"
              severity="info"
            />
          </div>
        </template>
      </Column>
      
      <Column field="protocols" header="Protocols">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Badge 
              v-for="protocol in data.metadata?.protocols || []" 
              :key="protocol"
              :value="protocol"
              class="text-xs"
              severity="secondary"
            />
          </div>
        </template>
      </Column>
      
      <Column field="power" header="Power">
        <template #body="{ data }">
          <div v-if="data.metadata?.power" class="text-sm">
            <div>{{ data.metadata.power.type }}</div>
            <div class="text-gray-600">
              {{ data.metadata.power.consumption }}W
            </div>
          </div>
          <span v-else class="text-gray-400">Not specified</span>
        </template>
      </Column>
      
      <Column field="usage_count" header="Usage">
        <template #body="{ data }">
          <Badge 
            :value="data.usage_count || 0"
            :severity="data.usage_count > 0 ? 'info' : 'secondary'"
          />
          <span class="ml-2 text-sm text-gray-600">devices</span>
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
import { useThingType } from '@/composables/useThingType'
import { useConfirmation } from '@/composables/useConfirmation'

const { 
  types, 
  loading,
  fetchTypes,
  deleteType,
  navigateToTypeDetail,
  navigateToTypeEdit,
  navigateToTypeCreate
} = useThingType()

const { confirmDelete, deleteDialog } = useConfirmation()

// Categorize device types
const deviceCategories = computed(() => {
  const categories = {
    'Sensors': { count: 0, icon: 'pi pi-eye', color: 'bg-blue-50 text-blue-700' },
    'Actuators': { count: 0, icon: 'pi pi-cog', color: 'bg-green-50 text-green-700' },
    'Gateways': { count: 0, icon: 'pi pi-wifi', color: 'bg-purple-50 text-purple-700' },
    'Smart Devices': { count: 0, icon: 'pi pi-mobile', color: 'bg-orange-50 text-orange-700' }
  }
  
  types.value.forEach(type => {
    const category = type.metadata?.category || 'Smart Devices'
    if (categories[category]) {
      categories[category].count++
    }
  })
  
  return Object.entries(categories).map(([name, data]) => ({
    name,
    ...data
  }))
})

const getDeviceIcon = (category) => {
  const icons = {
    'Sensors': 'pi pi-eye',
    'Actuators': 'pi pi-cog', 
    'Gateways': 'pi pi-wifi',
    'Smart Devices': 'pi pi-mobile'
  }
  return icons[category] || 'pi pi-circle'
}

const getCategoryClass = (category) => {
  const classes = {
    'Sensors': 'bg-blue-100 text-blue-800',
    'Actuators': 'bg-green-100 text-green-800',
    'Gateways': 'bg-purple-100 text-purple-800',
    'Smart Devices': 'bg-orange-100 text-orange-800'
  }
  return classes[category] || 'bg-gray-100 text-gray-800'
}

const getDeviceCapabilities = (device) => {
  const capabilities = []
  const deviceCaps = device.metadata?.capabilities || {}
  
  if (deviceCaps.sensing) capabilities.push('Sensing')
  if (deviceCaps.control) capabilities.push('Control')
  if (deviceCaps.communication) capabilities.push('Communication')
  if (deviceCaps.processing) capabilities.push('Processing')
  if (deviceCaps.storage) capabilities.push('Storage')
  
  return capabilities
}

const handleDelete = (type) => {
  confirmDelete(type, 'Device Type', 'code')
}

onMounted(() => {
  fetchTypes()
})
</script>
```

### Thing Type Form with Device Specifications

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
                placeholder="e.g., temp-sensor"
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
                placeholder="e.g., Temperature Sensor"
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
                placeholder="Describe the device type and its purpose..."
              />
            </div>
            
            <!-- Manufacturer info -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Manufacturer</label>
                <InputText
                  v-model="form.manufacturer"
                  placeholder="e.g., Bosch"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Model Series</label>
                <InputText
                  v-model="form.model_series"
                  placeholder="e.g., BME280"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Device capabilities -->
      <Card>
        <template #title>Device Capabilities</template>
        <template #content>
          <div class="space-y-4">
            <!-- Primary capabilities -->
            <div>
              <label class="block text-sm font-medium mb-2">Primary Capabilities</label>
              <div class="grid grid-cols-2 gap-2">
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.capabilities.sensing"
                    inputId="sensing"
                    :binary="true"
                  />
                  <label for="sensing" class="ml-2">Sensing</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.capabilities.control"
                    inputId="control"
                    :binary="true"
                  />
                  <label for="control" class="ml-2">Control</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.capabilities.communication"
                    inputId="communication"
                    :binary="true"
                  />
                  <label for="communication" class="ml-2">Communication</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.capabilities.processing"
                    inputId="processing"
                    :binary="true"
                  />
                  <label for="processing" class="ml-2">Processing</label>
                </div>
              </div>
            </div>
            
            <!-- Measurement types (for sensors) -->
            <div v-if="form.capabilities.sensing">
              <label class="block text-sm font-medium mb-2">Measurement Types</label>
              <MultiSelect
                v-model="form.measurements"
                :options="measurementOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select measurements"
                :maxSelectedLabels="3"
              />
            </div>
            
            <!-- Control types (for actuators) -->
            <div v-if="form.capabilities.control">
              <label class="block text-sm font-medium mb-2">Control Types</label>
              <MultiSelect
                v-model="form.controls"
                :options="controlOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select control types"
                :maxSelectedLabels="3"
              />
            </div>
            
            <!-- Communication protocols -->
            <div>
              <label class="block text-sm font-medium mb-2">Supported Protocols</label>
              <MultiSelect
                v-model="form.protocols"
                :options="protocolOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select protocols"
                :maxSelectedLabels="3"
              />
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Technical specifications -->
      <Card>
        <template #title>Technical Specifications</template>
        <template #content>
          <div class="space-y-4">
            <!-- Power requirements -->
            <div>
              <h4 class="font-medium mb-2">Power Requirements</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Power Type</label>
                  <Dropdown
                    v-model="form.power.type"
                    :options="powerTypeOptions"
                    placeholder="Select power type"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Consumption (W)</label>
                  <InputNumber
                    v-model="form.power.consumption"
                    :step="0.1"
                    :min="0"
                    placeholder="0.0"
                  />
                </div>
              </div>
              
              <!-- Battery specs (if battery powered) -->
              <div v-if="form.power.type === 'battery'" class="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label class="block text-sm font-medium mb-2">Battery Life (hours)</label>
                  <InputNumber
                    v-model="form.power.battery_life"
                    :min="1"
                    placeholder="720"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Replaceable Battery</label>
                  <div class="flex items-center">
                    <Checkbox
                      v-model="form.power.replaceable_battery"
                      inputId="replaceable"
                      :binary="true"
                    />
                    <label for="replaceable" class="ml-2">Yes</label>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Operating conditions -->
            <div>
              <h4 class="font-medium mb-2">Operating Conditions</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Temperature Range (°C)</label>
                  <div class="flex gap-2">
                    <InputNumber
                      v-model="form.operating_conditions.temp_min"
                      placeholder="-20"
                    />
                    <span class="self-center">to</span>
                    <InputNumber
                      v-model="form.operating_conditions.temp_max"
                      placeholder="60"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Humidity Range (%)</label>
                  <div class="flex gap-2">
                    <InputNumber
                      v-model="form.operating_conditions.humidity_min"
                      :min="0"
                      :max="100"
                      placeholder="0"
                    />
                    <span class="self-center">to</span>
                    <InputNumber
                      v-model="form.operating_conditions.humidity_max"
                      :min="0"
                      :max="100"
                      placeholder="95"
                    />
                  </div>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label class="block text-sm font-medium mb-2">IP Rating</label>
                  <Dropdown
                    v-model="form.operating_conditions.ip_rating"
                    :options="ipRatingOptions"
                    placeholder="Select IP rating"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Mounting</label>
                  <Dropdown
                    v-model="form.mounting"
                    :options="mountingOptions"
                    placeholder="Select mounting type"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Data specifications -->
      <Card>
        <template #title>Data Specifications</template>
        <template #content>
          <div class="space-y-4">
            <!-- Data reporting -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Report Interval (sec)</label>
                <InputNumber
                  v-model="form.data.report_interval"
                  :min="1"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Data Retention (days)</label>
                <InputNumber
                  v-model="form.data.retention_days"
                  :min="1"
                  placeholder="30"
                />
              </div>
            </div>
            
            <!-- Data format -->
            <div>
              <label class="block text-sm font-medium mb-2">Data Format</label>
              <Dropdown
                v-model="form.data.format"
                :options="dataFormatOptions"
                placeholder="Select data format"
              />
            </div>
            
            <!-- Security features -->
            <div>
              <label class="block text-sm font-medium mb-2">Security Features</label>
              <div class="grid grid-cols-2 gap-2">
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.security.encryption"
                    inputId="encryption"
                    :binary="true"
                  />
                  <label for="encryption" class="ml-2">Data Encryption</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.security.authentication"
                    inputId="authentication"
                    :binary="true"
                  />
                  <label for="authentication" class="ml-2">Authentication</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.security.secure_boot"
                    inputId="secure_boot"
                    :binary="true"
                  />
                  <label for="secure_boot" class="ml-2">Secure Boot</label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="form.security.ota_updates"
                    inputId="ota_updates"
                    :binary="true"
                  />
                  <label for="ota_updates" class="ml-2">OTA Updates</label>
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
        :label="mode === 'create' ? 'Create Device Type' : 'Update Device Type'"
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
import { ref, onMounted } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { useThingType } from '@/composables/useThingType'

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
} = useThingType()

// Form state
const form = ref({
  code: '',
  name: '',
  description: '',
  category: 'Sensors',
  manufacturer: '',
  model_series: '',
  capabilities: {
    sensing: false,
    control: false,
    communication: false,
    processing: false
  },
  measurements: [],
  controls: [],
  protocols: [],
  power: {
    type: 'mains',
    consumption: 5.0,
    battery_life: null,
    replaceable_battery: false
  },
  operating_conditions: {
    temp_min: -20,
    temp_max: 60,
    humidity_min: 0,
    humidity_max: 95,
    ip_rating: 'IP20'
  },
  mounting: 'wall',
  data: {
    report_interval: 30,
    retention_days: 30,
    format: 'json'
  },
  security: {
    encryption: false,
    authentication: false,
    secure_boot: false,
    ota_updates: false
  }
})

// Validation rules
const rules = {
  code: { required, unique: validateCode },
  name: { required },
  description: { required }
}

const v$ = useVuelidate(rules, form)

// Options
const categoryOptions = ['Sensors', 'Actuators', 'Gateways', 'Smart Devices']

const measurementOptions = [
  { label: 'Temperature', value: 'temperature' },
  { label: 'Humidity', value: 'humidity' },
  { label: 'Pressure', value: 'pressure' },
  { label: 'Light', value: 'light' },
  { label: 'Motion', value: 'motion' },
  { label: 'Sound', value: 'sound' },
  { label: 'Air Quality', value: 'air_quality' },
  { label: 'Vibration', value: 'vibration' }
]

const controlOptions = [
  { label: 'On/Off', value: 'on_off' },
  { label: 'Dimming', value: 'dimming' },
  { label: 'Speed Control', value: 'speed' },
  { label: 'Position', value: 'position' },
  { label: 'Temperature', value: 'temperature' },
  { label: 'Color', value: 'color' }
]

const protocolOptions = [
  { label: 'WiFi', value: 'wifi' },
  { label: 'Bluetooth', value: 'bluetooth' },
  { label: 'Zigbee', value: 'zigbee' },
  { label: 'Z-Wave', value: 'zwave' },
  { label: 'LoRaWAN', value: 'lorawan' },
  { label: 'MQTT', value: 'mqtt' },
  { label: 'HTTP/REST', value: 'http' },
  { label: 'Modbus', value: 'modbus' }
]

const powerTypeOptions = ['mains', 'battery', 'solar', 'poe']

const ipRatingOptions = ['IP20', 'IP40', 'IP54', 'IP65', 'IP67', 'IP68']

const mountingOptions = ['wall', 'ceiling', 'desk', 'pole', 'din_rail', 'embedded']

const dataFormatOptions = ['json', 'xml', 'csv', 'binary']

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
      manufacturer: form.value.manufacturer,
      model_series: form.value.model_series,
      capabilities: form.value.capabilities,
      measurements: form.value.measurements,
      controls: form.value.controls,
      protocols: form.value.protocols,
      power: form.value.power,
      operating_conditions: form.value.operating_conditions,
      mounting: form.value.mounting,
      data: form.value.data,
      security: form.value.security
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
      Object.keys(form.value).forEach(key => {
        if (meta[key] && typeof meta[key] === 'object') {
          Object.assign(form.value[key], meta[key])
        } else if (meta[key] !== undefined) {
          form.value[key] = meta[key]
        }
      })
    }
  }
})
</script>
```

---

## Best Practices

### 1. Use Descriptive Device Type Codes

```javascript
// ✅ Good - descriptive and specific codes
const deviceTypeCodes = {
  TEMP_SENSOR: 'temp-sensor',
  HUMIDITY_SENSOR: 'humidity-sensor',
  MOTION_DETECTOR: 'motion-detector',
  SMART_LIGHT: 'smart-light',
  DOOR_LOCK: 'door-lock'
}

// ❌ Avoid - generic or unclear codes
const badCodes = {
  SENSOR: 'sensor',        // Too generic
  DEVICE: 'device1',       // Contains numbers
  THING: 'thing'          // Not descriptive
}
```

### 2. Structure Device Capabilities Comprehensively

```javascript
// ✅ Good - comprehensive device type metadata
const deviceTypeData = {
  code: 'temp-sensor',
  name: 'Temperature Sensor',
  description: 'High-precision temperature monitoring device',
  metadata: {
    category: 'Sensors',
    manufacturer: 'Bosch',
    model_series: 'BME280',
    capabilities: {
      sensing: true,
      control: false,
      communication: true,
      processing: true,
      storage: false
    },
    measurements: ['temperature', 'humidity', 'pressure'],
    protocols: ['wifi', 'mqtt'],
    power: {
      type: 'battery',
      consumption: 0.1,
      battery_life: 8760, // hours (1 year)
      replaceable_battery: true
    },
    operating_conditions: {
      temp_min: -40,
      temp_max: 85,
      humidity_min: 0,
      humidity_max: 100,
      ip_rating: 'IP67'
    },
    data: {
      report_interval: 300, // 5 minutes
      retention_days: 90,
      format: 'json'
    },
    accuracy: {
      temperature: 0.1, // °C
      humidity: 2.0,     // %RH
      pressure: 1.0      // Pa
    }
  }
}
```

### 3. Validate Device-Specific Requirements

```javascript
// ✅ Good - device type validation
const validateDeviceRequirements = (deviceData, deviceType) => {
  const typeSpecs = deviceType.metadata
  
  // Power validation
  if (typeSpecs.power?.type === 'battery' && !deviceData.battery_level) {
    console.warn('Battery-powered device should include battery level monitoring')
  }
  
  // Protocol validation
  if (typeSpecs.protocols?.includes('wifi') && !deviceData.network_config) {
    throw new Error('WiFi devices require network configuration')
  }
  
  // Operating conditions validation
  if (typeSpecs.operating_conditions) {
    const conditions = typeSpecs.operating_conditions
    if (deviceData.environment?.temperature < conditions.temp_min ||
        deviceData.environment?.temperature > conditions.temp_max) {
      console.warn('Device operating outside temperature range')
    }
  }
  
  return true
}
```

### 4. Provide Protocol-Specific Templates

```javascript
// ✅ Good - protocol configuration templates
const getProtocolTemplate = (protocols) => {
  const templates = {}
  
  if (protocols.includes('wifi')) {
    templates.wifi = {
      security: 'WPA2',
      frequency: '2.4GHz',
      connection_timeout: 30
    }
  }
  
  if (protocols.includes('mqtt')) {
    templates.mqtt = {
      qos: 1,
      retain: false,
      keepalive: 60,
      clean_session: true
    }
  }
  
  if (protocols.includes('zigbee')) {
    templates.zigbee = {
      channel: 11,
      pan_id: 0x1234,
      security_key: true
    }
  }
  
  return templates
}
```

### 5. Handle Measurement Units and Ranges

```javascript
// ✅ Good - measurement specifications with units
const getMeasurementSpecs = (deviceType) => {
  const measurements = deviceType.metadata?.measurements || []
  
  const specs = {
    temperature: {
      unit: '°C',
      range: { min: -40, max: 125 },
      accuracy: 0.1,
      resolution: 0.01
    },
    humidity: {
      unit: '%RH',
      range: { min: 0, max: 100 },
      accuracy: 2.0,
      resolution: 0.1
    },
    pressure: {
      unit: 'Pa',
      range: { min: 30000, max: 110000 },
      accuracy: 1.0,
      resolution: 0.01
    }
  }
  
  return measurements.reduce((result, measurement) => {
    if (specs[measurement]) {
      result[measurement] = specs[measurement]
    }
    return result
  }, {})
}
```

The `useThingType` composable provides comprehensive IoT device type management with detailed capability definitions, protocol support, and technical specifications, making it ideal for managing diverse IoT device ecosystems with proper categorization and validation.
