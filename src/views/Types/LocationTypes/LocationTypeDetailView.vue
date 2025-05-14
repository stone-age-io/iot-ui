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
    <div v-else-if="error" class="p-6 text-center bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark rounded-lg shadow-theme-md">
      <div class="text-xl mb-4 text-red-600 dark:text-red-400">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load location type details
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Location Type Details -->
    <div v-else-if="typeData" class="location-type-detail-container">
      <!-- Header Section with Type title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Location Type</div>
          <h1 class="text-2xl font-bold mb-1 text-content-primary dark:text-content-primary-dark">{{ typeData.type }}</h1>
          <div class="font-mono text-content-secondary dark:text-content-secondary-dark">
            <span class="px-2 py-1 rounded bg-surface-secondary dark:bg-surface-secondary-dark border border-border-secondary dark:border-border-secondary-dark">
              {{ typeData.code }}
            </span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToTypeEdit(typeData.id)"
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
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Type Details</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Name -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Name</div>
              <div class="text-lg text-content-primary dark:text-content-primary-dark">{{ typeData.type }}</div>
            </div>
            
            <!-- Code -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Code</div>
              <div class="font-mono text-lg text-content-primary dark:text-content-primary-dark">{{ typeData.code }}</div>
            </div>
            
            <!-- Style Preview -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Style Preview</div>
              <div class="flex items-center mt-2">
                <span 
                  :class="[getTypeClass(typeData.code), 'px-3 py-1 rounded-full text-sm']"
                >
                  {{ typeData.type }}
                </span>
              </div>
            </div>
            
            <!-- Created Date -->
            <div class="detail-field">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Created</div>
              <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(typeData.created) }}</div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <div class="field-label text-content-secondary dark:text-content-secondary-dark">Description</div>
              <div class="p-3 rounded border bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark text-content-primary dark:text-content-primary-dark">
                {{ typeData.description || 'No description provided' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Locations using this type with count in title -->
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
                @click="navigateToLocations(typeData.code)"
              />
            </div>
          </div>
          <div class="p-6">
            <div v-if="recentLocations.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="location in recentLocations" 
                :key="location.id"
                class="rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer location-card bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark theme-transition"
                @click="navigateToLocationDetail(location.id)"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="text-primary-600 dark:text-primary-400 font-mono">{{ location.code }}</span>
                </div>
                <div class="font-semibold mb-1 text-content-primary dark:text-content-primary-dark">{{ location.name }}</div>
                <div class="text-sm text-content-secondary dark:text-content-secondary-dark">
                  {{ formatPath(location.path) }}
                </div>
              </div>
            </div>
            <div v-else class="p-4 text-center text-content-secondary dark:text-content-secondary-dark">
              Loading locations...
            </div>
          </div>
        </div>
      </div>
      
      <!-- Code Example Card -->
      <div class="mt-6">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Code Example</h2>
          </div>
          <div class="p-6">
            <p class="mb-3 text-content-secondary dark:text-content-secondary-dark">
              This is an example of how this location type's code is used to generate location codes:
            </p>
            
            <div class="p-4 rounded-md font-mono border bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark">
              <div class="text-content-secondary dark:text-content-secondary-dark">// Example location code structure</div>
              <div class="mt-2">
                <span class="text-blue-600 dark:text-blue-400">{{ typeData.code }}</span>
                <span class="text-content-secondary dark:text-content-secondary-dark">-101</span>
              </div>
              <div class="mt-2 text-content-secondary dark:text-content-secondary-dark">// e.g., {{ typeData.code }}-101</div>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationType } from '../../../composables/useLocationType'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()

// Location type functionality from composable
const { 
  loading, 
  error, 
  formatDate,
  fetchType,
  deleteType,
  getTypeClass,
  navigateToTypeList,
  navigateToTypeEdit
} = useLocationType()

// Delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Local state
const typeData = ref(null)
const totalLocationsCount = ref(0)
const recentLocations = ref([])

// Fetch location type data on component mount
onMounted(async () => {
  await loadTypeDetail()
})

// Methods
const loadTypeDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch location type data
    const data = await fetchType(id)
    if (data) {
      typeData.value = data
      
      // Fetch usage stats and recent locations
      await Promise.all([
        fetchLocationsCount(),
        fetchRecentLocations()
      ])
    }
  } catch (err) {
    // Error handling is done in the composable
  }
}

// Fetch count of locations using this type
const fetchLocationsCount = async () => {
  if (!typeData.value || !typeData.value.code) return
  
  try {
    const { locationService } = await import('../../../services')
    const response = await locationService.getList({
      type: typeData.value.code,
      fields: 'id', // Only fetch IDs to make the request lighter
      '$countOnly': true // Request only count if endpoint supports it
    })
    
    totalLocationsCount.value = response.data.totalItems || 0
  } catch (err) {
    console.error('Error fetching locations count:', err)
    totalLocationsCount.value = 0
  }
}

// Fetch recent locations using this type
const fetchRecentLocations = async () => {
  if (!typeData.value || !typeData.value.code) return
  
  try {
    const { locationService } = await import('../../../services')
    const response = await locationService.getList({
      type: typeData.value.code,
      sort: '-created',
      perPage: 3, // Limit to 3 recent locations
    })
    
    recentLocations.value = response.data.items || []
  } catch (err) {
    console.error('Error fetching recent locations:', err)
    recentLocations.value = []
  }
}

// Format location path for display
const formatPath = (path) => {
  if (!path) return ''
  return path.split('/').join(' > ')
}

// Navigate to locations filtered by this type
const navigateToLocations = (typeCode) => {
  router.push({ 
    name: 'locations',
    query: { type: typeCode }
  })
}

// Navigate to location detail
const navigateToLocationDetail = (id) => {
  router.push({ 
    name: 'location-detail', 
    params: { id } 
  })
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!typeData.value) return
  
  // Show warning if there are locations using this type
  if (totalLocationsCount.value > 0) {
    confirmDelete(
      typeData.value,
      'location type',
      'type',
      {
        message: `Are you sure you want to delete location type "${typeData.value.type}"?`,
        details: `This type is currently used by ${totalLocationsCount.value} location${totalLocationsCount.value > 1 ? 's' : ''}. Deleting it may cause issues with those locations.`
      }
    )
  } else {
    confirmDelete(typeData.value, 'location type', 'type')
  }
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!typeData.value) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteType(typeData.value.id, typeData.value.type)
  
  if (success) {
    resetDeleteDialog()
    navigateToTypeList()
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>

<style scoped>
.field-label {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.detail-field {
  display: flex;
  flex-direction: column;
}

.location-card {
  transition: all 0.2s ease;
}

.location-card:hover {
  transform: translateY(-2px);
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
  color: var(--primary-400);
}

:deep(.dark .p-button-text:hover) {
  background: rgba(var(--primary-400-rgb), 0.16);
  color: var(--primary-300);
}
</style>
