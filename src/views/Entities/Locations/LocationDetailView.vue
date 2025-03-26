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
            @click="navigateToLocationEdit(location.id)"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="handleDeleteClick"
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
            <div v-if="hasMetadata(location)" class="md:col-span-2">
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
                @click="navigateToThings(location.id)"
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
              @click="navigateToCreateThing(location.id)"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <!-- Floor Plan Map Card -->
      <div class="card mt-6">
        <h2 class="text-xl font-semibold mb-4">Floor Plan</h2>
        <FloorPlanMap
          :location="location"
          :things="things"
          height="550px"
          :editable="true"
          legendPosition="left"
          @update-thing-position="updateThingPosition"
          @upload-floor-plan="handleUploadFloorPlan"
          @thing-click="navigateToThingDetail"
        />
      </div>
      
      <!-- Connected Things -->
      <div class="card mt-6" v-if="things.length > 0">
        <h2 class="text-xl font-semibold mb-4">Connected Things</h2>
        
        <DataTable
          :items="things"
          :columns="thingColumns"
          :loading="thingsLoading"
          :searchable="true"
          empty-message="No things found for this location"
          @row-click="(data) => navigateToThingDetail(data)"
        >
          <!-- Code column -->
          <template #code-body="{ data }">
            <div class="font-medium text-primary-700 font-mono">{{ data.code }}</div>
          </template>
          
          <!-- Type column with badge -->
          <template #type-body="{ data }">
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="getThingTypeClass(data.type)"
            >
              {{ getThingTypeName(data.type) }}
            </span>
          </template>
          
          <!-- Indoor Position column -->
          <template #position-body="{ data }">
            <div v-if="hasIndoorPosition(data)" class="flex items-center text-sm">
              <i class="pi pi-map-marker text-primary-500 mr-1"></i>
              <span>{{ formatPosition(data) }}</span>
            </div>
            <div v-else class="text-gray-500 text-sm">
              Not positioned
            </div>
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
      @confirm="handleDeleteConfirm"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocation } from '../../../composables/useLocation'
import { useThing } from '../../../composables/useThing'
import DataTable from '../../../components/common/DataTable.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import FloorPlanMap from '../../../components/map/FloorPlanMap.vue'

const route = useRoute()
const router = useRouter()

// Get location functionality from composable
const { 
  loading, 
  error, 
  formatDate, 
  getTypeName, 
  getTypeClass,
  parseLocationPath,
  hasMetadata,
  fetchLocation,
  deleteLocation,
  uploadFloorPlan,
  navigateToLocationEdit,
  navigateToThings,
  navigateToCreateThing,
  navigateToEdgeDetail
} = useLocation()

// Get thing functionality from composable
// FIX 1: Correctly map function names from the useThing composable
const { 
  getTypeName: getThingTypeName, 
  getTypeClass: getThingTypeClass 
} = useThing()

// Local state
const location = ref(null)
const things = ref([])
const thingsLoading = ref(false)
const deleteDialog = ref({
  visible: false,
  loading: false
})

// Get unique thing types
const uniqueThingTypes = computed(() => {
  return [...new Set(things.value.map(thing => thing.type))]
})

// Thing columns for the table
const thingColumns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'position', header: 'Indoor Position', sortable: false },
  { field: 'actions', header: 'Actions', sortable: false }
]

// Fetch location data on component mount
onMounted(async () => {
  await loadLocationDetail()
})

// Methods
const loadLocationDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch location data
    const locationData = await fetchLocation(id)
    if (locationData) {
      location.value = locationData
      
      // Now fetch associated things
      await fetchThings()
    }
  } catch (err) {
    // Error handling is done in the composable
  }
}

// FIX 2: Improved fetchThings method to handle field name differences
const fetchThings = async () => {
  if (!location.value) return
  
  thingsLoading.value = true
  try {
    const { thingService } = await import('../../../services')
    const response = await thingService.getThingsByLocation(location.value.id)
    
    if (response.data && response.data.items) {
      // Map the returned fields back to what our view expects
      things.value = response.data.items.map(item => {
        // Ensure we have consistent field names for the view
        // If the response has thing_code/thing_type fields, use their values for code/type
        return {
          ...item,
          code: item.code || item.thing_code,
          type: item.type || item.thing_type
        }
      });
    } else {
      things.value = [];
    }
  } catch (err) {
    console.error('Error fetching things:', err)
    things.value = [];
  } finally {
    thingsLoading.value = false
  }
}

// Update thing position on the floor plan
const updateThingPosition = async ({ thingId, coordinates }) => {
  const thing = things.value.find(t => t.id === thingId)
  if (!thing) return
  
  try {
    // Update thing position using the service
    const { thingService } = await import('../../../services')
    await thingService.updateThingPosition(thingId, coordinates)
    
    // Update local state
    if (!thing.metadata) thing.metadata = {}
    if (!thing.metadata.coordinates) thing.metadata.coordinates = {}
    thing.metadata.coordinates.x = coordinates.x
    thing.metadata.coordinates.y = coordinates.y
    
    // Show success toast
    const toast = await import('primevue/usetoast')
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Updated position for ${thing.name}`,
      life: 2000
    })
  } catch (error) {
    console.error('Error updating thing position:', error)
  }
}

// Handle floor plan upload
const handleUploadFloorPlan = async (file) => {
  if (!location.value) return
  await uploadFloorPlan(location.value.id, file)
  
  // Refresh location data to get updated floorplan field
  const locationData = await fetchLocation(location.value.id)
  if (locationData) {
    location.value = locationData
  }
}

// Check if a thing has indoor positioning coordinates
const hasIndoorPosition = (thing) => {
  return thing.metadata && 
         thing.metadata.coordinates && 
         typeof thing.metadata.coordinates.x !== 'undefined' && 
         typeof thing.metadata.coordinates.y !== 'undefined'
}

// Format indoor position for display
const formatPosition = (thing) => {
  if (!hasIndoorPosition(thing)) return 'Not positioned'
  
  const x = thing.metadata.coordinates.x.toFixed(1)
  const y = thing.metadata.coordinates.y.toFixed(1)
  return `x: ${x}, y: ${y}`
}

const navigateToThingDetail = (thing) => {
  if (!thing) return;
  
  // Ensure we have an ID
  const id = typeof thing === 'object' ? thing.id : thing;
  if (!id) {
    console.error('Cannot navigate to thing detail: Invalid ID', thing);
    return;
  }
  
  router.push({ name: 'thing-detail', params: { id } });
}

// Handle delete button click
const handleDeleteClick = () => {
  deleteDialog.value.visible = true
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!location.value) return
  
  deleteDialog.value.loading = true
  
  const success = await deleteLocation(location.value.id, location.value.code)
  
  if (success) {
    router.push({ name: 'locations' })
  } else {
    deleteDialog.value.loading = false
  }
}
</script>
