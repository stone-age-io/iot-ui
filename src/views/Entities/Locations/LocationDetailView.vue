<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner 
        strokeWidth="4" 
        class="text-primary-500 dark:text-primary-400" 
      />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="p-error-container p-6 text-center bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark rounded-lg shadow-theme-md">
      <div class="text-xl mb-4 text-red-600 dark:text-red-400">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load location details
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Location Details -->
    <div v-else-if="location" class="location-detail-container">
      <!-- Header Section with Location title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">
            <router-link :to="{ name: 'edges' }" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              Edges
            </router-link>
            <i class="pi pi-angle-right mx-1 text-content-tertiary dark:text-content-tertiary-dark"></i>
            <router-link 
              :to="{ name: 'edge-detail', params: { id: location.edge_id } }" 
              class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {{ location.expand?.edge_id?.code || 'Unknown Edge' }}
            </router-link>
            <i class="pi pi-angle-right mx-1 text-content-tertiary dark:text-content-tertiary-dark"></i>
            Locations
          </div>
          <h1 class="text-2xl font-bold mb-1 text-content-primary dark:text-content-primary-dark">{{ location.name }}</h1>
          <div class="font-mono text-content-secondary dark:text-content-secondary-dark">
            {{ location.code }}
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
      
      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="lg:col-span-2">
          <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition h-full">
            <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Location Details</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <!-- Code -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Code</div>
                  <div class="font-mono text-lg text-content-primary dark:text-content-primary-dark">{{ location.code }}</div>
                </div>
                
                <!-- Name -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Name</div>
                  <div class="text-lg text-content-primary dark:text-content-primary-dark">{{ location.name }}</div>
                </div>
                
                <!-- Path -->
                <div class="detail-field md:col-span-2">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Path</div>
                  <div class="flex flex-wrap gap-1 items-center">
                    <span v-for="(segment, index) in parseLocationPath(location.path)" :key="index" class="flex items-center">
                      <span v-if="index > 0" class="mx-1 text-content-tertiary dark:text-content-tertiary-dark">/</span>
                      <span class="px-2 py-1 rounded-md text-sm bg-surface-secondary dark:bg-surface-secondary-dark text-content-primary dark:text-content-primary-dark">
                        {{ segment }}
                      </span>
                    </span>
                  </div>
                </div>
                
                <!-- Type -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Type</div>
                  <div class="flex items-center">
                    <span 
                      class="badge"
                      :class="getTypeClass(location.type)"
                    >
                      {{ getTypeName(location.type) }}
                    </span>
                  </div>
                </div>
                
                <!-- Edge Reference -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Edge</div>
                  <router-link 
                    :to="{ name: 'edge-detail', params: { id: location.edge_id } }"
                    class="text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                  >
                    <span class="font-medium">{{ location.expand?.edge_id?.code || 'Unknown Edge' }}</span>
                    <span class="ml-2 text-sm text-content-secondary dark:text-content-secondary-dark">{{ location.expand?.edge_id?.name || '' }}</span>
                  </router-link>
                </div>
                
                <!-- Parent Location -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Parent Location</div>
                  <router-link 
                    v-if="hasParent(location)"
                    :to="{ name: 'location-detail', params: { id: location.parent_id } }"
                    class="text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                  >
                    <span class="font-medium">{{ location.expand?.parent_id?.code || '' }}</span>
                    <span class="ml-2 text-sm text-content-secondary dark:text-content-secondary-dark">{{ location.expand?.parent_id?.name || '' }}</span>
                  </router-link>
                  <span v-else class="text-content-secondary dark:text-content-secondary-dark">No parent location</span>
                </div>
                
                <!-- Description -->
                <div class="detail-field md:col-span-2">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Description</div>
                  <div class="text-content-primary dark:text-content-primary-dark">{{ location.description || 'No description provided' }}</div>
                </div>
                
                <!-- Metadata (if any) -->
                <div v-if="hasMetadata(location)" class="md:col-span-2">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Metadata</div>
                  <div class="p-3 rounded border font-mono text-sm overflow-x-auto bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark text-content-primary dark:text-content-primary-dark">
                    <pre>{{ JSON.stringify(location.metadata, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Things/Quick Info Card -->
        <div>
          <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition h-full">
            <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Things</h2>
            </div>
            <div class="p-6">
              <div class="space-y-6">
                <!-- Things Count -->
                <div class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Connected Things</div>
                  <div class="flex items-center">
                    <i class="pi pi-wifi mr-2 text-purple-600 dark:text-purple-400"></i>
                    <div class="text-2xl font-semibold text-content-primary dark:text-content-primary-dark">{{ things.length }}</div>
                  </div>
                  <Button
                    label="View Things"
                    icon="pi pi-arrow-right"
                    class="p-button-text p-button-sm mt-2"
                    @click="navigateToThings(location.id)"
                  />
                </div>
                
                <!-- Child Locations -->
                <div class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Child Locations</div>
                  <div class="flex items-center">
                    <i class="pi pi-sitemap mr-2 text-blue-600 dark:text-blue-400"></i>
                    <div class="text-2xl font-semibold text-content-primary dark:text-content-primary-dark">{{ childLocations.length }}</div>
                  </div>
                </div>
                
                <!-- Thing Types -->
                <div v-if="uniqueThingTypes.length > 0" class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Thing Types</div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span 
                      v-for="type in uniqueThingTypes" 
                      :key="type"
                      class="badge"
                      :class="getThingTypeClass(type)"
                    >
                      {{ getThingTypeName(type) }}
                    </span>
                  </div>
                </div>
                
                <!-- Created Date -->
                <div class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Created</div>
                  <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(location.created) }}</div>
                </div>
                
                <!-- Last Updated -->
                <div class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Last Updated</div>
                  <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(location.updated) }}</div>
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
        </div>
      </div>
      
      <!-- Child Locations Card -->
      <div class="mt-6" v-if="childLocations.length > 0">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Child Locations</h2>
              <Button
                label="Add Child Location"
                icon="pi pi-plus"
                class="p-button-sm"
                @click="navigateToLocationCreate({ parent_id: location.id })"
              />
            </div>
          </div>
          <div class="p-6">
            <DataTable
              :items="childLocations"
              :columns="childLocationColumns"
              :loading="childrenLoading"
              :searchable="true"
              empty-message="No child locations"
              @row-click="(data) => navigateToLocationDetail(data.id)"
            >
              <!-- Code column -->
              <template #code-body="{ data }">
                <div class="font-medium font-mono text-primary-700 dark:text-primary-400">{{ data.code }}</div>
              </template>
              
              <!-- Type column with badge -->
              <template #type-body="{ data }">
                <span 
                  class="badge"
                  :class="getTypeClass(data.type)"
                >
                  {{ getTypeName(data.type) }}
                </span>
              </template>
              
              <!-- Actions column --> 
              <template #row-actions="{ data }">
                <div class="flex gap-1 justify-center">
                  <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text p-button-sm" 
                    @click.stop="navigateToLocationDetail(data.id)"
                    tooltip="View"
                    tooltipOptions="{ position: 'top' }" 
                  />
                </div>
              </template>
            </DataTable>
          </div>
        </div>
      </div>
      
      <!-- Floor Plan Map Card -->
      <div class="mt-6">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Floor Plan</h2>
          </div>
          <div class="p-6">
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
        </div>
      </div>
      
      <!-- Connected Things -->
      <div class="mt-6" v-if="things.length > 0">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Connected Things</h2>
          </div>
          <div class="p-6">
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
                <div class="font-medium font-mono text-primary-700 dark:text-primary-400">{{ data.code || data.thing_code }}</div>
              </template>
              
              <!-- Type column with badge -->
              <template #type-body="{ data }">
                <span 
                  class="badge"
                  :class="getThingTypeClass(data.type || data.thing_type)"
                >
                  {{ getThingTypeName(data.type || data.thing_type) }}
                </span>
              </template>
              
              <!-- Indoor Position column -->
              <template #position-body="{ data }">
                <div v-if="hasIndoorPosition(data)" class="flex items-center text-sm">
                  <i class="pi pi-map-marker mr-1 text-primary-500 dark:text-primary-400"></i>
                  <span class="text-content-primary dark:text-content-primary-dark">{{ formatPosition(data) }}</span>
                </div>
                <div v-else class="text-sm text-content-secondary dark:text-content-secondary-dark">
                  Not positioned
                </div>
              </template>
              
              <!-- Actions column --> 
              <template #row-actions="{ data }">
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocation } from '../../../composables/useLocation'
import { useThing } from '../../../composables/useThing'
import { useConfirmation } from '../../../composables/useConfirmation'
import { useToast } from 'primevue/usetoast'
import DataTable from '../../../components/common/DataTable.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import FloorPlanMap from '../../../components/map/FloorPlanMap.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Get location functionality from composable
const { 
  loading, 
  error, 
  childLocations,
  childrenLoading,
  formatDate, 
  getTypeName, 
  getTypeClass,
  parseLocationPath,
  hasMetadata,
  hasFloorPlan,
  hasParent,
  fetchLocation,
  fetchChildLocations,
  deleteLocation,
  uploadFloorPlan,
  navigateToLocationEdit,
  navigateToLocationCreate,
  navigateToLocationDetail,
  navigateToThings,
  navigateToCreateThing,
  navigateToEdgeDetail
} = useLocation()

// Get thing functionality from composable
const { 
  getTypeName: getThingTypeName, 
  getTypeClass: getThingTypeClass,
  fetchThings,
  updateThingPosition: updateThingPositionMethod,
  navigateToThingDetail
} = useThing()

// Get confirmation dialog functionality
const { dialog: deleteDialog, updateDialog } = useConfirmation()

// Local state
const location = ref(null)
const things = ref([])
const thingsLoading = ref(false)

// Get unique thing types
const uniqueThingTypes = computed(() => {
  return [...new Set(things.value.map(thing => thing.type || thing.thing_type))]
})

// Thing columns for the table
const thingColumns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'position', header: 'Indoor Position', sortable: false },
  { field: 'actions', header: 'Actions', sortable: false }
]

// Child location columns for the table
const childLocationColumns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'actions', header: 'Actions', sortable: false }
]

// Fetch location data on component mount
onMounted(async () => {
  await loadLocationDetail()
})

// Watch for route changes to reload data when navigating between locations
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadLocationDetail()
  }
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
      await loadThings()
      
      // Now fetch child locations
      await fetchChildLocations(id)
    }
  } catch (err) {
    // Error handling is done in the composable
    console.error('Error loading location detail:', err)
  }
}

// Fetch things using the useThing composable
const loadThings = async () => {
  if (!location.value) return
  
  thingsLoading.value = true
  try {
    // Use the thing composable to fetch things by location
    const thingsData = await fetchThings({ location_id: location.value.id })
    
    // Normalize field names if needed (thing_code to code, thing_type to type)
    things.value = thingsData.map(item => ({
      ...item,
      code: item.code || item.thing_code,
      type: item.type || item.thing_type
    }))
  } catch (err) {
    console.error('Error fetching things:', err)
    things.value = []
  } finally {
    thingsLoading.value = false
  }
}

// Update thing position on the floor plan
const updateThingPosition = async ({ thingId, coordinates }) => {
  const thing = things.value.find(t => t.id === thingId)
  if (!thing) return
  
  try {
    // Use the composable method to update position
    await updateThingPositionMethod(thingId, coordinates)
    
    // Update local state
    if (!thing.metadata) thing.metadata = {}
    if (!thing.metadata.coordinates) thing.metadata.coordinates = {}
    thing.metadata.coordinates.x = coordinates.x
    thing.metadata.coordinates.y = coordinates.y
    
    // Show success toast
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Updated position for ${thing.name}`,
      life: 2000
    })
  } catch (error) {
    console.error('Error updating thing position:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update thing position',
      life: 3000
    })
  }
}

// Handle floor plan upload
const handleUploadFloorPlan = async (file) => {
  if (!location.value) return
  
  try {
    await uploadFloorPlan(location.value.id, file)
    
    // Refresh location data to get updated floorplan field
    const locationData = await fetchLocation(location.value.id)
    if (locationData) {
      location.value = locationData
    }
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Floor plan uploaded successfully',
      life: 3000
    })
  } catch (error) {
    console.error('Error uploading floor plan:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to upload floor plan',
      life: 3000
    })
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

// Handle delete button click
const handleDeleteClick = () => {
  deleteDialog.value.visible = true
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!location.value) return
  
  updateDialog({ loading: true })
  
  try {
    const success = await deleteLocation(location.value.id, location.value.code)
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Deleted',
        detail: `Location ${location.value.code} has been deleted`,
        life: 3000
      })
      router.push({ name: 'locations' })
    }
  } catch (error) {
    console.error('Error deleting location:', error)
  } finally {
    updateDialog({ loading: false })
  }
}
</script>

<style scoped>
/* Theme-aware styling */
.location-detail-container {
  margin-bottom: 2rem;
}

.field-label {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.detail-field, .stat-item {
  display: flex;
  flex-direction: column;
}

/* Dark mode styling for DataTable */
:deep(.dark .p-datatable) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.dark .p-datatable-thead > tr > th) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-datatable-tbody > tr) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
}

/* Dark mode styling for dialogs */
:deep(.p-dialog) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-dialog-header) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-bottom-color: var(--surface-border);
}

:deep(.p-dialog-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-dialog-footer) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-top-color: var(--surface-border);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .field-label {
    font-size: 0.75rem;
  }
}
</style>
