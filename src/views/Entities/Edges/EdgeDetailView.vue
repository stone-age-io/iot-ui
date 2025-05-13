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
        Failed to load edge details
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Edge Details -->
    <div v-else-if="edge" class="edge-detail-container">
      <!-- Header Section with Edge title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Edge Installation</div>
          <h1 class="text-2xl font-bold mb-1 text-content-primary dark:text-content-primary-dark">{{ edge.name }}</h1>
          <div class="font-mono text-content-secondary dark:text-content-secondary-dark">
            {{ edge.code }}
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToEdgeEdit(edge.id)"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="handleDeleteClick"
          />
        </div>
      </div>
      
      <!-- Main Details Card - Now full width -->
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Edge Details</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Code -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Code</div>
              <div class="font-mono text-lg text-content-primary dark:text-content-primary-dark">{{ edge.code }}</div>
            </div>
            
            <!-- Name -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Name</div>
              <div class="text-lg text-content-primary dark:text-content-primary-dark">{{ edge.name }}</div>
            </div>
            
            <!-- Type -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Type</div>
              <div class="flex items-center">
                <span 
                  class="badge"
                  :class="getTypeClass(edge.type)"
                >
                  {{ getTypeName(edge.type) }}
                </span>
              </div>
            </div>
            
            <!-- Region -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Region</div>
              <div class="flex items-center">
                <span 
                  class="badge"
                  :class="getRegionClass(edge.region)"
                >
                  {{ getRegionName(edge.region) }}
                </span>
              </div>
            </div>
            
            <!-- Status -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Status</div>
              <div class="flex items-center">
                <span 
                  class="badge"
                  :class="edge.active ? 
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
                >
                  {{ edge.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            
            <!-- Created Date -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Created</div>
              <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(edge.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Last Updated</div>
              <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(edge.updated) }}</div>
            </div>
            
            <!-- Metadata (if any) -->
            <div v-if="hasEdgeMetadata" class="md:col-span-2">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Metadata</div>
              <div class="p-3 rounded border font-mono text-sm overflow-x-auto bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark text-content-primary dark:text-content-primary-dark">
                <pre>{{ JSON.stringify(edge.metadata, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Locations with count in title -->
      <div class="mt-6" v-if="totalLocationsCount > 0">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
                Locations 
                <span class="text-base font-normal text-content-secondary dark:text-content-secondary-dark">
                  ({{ totalLocationsCount }} total)
                </span>
              </h2>
              <Button
                label="View All"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click="navigateToLocations(edge.id)"
              />
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="location in recentLocations" 
                :key="location.id"
                class="rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer location-card bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark theme-transition"
                @click="navigateToLocationDetail(location.id)"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="text-primary-600 dark:text-primary-400 font-mono">{{ location.code }}</span>
                  <span 
                    class="badge"
                    :class="getLocationTypeClass(location.type)"
                  >
                    {{ typesStore.getTypeName(location.type, 'locationTypes') }}
                  </span>
                </div>
                <div class="font-semibold mb-1 text-content-primary dark:text-content-primary-dark">{{ location.name }}</div>
                <div class="text-sm text-content-secondary dark:text-content-secondary-dark">{{ formatPath(location.path) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Things with count in title -->
      <div class="mt-6" v-if="totalThingsCount > 0">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
                Things
                <span class="text-base font-normal text-content-secondary dark:text-content-secondary-dark">
                  ({{ totalThingsCount }} total)
                </span>
              </h2>
              <Button
                label="View All"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click="navigateToThings(edge.id)"
              />
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="thing in recentThings" 
                :key="thing.id"
                class="rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer thing-card bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark theme-transition"
                @click="navigateToThingDetail(thing.id)"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="text-primary-600 dark:text-primary-400 font-mono">{{ thing.code }}</span>
                  <span 
                    class="badge"
                    :class="getThingTypeClass(thing.type)"
                  >
                    {{ typesStore.getTypeName(thing.type, 'thingTypes') }}
                  </span>
                </div>
                <div class="font-semibold mb-1 text-content-primary dark:text-content-primary-dark">{{ thing.name }}</div>
                <div class="text-sm text-content-secondary dark:text-content-secondary-dark">{{ getLocationName(thing.location_id) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Analytics Link Card -->
      <div class="mt-6">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1">
                <h2 class="text-xl font-semibold mb-1 text-content-primary dark:text-content-primary-dark">Analytics & Monitoring</h2>
                <p class="text-content-secondary dark:text-content-secondary-dark">View detailed metrics and logs for this edge in Grafana.</p>
              </div>
              <Button
                label="Open in Grafana"
                icon="pi pi-external-link"
                @click="openInGrafana(edge.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEdge } from '../../../composables/useEdge'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTypesStore } from '../../../stores/types'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const typesStore = useTypesStore()

// Ensure types are loaded
typesStore.loadLocationTypes()
typesStore.loadThingTypes()

// Edge functionality from composable
const { 
  loading, 
  error, 
  formatDate, 
  getTypeName, 
  getRegionName, 
  getTypeClass, 
  getRegionClass,
  fetchEdge,
  deleteEdge,
  openInGrafana,
  navigateToEdgeEdit,
  navigateToLocations,
} = useEdge()

// Delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Local state
const edge = ref(null)
const recentLocations = ref([])
const recentThings = ref([])
const allLocations = ref({}) // Map of location_id -> location for quick lookups
const totalLocationsCount = ref(0)
const totalThingsCount = ref(0)

// Check if edge has metadata
const hasEdgeMetadata = computed(() => {
  return edge.value && 
         edge.value.metadata && 
         typeof edge.value.metadata === 'object' && 
         Object.keys(edge.value.metadata).length > 0
})

// Fetch edge data on component mount
onMounted(async () => {
  const edgeId = router.currentRoute.value.params.id
  if (edgeId) {
    await loadEdgeDetail(edgeId)
  }
})

// Methods
const loadEdgeDetail = async (id) => {
  if (!id) return
  
  try {
    // Fetch edge data
    const edgeData = await fetchEdge(id)
    if (edgeData) {
      edge.value = edgeData
      
      // Now fetch associated locations and things
      await Promise.all([
        fetchLocationsCount(),
        fetchThingsCount(),
        fetchLocations(),
        fetchThings()
      ])
    }
  } catch (err) {
    // Error handling is done in the composable
    console.error('Failed to load edge detail:', err)
  }
}

// Fetch total locations count
const fetchLocationsCount = async () => {
  if (!edge.value) return
  
  try {
    const { locationService } = await import('../../../services')
    const response = await locationService.getList({
      edge_id: edge.value.id,
      rows: 1 // We only need the total count
    })
    
    totalLocationsCount.value = response.data.totalItems || 0
  } catch (err) {
    console.error('Error fetching locations count:', err)
  }
}

// Fetch total things count
const fetchThingsCount = async () => {
  if (!edge.value) return
  
  try {
    const { thingService } = await import('../../../services')
    const response = await thingService.getList({
      edge_id: edge.value.id,
      rows: 1 // We only need the total count
    })
    
    totalThingsCount.value = response.data.totalItems || 0
  } catch (err) {
    console.error('Error fetching things count:', err)
  }
}

// Fetch locations for this edge
const fetchLocations = async () => {
  if (!edge.value) return
  
  try {
    const { locationService } = await import('../../../services')
    const response = await locationService.getList({
      edge_id: edge.value.id,
      sort: '-created',
      perPage: 3 // Limit to 3 recent locations
    })
    
    recentLocations.value = response.data.items || []
    
    // Build a lookup map for locations
    recentLocations.value.forEach(loc => {
      allLocations.value[loc.id] = loc
    })
  } catch (err) {
    console.error('Error fetching locations:', err)
  }
}

// Fetch things for this edge
const fetchThings = async () => {
  if (!edge.value) return
  
  try {
    const { thingService } = await import('../../../services')
    const response = await thingService.getList({
      edge_id: edge.value.id,
      sort: '-created',
      perPage: 3 // Limit to 3 recent things
    })
    
    recentThings.value = response.data.items || []
  } catch (err) {
    console.error('Error fetching things:', err)
  }
}

// Location and thing navigation
const navigateToLocationDetail = (id) => {
  router.push({ name: 'location-detail', params: { id } })
}

const navigateToThingDetail = (id) => {
  router.push({ name: 'thing-detail', params: { id } })
}

// Navigate to things filtered by edge
const navigateToThings = (edgeId) => {
  router.push({ name: 'things', query: { edge: edgeId } })
}

// Get location name for a thing
const getLocationName = (locationId) => {
  const location = allLocations.value[locationId]
  return location ? location.name : 'Unknown location'
}

// Format location path for display
const formatPath = (path) => {
  if (!path) return ''
  return path.split('/').join(' > ')
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!edge.value) return
  confirmDelete(edge.value, 'Edge')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!edge.value) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteEdge(edge.value.id, edge.value.code)
  
  if (success) {
    resetDeleteDialog()
    router.push({ name: 'edges' })
  } else {
    updateDeleteDialog({ loading: false })
  }
}

// Type classes for location and thing types
const getLocationTypeClass = (typeCode) => {
  return typesStore.getLocationTypeClass(typeCode)
}

const getThingTypeClass = (typeCode) => {
  return typesStore.getThingTypeClass(typeCode)
}
</script>

<style scoped>
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

.location-card, .thing-card {
  transition: all 0.2s ease;
}

.location-card:hover, .thing-card:hover {
  transform: translateY(-2px);
}

/* Ensure dark mode styling for confirmation dialog */
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
</style>
