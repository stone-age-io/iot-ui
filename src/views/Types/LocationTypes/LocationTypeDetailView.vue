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
        Failed to load location type details
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Location Type Details -->
    <div v-else-if="typeData">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">Location Type</div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ typeData.type }}</h1>
          <div class="text-gray-600">
            <span class="font-mono bg-gray-100 px-2 py-1 rounded">{{ typeData.code }}</span>
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
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="card lg:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Type Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Name -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Name</div>
              <div class="text-lg">{{ typeData.type }}</div>
            </div>
            
            <!-- Code -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Code</div>
              <div class="font-mono text-lg">{{ typeData.code }}</div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Description</div>
              <div class="bg-gray-50 p-3 rounded border border-gray-200">
                {{ typeData.description || 'No description provided' }}
              </div>
            </div>

            <!-- Style Preview -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Style Preview</div>
              <div class="flex items-center mt-2">
                <span :class="getTypeClass(typeData.code)" class="px-3 py-1 rounded-full text-sm mr-2">
                  {{ typeData.type }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats/Info Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Information</h2>
          
          <div class="space-y-6">
            <!-- Created Date -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(typeData.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(typeData.updated) }}</div>
            </div>
            
            <!-- Location Usage -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Used by Locations</div>
              <div class="flex items-center">
                <i class="pi pi-map-marker text-green-600 mr-2"></i>
                <div class="text-2xl font-semibold">{{ usageStats?.count || 0 }}</div>
              </div>
              <Button
                label="View Locations"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm mt-2"
                @click="navigateToLocations(typeData.code)"
                :disabled="!usageStats?.count"
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
    
    <!-- Toast for success/error messages -->
    <Toast />
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
const usageStats = ref(null)

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
      
      // Fetch usage stats (locations using this type)
      await fetchUsageStats()
    }
  } catch (err) {
    // Error handling is done in the composable
  }
}

// Fetch stats about how many locations use this type
const fetchUsageStats = async () => {
  if (!typeData.value || !typeData.value.code) return
  
  try {
    const { locationService } = await import('../../../services')
    const response = await locationService.getLocations({
      type: typeData.value.code,
      fields: 'id', // Only fetch IDs to make the request lighter
      '$countOnly': true // Request only count if endpoint supports it
    })
    
    usageStats.value = {
      count: response.data.totalItems || 0
    }
  } catch (err) {
    console.error('Error fetching usage stats:', err)
    usageStats.value = { count: 0 }
  }
}

// Navigate to locations filtered by this type
const navigateToLocations = (typeCode) => {
  router.push({ 
    name: 'locations',
    query: { type: typeCode }
  })
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!typeData.value) return
  
  // Show warning if there are locations using this type
  if (usageStats.value && usageStats.value.count > 0) {
    confirmDelete(
      typeData.value,
      'location type',
      'type',
      {
        message: `Are you sure you want to delete location type "${typeData.value.type}"?`,
        details: `This type is currently used by ${usageStats.value.count} location${usageStats.value.count > 1 ? 's' : ''}. Deleting it may cause issues with those locations.`
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
