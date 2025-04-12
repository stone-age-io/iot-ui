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
      <div class="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">Location</div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ location.name }}</h1>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-primary-600">{{ location.code }}</span>
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="getTypeClass(location.type)"
            >
              {{ getTypeName(location.type) }}
            </span>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <Button
            icon="pi pi-upload"
            label="Upload Floor Plan"
            class="p-button-outlined"
            @click="openFloorPlanUpload"
            v-if="!hasFloorPlan(location)"
          />
          <Button
            icon="pi pi-map"
            label="View Floor Plan"
            class="p-button-outlined p-button-success"
            @click="viewFloorPlan = true"
            v-if="hasFloorPlan(location)"
          />
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
            
            <!-- Path -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Path</div>
              <div class="text-gray-700">{{ formatPath(location.path) }}</div>
            </div>
            
            <!-- Edge -->
            <div v-if="edge">
              <div class="text-sm text-gray-500 mb-1">Edge</div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs">{{ edge.code }}</span>
                <span class="text-gray-700">{{ edge.name }}</span>
                <Button
                  icon="pi pi-external-link"
                  class="p-button-text p-button-rounded p-button-sm"
                  @click="navigateToEdgeDetail(edge.id)"
                  tooltip="View Edge"
                />
              </div>
            </div>
            
            <!-- Parent -->
            <div v-if="parent">
              <div class="text-sm text-gray-500 mb-1">Parent Location</div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs">{{ parent.code }}</span>
                <span class="text-gray-700">{{ parent.name }}</span>
                <Button
                  icon="pi pi-external-link"
                  class="p-button-text p-button-rounded p-button-sm"
                  @click="navigateToLocationDetail(parent.id)"
                  tooltip="View Parent Location"
                />
              </div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2" v-if="location.description">
              <div class="text-sm text-gray-500 mb-1">Description</div>
              <div class="text-gray-700">{{ location.description }}</div>
            </div>
            
            <!-- Status -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Status</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="location.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ location.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
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
        
        <!-- Stats/Quick Info Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Overview</h2>
          
          <div class="space-y-6">
            <!-- Child Locations Count -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Child Locations</div>
              <div class="flex items-center">
                <i class="pi pi-sitemap text-green-600 mr-2"></i>
                <div class="text-2xl font-semibold">{{ childLocations.length }}</div>
              </div>
              <Button
                v-if="childLocations.length > 0"
                label="View Children"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm mt-2"
                @click="showChildLocations = true"
              />
            </div>
            
            <!-- Things Count -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Things</div>
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
              <Button
                label="Add Thing"
                icon="pi pi-plus"
                class="p-button-text p-button-sm mt-1"
                @click="navigateToCreateThing(location.id)"
              />
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
        </div>
      </div>
      
      <!-- Things List -->
      <div class="card mt-6" v-if="things.length > 0">
        <h2 class="text-xl font-semibold mb-4">Things at this Location</h2>
        
        <DataTable
          :items="things"
          :columns="thingColumns"
          :paginated="true"
          :rows="5"
          :searchable="true"
          empty-message="No things at this location"
          @row-click="(data) => navigateToThingDetail(data.id)"
        >
          <!-- Code column with custom formatting -->
          <template #thing_code-body="{ data }">
            <div class="font-medium text-primary-700">{{ data.thing_code }}</div>
          </template>
          
          <!-- Type column with badge -->
          <template #thing_type-body="{ data }">
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="getThingTypeClass(data.thing_type)"
            >
              {{ typesStore.getTypeName(data.thing_type, 'thingTypes') }}
            </span>
          </template>
          
          <!-- Active column with badge -->
          <template #active-body="{ data }">
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="data.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            >
              {{ data.active ? 'Active' : 'Inactive' }}
            </span>
          </template>
          
          <!-- Actions column -->
          <template #row-actions="{ data }">
            <div class="flex gap-1 justify-center">
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToThingDetail(data.id)"
              />
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToThingEdit(data.id)"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </div>
    
    <!-- View Floor Plan Dialog -->
    <Dialog
      v-model:visible="viewFloorPlan"
      header="Floor Plan"
      :modal="true"
      :style="{ width: '90%', maxWidth: '1200px' }"
      :maximizable="true"
    >
      <div class="text-center" v-if="location && hasFloorPlan(location)">
        <img 
          :src="getFloorPlanImageUrl(location)" 
          alt="Floor Plan" 
          class="max-w-full max-h-[70vh] object-contain"
        />
      </div>
    </Dialog>
    
    <!-- Child Locations Dialog -->
    <Dialog
      v-model:visible="showChildLocations"
      header="Child Locations"
      :modal="true"
      :style="{ width: '90%', maxWidth: '900px' }"
    >
      <DataTable
        :items="childLocations"
        :columns="childLocationColumns"
        :paginated="childLocations.length > 5"
        :rows="5"
        :searchable="true"
        empty-message="No child locations"
        @row-click="(data) => navigateToLocationDetail(data.id)"
      >
        <!-- Code column -->
        <template #code-body="{ data }">
          <div class="font-medium text-primary-700">{{ data.code }}</div>
        </template>
        
        <!-- Type column with badge -->
        <template #type-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getTypeClass(data.type)"
          >
            {{ typesStore.getTypeName(data.type, 'locationTypes') }}
          </span>
        </template>
        
        <!-- Actions column -->
        <template #row-actions="{ data }">
          <div class="flex gap-1 justify-center">
            <Button 
              icon="pi pi-eye" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToLocationDetail(data.id)"
            />
          </div>
        </template>
      </DataTable>
    </Dialog>
    
    <!-- Upload Floor Plan Dialog -->
    <Dialog
      v-model:visible="uploadFloorPlan"
      header="Upload Floor Plan"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="p-fluid">
        <div class="mb-4">
          <label for="floorplan-upload" class="block text-sm font-medium text-gray-700 mb-1">
            Floor Plan Image
          </label>
          <FileUpload
            ref="fileUploadRef"
            id="floorplan-upload"
            mode="basic"
            name="floorplan"
            accept="image/*"
            :auto="false"
            chooseLabel="Select Image"
            class="p-button-outlined w-full"
            :disabled="uploadLoading"
            @select="onFileSelect"
          />
          <small class="text-gray-500 mt-1 block">
            Accepted formats: PNG, JPG, JPEG, GIF, SVG
          </small>
        </div>
        
        <div v-if="selectedFile" class="mb-4">
          <div class="flex items-center gap-2">
            <i class="pi pi-file text-primary-500"></i>
            <span>{{ selectedFile.name }}</span>
            <span class="text-xs text-gray-500">({{ formatFileSize(selectedFile.size) }})</span>
          </div>
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-outlined"
            @click="cancelUpload"
            :disabled="uploadLoading"
          />
          <Button
            label="Upload"
            icon="pi pi-upload"
            @click="handleFloorPlanUpload"
            :loading="uploadLoading"
            :disabled="!selectedFile || uploadLoading"
          />
        </div>
      </div>
    </Dialog>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:visible="deleteDialog.visible"
      :title="deleteDialog.title"
      :type="deleteDialog.type"
      :confirm-label="deleteDialog.confirmLabel"
      :confirm-icon="deleteDialog.confirmIcon"
      :loading="deleteDialog.loading"
      :message="deleteDialog.message"
      :details="deleteDialog.details"
      @confirm="handleDeleteConfirm"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocation } from '../../../composables/useLocation'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTypesStore } from '../../../stores/types'
import DataTable from '../../../components/common/DataTable.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const typesStore = useTypesStore()

// Load location types
typesStore.loadLocationTypes()
typesStore.loadThingTypes()

// Location functionality from composable
const { 
  loading,
  error,
  formatDate,
  getTypeName,
  getTypeClass,
  hasMetadata,
  hasFloorPlan,
  formatPath,
  fetchLocation,
  deleteLocation,
  uploadFloorPlan: uploadFloorPlanToServer,
  getFloorPlanImageUrl,
  navigateToLocationEdit,
  navigateToLocationDetail,
  navigateToThings,
  navigateToCreateThing,
  navigateToEdgeDetail
} = useLocation()

// Delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Local state
const location = ref(null)
const edge = ref(null)
const parent = ref(null)
const things = ref([])
const childLocations = ref([])
const viewFloorPlan = ref(false)
const showChildLocations = ref(false)
const uploadFloorPlan = ref(false)
const uploadLoading = ref(false)
const selectedFile = ref(null)
const fileUploadRef = ref(null)

// Column definitions for things table
const thingColumns = [
  { field: 'thing_code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'thing_type', header: 'Type', sortable: true },
  { field: 'active', header: 'Status', sortable: true }
]

// Column definitions for child locations table
const childLocationColumns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'path', header: 'Path', sortable: true }
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
      
      // Fetch related data
      await Promise.all([
        fetchEdge(),
        fetchParent(),
        fetchThings(),
        fetchChildLocations()
      ])
    }
  } catch (err) {
    // Error handling is done in the composable
  }
}

// Fetch edge for this location
const fetchEdge = async () => {
  if (!location.value || !location.value.edge_id) return
  
  try {
    const { edgeService } = await import('../../../services')
    const response = await edgeService.getById(location.value.edge_id)
    edge.value = response.data
  } catch (err) {
    console.error('Error fetching edge:', err)
  }
}

// Fetch parent location
const fetchParent = async () => {
  if (!location.value || !location.value.parent_id) return
  
  try {
    const response = await fetchLocation(location.value.parent_id)
    parent.value = response
  } catch (err) {
    console.error('Error fetching parent location:', err)
  }
}

// Fetch things for this location
const fetchThings = async () => {
  if (!location.value) return
  
  try {
    const { thingService } = await import('../../../services')
    const response = await thingService.getThingsByLocation(location.value.id)
    things.value = response.data.items || []
  } catch (err) {
    console.error('Error fetching things:', err)
  }
}

// Fetch child locations
const fetchChildLocations = async () => {
  if (!location.value) return
  
  try {
    const childLocationsData = await fetchChildLocations(location.value.id)
    childLocations.value = childLocationsData || []
  } catch (err) {
    console.error('Error fetching child locations:', err)
    childLocations.value = []
  }
}

// Thing navigation
const navigateToThingDetail = (id) => {
  router.push({ name: 'thing-detail', params: { id } })
}

const navigateToThingEdit = (id) => {
  router.push({ name: 'edit-thing', params: { id } })
}

// Floor plan upload methods
const openFloorPlanUpload = () => {
  selectedFile.value = null
  uploadFloorPlan.value = true
}

const onFileSelect = (event) => {
  if (event.files && event.files.length > 0) {
    selectedFile.value = event.files[0]
  }
}

const cancelUpload = () => {
  selectedFile.value = null
  if (fileUploadRef.value) {
    fileUploadRef.value.clear()
  }
  uploadFloorPlan.value = false
}

const handleFloorPlanUpload = async () => {
  if (!selectedFile.value || !location.value) return
  
  uploadLoading.value = true
  
  try {
    // Create FormData and append file
    const formData = new FormData()
    formData.append('floorplan', selectedFile.value)
    
    // Upload to server
    const success = await uploadFloorPlanToServer(location.value.id, formData)
    
    if (success) {
      // Reload location to get updated floor plan
      const updatedLocation = await fetchLocation(location.value.id)
      if (updatedLocation) {
        location.value = updatedLocation
      }
      
      // Close upload dialog
      uploadFloorPlan.value = false
      selectedFile.value = null
      if (fileUploadRef.value) {
        fileUploadRef.value.clear()
      }
    }
  } finally {
    uploadLoading.value = false
  }
}

// Format file size for display
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!location.value) return
  
  let warningDetails = ''
  if (things.value.length > 0) {
    warningDetails = `This location has ${things.value.length} thing(s) associated with it. `
  }
  if (childLocations.value.length > 0) {
    warningDetails += `It also has ${childLocations.value.length} child location(s). `
  }
  if (warningDetails) {
    warningDetails += 'All associations will be lost.'
  }
  
  confirmDelete(
    location.value, 
    'location', 
    'code',
    warningDetails ? { details: warningDetails } : {}
  )
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!location.value) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteLocation(location.value.id, location.value.code)
  
  if (success) {
    resetDeleteDialog()
    router.push({ name: 'locations' })
  } else {
    updateDeleteDialog({ loading: false })
  }
}

// Thing type class helper
const getThingTypeClass = (typeCode) => {
  switch (typeCode) {
    case 'reader': return 'bg-blue-100 text-blue-800'
    case 'controller': return 'bg-purple-100 text-purple-800' 
    case 'temperature-sensor': return 'bg-green-100 text-green-800'
    case 'lock': return 'bg-amber-100 text-amber-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
