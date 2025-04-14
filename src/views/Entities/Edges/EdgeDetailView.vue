<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner 
        strokeWidth="4" 
        :class="themeValue.class('text-primary-500', 'text-primary-400')" 
      />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="p-error-container p-6 text-center">
      <div :class="['text-xl mb-4', textColor.error]">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load edge details
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Edge Details -->
    <div v-else-if="edge" class="edge-detail-container">
      <!-- Header Section with Edge title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div :class="['text-sm mb-1', textColor.secondary]">Edge Installation</div>
          <h1 :class="['text-2xl font-bold mb-1', textColor.primary]">{{ edge.name }}</h1>
          <div :class="['font-mono', textColor.secondary]">
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
      
      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="lg:col-span-2">
          <Card class="h-full">
            <template #title>
              <h2 :class="['text-xl font-semibold', textColor.primary]">Edge Details</h2>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <!-- Code -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Code</div>
                  <div :class="['font-mono text-lg', textColor.primary]">{{ edge.code }}</div>
                </div>
                
                <!-- Name -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Name</div>
                  <div :class="['text-lg', textColor.primary]">{{ edge.name }}</div>
                </div>
                
                <!-- Type -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Type</div>
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
                  <div :class="['field-label', textColor.secondary]">Region</div>
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
                  <div :class="['field-label', textColor.secondary]">Status</div>
                  <div class="flex items-center">
                    <span 
                      class="badge"
                      :class="edge.active ? 
                        themeValue.class('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300') : 
                        themeValue.class('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')"
                    >
                      {{ edge.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
                
                <!-- Metadata (if any) -->
                <div v-if="hasEdgeMetadata" class="md:col-span-2">
                  <div :class="['field-label', textColor.secondary]">Metadata</div>
                  <div :class="[
                    'p-3 rounded border font-mono text-sm overflow-x-auto', 
                    backgroundColor.secondary,
                    borderColor.default,
                    textColor.primary
                  ]">
                    <pre>{{ JSON.stringify(edge.metadata, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
        
        <!-- Stats/Quick Info Card -->
        <div>
          <Card class="h-full">
            <template #title>
              <h2 :class="['text-xl font-semibold', textColor.primary]">Overview</h2>
            </template>
            <template #content>
              <div class="space-y-6">
                <!-- Locations Count -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Locations</div>
                  <div class="flex items-center">
                    <i :class="['pi pi-map-marker mr-2', themeValue.class('text-green-600', 'text-green-400')]"></i>
                    <div :class="['text-2xl font-semibold', textColor.primary]">{{ stats.locationsCount }}</div>
                  </div>
                  <Button
                    label="View Locations"
                    icon="pi pi-arrow-right"
                    class="p-button-text p-button-sm mt-2"
                    @click="navigateToLocations(edge.id)"
                  />
                </div>
                
                <!-- Things Count -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Things</div>
                  <div class="flex items-center">
                    <i :class="['pi pi-wifi mr-2', themeValue.class('text-purple-600', 'text-purple-400')]"></i>
                    <div :class="['text-2xl font-semibold', textColor.primary]">{{ stats.thingsCount }}</div>
                  </div>
                  <Button
                    label="View Things"
                    icon="pi pi-arrow-right"
                    class="p-button-text p-button-sm mt-2"
                    @click="navigateToThings(edge.id)"
                  />
                </div>
                
                <!-- Created Date -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Created</div>
                  <div :class="textColor.secondary">{{ formatDate(edge.created) }}</div>
                </div>
                
                <!-- Last Updated -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Last Updated</div>
                  <div :class="textColor.secondary">{{ formatDate(edge.updated) }}</div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
      
      <!-- Recent Locations -->
      <div v-if="recentLocations.length > 0" class="mt-6">
        <Card>
          <template #title>
            <div class="flex justify-between items-center">
              <h2 :class="['text-xl font-semibold', textColor.primary]">Recent Locations</h2>
              <Button
                label="View All"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click="navigateToLocations(edge.id)"
              />
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="location in recentLocations" 
                :key="location.id"
                :class="[
                  'rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer location-card',
                  backgroundColor.secondary,
                  borderColor.light
                ]"
                @click="navigateToLocationDetail(location.id)"
              >
                <div class="flex justify-between items-start mb-2">
                  <span :class="themeValue.class('text-primary-600', 'text-primary-400') + ' font-mono'">{{ location.code }}</span>
                  <span 
                    class="badge"
                    :class="getLocationTypeClass(location.type)"
                  >
                    {{ typesStore.getTypeName(location.type, 'locationTypes') }}
                  </span>
                </div>
                <div :class="['font-semibold mb-1', textColor.primary]">{{ location.name }}</div>
                <div :class="['text-sm', textColor.secondary]">{{ formatPath(location.path) }}</div>
              </div>
            </div>
          </template>
        </Card>
      </div>
      
      <!-- Recent Things -->
      <div v-if="recentThings.length > 0" class="mt-6">
        <Card>
          <template #title>
            <div class="flex justify-between items-center">
              <h2 :class="['text-xl font-semibold', textColor.primary]">Recent Things</h2>
              <Button
                label="View All"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click="navigateToThings(edge.id)"
              />
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="thing in recentThings" 
                :key="thing.id"
                :class="[
                  'rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer thing-card',
                  backgroundColor.secondary,
                  borderColor.light
                ]"
                @click="navigateToThingDetail(thing.id)"
              >
                <div class="flex justify-between items-start mb-2">
                  <span :class="themeValue.class('text-primary-600', 'text-primary-400') + ' font-mono'">{{ thing.thing_code }}</span>
                  <span 
                    class="badge"
                    :class="getThingTypeClass(thing.thing_type)"
                  >
                    {{ typesStore.getTypeName(thing.thing_type, 'thingTypes') }}
                  </span>
                </div>
                <div :class="['font-semibold mb-1', textColor.primary]">{{ thing.name }}</div>
                <div :class="['text-sm', textColor.secondary]">{{ getLocationName(thing.location_id) }}</div>
              </div>
            </div>
          </template>
        </Card>
      </div>
      
      <!-- Analytics Link Card -->
      <div class="mt-6">
        <Card>
          <template #content>
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1">
                <h2 :class="['text-xl font-semibold mb-1', textColor.primary]">Analytics & Monitoring</h2>
                <p :class="textColor.secondary">View detailed metrics and logs for this edge in Grafana.</p>
              </div>
              <Button
                label="Open in Grafana"
                icon="pi pi-external-link"
                @click="openInGrafana(edge.id)"
              />
            </div>
          </template>
        </Card>
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
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEdge } from '../../../composables/useEdge'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTypesStore } from '../../../stores/types'
import { useTheme } from '../../../composables/useTheme'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const typesStore = useTypesStore()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor, shadowStyle } = useTheme()

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
  navigateToThings
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

// Check if edge has metadata
const hasEdgeMetadata = computed(() => {
  return edge.value && 
         edge.value.metadata && 
         typeof edge.value.metadata === 'object' && 
         Object.keys(edge.value.metadata).length > 0
})

// Stats based on real data
const stats = computed(() => ({
  locationsCount: recentLocations.value.length,
  thingsCount: recentThings.value.length
}))

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
        fetchLocations(),
        fetchThings()
      ])
    }
  } catch (err) {
    // Error handling is done in the composable
    console.error('Failed to load edge detail:', err)
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
      perPage: 6 // Limit to 6 recent locations
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
      perPage: 6 // Limit to 6 recent things
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
/* Theme-aware custom styling */
:deep(.p-card) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

:deep(.p-card .p-card-title) {
  padding: 1.25rem 1.5rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--surface-border);
  font-size: 1.25rem;
  font-weight: 600;
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

:deep(.p-card .p-card-footer) {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
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

.location-card, .thing-card {
  border-width: 1px;
  transition: all 0.2s ease;
}

.location-card:hover, .thing-card:hover {
  transform: translateY(-2px);
}

/* Error container styling */
.p-error-container {
  background-color: var(--surface-card);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--surface-border);
}

/* Fix PrimeVue Card styling in dark mode */
:deep(.dark .p-card),
:deep(.dark .p-card .p-card-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-card .p-card-title) {
  color: var(--text-color);
}

/* Fix button styling */
:deep(.p-button-text) {
  color: var(--primary-color);
}

:deep(.p-button-text:hover) {
  background: rgba(var(--primary-color-rgb), 0.04);
  color: var(--primary-color);
}

:deep(.dark .p-button-text) {
  color: var(--primary-200);
}

:deep(.dark .p-button-text:hover) {
  background: rgba(var(--primary-200-rgb), 0.16);
}
</style>
