<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="card p-6 text-center">
      <div class="text-red-500 text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load location details
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Location Details -->
    <div v-else-if="location">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">
            <router-link :to="{ name: 'edges' }" class="text-primary-600 hover:underline">
              Edges
            </router-link>
            <i class="pi pi-angle-right mx-1 text-gray-400"></i>
            <router-link 
              :to="{ name: 'edge-detail', params: { id: location.edge_id } }" 
              class="text-primary-600 hover:underline"
            >
              {{ location.expand?.edge_id?.code || 'Unknown Edge' }}
            </router-link>
            <i class="pi pi-angle-right mx-1 text-gray-400"></i>
            Locations
          </div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ location.name }}</h1>
          <div class="text-gray-600">
            <span class="font-mono">{{ location.code }}</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToEdit"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="confirmDelete"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="card lg:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Location Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Code -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Code</div>
              <div class="font-mono text-lg">{{ location.code }}</div>
            </div>
            
            <!-- Name -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Name</div>
              <div class="text-lg">{{ location.name }}</div>
            </div>
            
            <!-- Path -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Path</div>
              <div class="flex flex-wrap gap-1 items-center">
                <span v-for="(segment, index) in parseLocationPath(location.path)" :key="index" class="flex items-center">
                  <span v-if="index > 0" class="text-gray-400 mx-1">/</span>
                  <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm">{{ segment }}</span>
                </span>
              </div>
            </div>
            
            <!-- Type -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Type</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="getTypeClass(location.type)"
                >
                  {{ getTypeName(location.type) }}
                </span>
              </div>
            </div>
            
            <!-- Edge Reference -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Edge</div>
              <router-link 
                :to="{ name: 'edge-detail', params: { id: location.edge_id } }"
                class="text-primary-600 hover:underline flex items-center"
              >
                <span class="font-medium">{{ location.expand?.edge_id?.code || 'Unknown Edge' }}</span>
                <span class="text-gray-500 ml-2 text-sm">{{ location.expand?.edge_id?.name || '' }}</span>
              </router-link>
            </div>
            
            <!-- Metadata (if any) -->
            <div v-if="hasMetadata" class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Metadata</div>
              <div class="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
                <pre>{{ JSON.stringify(location.metadata, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Things/Quick Info Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Things</h2>
          
          <div class="space-y-6">
            <!-- Things Count -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Connected Things</div>
              <div class="flex items-center">
                <i class="pi pi-wifi text-purple-600 mr-2"></i>
                <div class="text-2xl font-semibold">{{ things.length }}</div>
              </div>
              <Button
                label="View Things"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm mt-2"
                @click="navigateToThings"
              />
            </div>
            
            <!-- Thing Types -->
            <div v-if="uniqueThingTypes.length > 0">
              <div class="text-sm text-gray-500 mb-1">Thing Types</div>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="type in uniqueThingTypes" 
                  :key="type"
                  class="px-2 py-1 text-xs rounded-full font-medium"
                  :class="getThingTypeClass(type)"
                >
                  {{ getThingTypeName(type) }}
                </span>
              </div>
            </div>
            
            <!-- Created Date -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(location.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(location.updated) }}</div>
            </div>
          </div>
          
          <!-- Add Thing Button -->
          <div class="mt-6">
            <Button
              label="Add Thing to This Location"
              icon="pi pi-plus"
              @click="navigateToCreateThing"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <!-- Things List -->
      <div class="card mt-6" v-if="things.length > 0">
        <h2 class="text-xl font-semibold mb-4">Connected Things</h2>
        
        <DataTable
          :items="things"
          :columns="thingColumns"
          :loading="thingsLoading"
          :searchable="true"
          empty-message="No things found for this location"
          @row-click="navigateToThingDetail"
        >
          <!-- Thing Code column -->
          <template #thing_code-body="{ data }">
            <div class="font-medium text-primary-700 font-mono">{{ data.thing_code }}</div>
          </template>
          
          <!-- Type column with badge -->
          <template #thing_type-body="{ data }">
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="getThingTypeClass(data.thing_type)"
            >
              {{ getThingTypeName(data.thing_type) }}
            </span>
          </template>
          
          <!-- Status column with badge -->
          <template #active-body="{ data }">
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="data.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            >
              {{ data.active ? 'Active' : 'Inactive' }}
            </span>
          </template>
          
          <!-- Actions column -->
          <template #actions="{ data }">
            <div class="flex gap-1 justify-center">
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToThingDetail(data)"
                tooltip="View"
                tooltipOptions="{ position: 'top' }"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:visible="deleteDialog.visible"
      title="Delete Location"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete location '${location?.code || ''}'?`"
      details="This action cannot be undone. All things associated with this location will be orphaned or deleted."
      @confirm="deleteLocation"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { locationService, locationTypes, parseLocationPath } from '../../../services/location'
import { thingService, thingTypes } from '../../../services/thing'
import DataTable from '../../../components/common/DataTable.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Data
const location = ref(null)
const loading = ref(true)
const error = ref(null)
const deleteDialog = ref({
  visible: false,
  loading: false
})

// Things data
const things = ref([])
const thingsLoading = ref(false)

// Check if we have metadata
const hasMetadata = computed(() => {
  return location.value && 
         location.value.metadata && 
         (typeof location.value.metadata === 'object' ? 
          Object.keys(location.value.metadata).length > 0 : 
          location.value.metadata !== '{}')
})

// Get unique thing types - renamed to avoid conflict with imported thingTypes
const uniqueThingTypes = computed(() => {
  return [...new Set(things.value.map(thing => thing.thing_type))]
})

// Thing columns for the table
const thingColumns = [
  { field: 'thing_code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'thing_type', header: 'Type', sortable: true },
  { field: 'active', header: 'Status', sortable: true }
]

// Fetch location data on component mount
onMounted(async () => {
  await fetchLocation()
})

// Methods
const fetchLocation = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid location ID'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const response = await locationService.getLocation(id)
    location.value = response.data
    
    // Parse metadata if it's a string
    if (location.value.metadata && typeof location.value.metadata === 'string') {
      try {
        location.value.metadata = JSON.parse(location.value.metadata)
      } catch (e) {
        console.warn('Failed to parse metadata for location:', location.value.code)
        location.value.metadata = {}
      }
    }
    
    // Now fetch things for this location
    await fetchThings()
  } catch (err) {
    console.error('Error fetching location:', err)
    error.value = 'Failed to load location details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch things for this location
const fetchThings = async () => {
  if (!location.value) return
  
  thingsLoading.value = true
  try {
    const response = await thingService.getThingsByLocation(location.value.id)
    things.value = response.data.items || []
  } catch (err) {
    console.error('Error fetching things:', err)
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Failed to load things for this location',
      life: 3000
    })
  } finally {
    thingsLoading.value = false
  }
}

const navigateToEdit = () => {
  router.push({ name: 'edit-location', params: { id: location.value.id } })
}

const navigateToThings = () => {
  router.push({ 
    name: 'things', 
    query: { location: location.value.id } 
  })
}

const navigateToCreateThing = () => {
  router.push({ 
    name: 'create-thing', 
    query: { location_id: location.value.id } 
  })
}

const navigateToThingDetail = (thing) => {
  router.push({ name: 'thing-detail', params: { id: thing.id } })
}

const confirmDelete = () => {
  deleteDialog.value.visible = true
}

const deleteLocation = async () => {
  deleteDialog.value.loading = true
  try {
    await locationService.deleteLocation(location.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Location ${location.value.code} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
    router.push({ name: 'locations' })
  } catch (error) {
    console.error('Error deleting location:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete location',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

// Helper methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return dayjs(dateString).format('MMM D, YYYY HH:mm')
}

const getTypeName = (typeCode) => {
  const type = locationTypes.find(t => t.value === typeCode)
  return type ? type.label : typeCode
}

const getTypeClass = (typeCode) => {
  switch (typeCode) {
    case 'entrance': return 'bg-blue-100 text-blue-800'
    case 'work-area': return 'bg-green-100 text-green-800'
    case 'meeting-room': return 'bg-purple-100 text-purple-800'
    case 'break-area': return 'bg-amber-100 text-amber-800'
    case 'reception': return 'bg-indigo-100 text-indigo-800'
    case 'security': return 'bg-red-100 text-red-800'
    case 'server-room': return 'bg-cyan-100 text-cyan-800'
    case 'utility-room': return 'bg-teal-100 text-teal-800'
    case 'storage': return 'bg-gray-100 text-gray-800'
    case 'entrance-hall': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getThingTypeName = (typeCode) => {
  const type = thingTypes.find(t => t.value === typeCode)
  return type ? type.label : typeCode
}

const getThingTypeClass = (typeCode) => {
  switch (typeCode) {
    case 'reader': return 'bg-blue-100 text-blue-800'
    case 'controller': return 'bg-purple-100 text-purple-800'
    case 'lock': return 'bg-amber-100 text-amber-800'
    case 'temperature-sensor': return 'bg-green-100 text-green-800'
    case 'humidity-sensor': return 'bg-cyan-100 text-cyan-800'
    case 'hvac': return 'bg-teal-100 text-teal-800'
    case 'lighting': return 'bg-yellow-100 text-yellow-800'
    case 'camera': return 'bg-red-100 text-red-800'
    case 'motion-sensor': return 'bg-indigo-100 text-indigo-800'
    case 'occupancy-sensor': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
