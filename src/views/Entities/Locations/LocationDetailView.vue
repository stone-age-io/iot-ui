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
              {{ location.edge?.code || location.edge_id }}
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
                {{ location.edge?.code || location.edge_id }}
              </router-link>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Description</div>
              <div class="text-gray-700">{{ location.description || 'No description provided' }}</div>
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
                <div class="text-2xl font-semibold">{{ stats.thingsCount }}</div>
              </div>
              <Button
                label="View Things"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm mt-2"
                @click="navigateToThings"
              />
            </div>
            
            <!-- Thing Types -->
            <div v-if="stats.thingTypes.length > 0">
              <div class="text-sm text-gray-500 mb-1">Thing Types</div>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="type in stats.thingTypes" 
                  :key="type"
                  class="px-2 py-1 text-xs rounded-full font-medium"
                  :class="getTypeClass(type)"
                >
                  {{ getTypeName(type) }}
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { locationService, locationTypes, parseLocationPath } from '../../../services/location'
import { thingService } from '../../../services/thing'
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

// Statistics for things in this location
const stats = ref({
  thingsCount: 0,
  thingTypes: []
})

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
    
    // Fetch related things statistics
    await fetchThingsStats()
  } catch (err) {
    console.error('Error fetching location:', err)
    error.value = 'Failed to load location details. Please try again.'
  } finally {
    loading.value = false
  }
}

const fetchThingsStats = async () => {
  try {
    const response = await thingService.getThingsByLocation(location.value.id)
    const things = response.data.items || []
    
    // Calculate stats
    stats.value.thingsCount = things.length
    stats.value.thingTypes = [...new Set(things.map(thing => thing.thing_type))]
  } catch (err) {
    console.error('Error fetching things stats:', err)
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
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
