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
        Failed to load thing details
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Thing Details -->
    <div v-else-if="thing">
      <div class="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">Thing</div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ thing.name }}</h1>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-primary-600">{{ thing.thing_code }}</span>
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="getTypeClass(thing.thing_type)"
            >
              {{ getTypeName(thing.thing_type) }}
            </span>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToThingEdit(thing.id)"
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
          <h2 class="text-xl font-semibold mb-4">Thing Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Code -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Code</div>
              <div class="font-mono text-lg">{{ thing.thing_code }}</div>
            </div>
            
            <!-- Name -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Name</div>
              <div class="text-lg">{{ thing.name }}</div>
            </div>
            
            <!-- Type -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Type</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="getTypeClass(thing.thing_type)"
                >
                  {{ getTypeName(thing.thing_type) }}
                </span>
              </div>
            </div>
            
            <!-- Status -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Status</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="thing.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ thing.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            
            <!-- Location -->
            <div v-if="location">
              <div class="text-sm text-gray-500 mb-1">Location</div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs">{{ location.code }}</span>
                <span class="text-gray-700">{{ location.name }}</span>
                <Button
                  icon="pi pi-external-link"
                  class="p-button-text p-button-rounded p-button-sm"
                  @click="navigateToLocationDetail(location.id)"
                  tooltip="View Location"
                />
              </div>
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
            
            <!-- Description -->
            <div class="md:col-span-2" v-if="thing.description">
              <div class="text-sm text-gray-500 mb-1">Description</div>
              <div class="text-gray-700">{{ thing.description }}</div>
            </div>
            
            <!-- Metadata (if any) -->
            <div v-if="hasMetadata(thing)" class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Metadata</div>
              <div class="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
                <pre>{{ JSON.stringify(thing.metadata, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats/Quick Info Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Overview</h2>
          
          <div class="space-y-6">
            <!-- Status Info -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Device Status</div>
              <div class="flex items-center">
                <span 
                  class="w-3 h-3 rounded-full mr-2" 
                  :class="deviceStatus.online ? 'bg-green-500' : 'bg-red-500'"
                ></span>
                <div class="font-semibold">{{ deviceStatus.online ? 'Online' : 'Offline' }}</div>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Last updated: {{ formatTime(deviceStatus.lastUpdated) }}
              </div>
            </div>
            
            <!-- Metrics -->
            <div v-if="deviceStatus.metrics">
              <div class="text-sm text-gray-500 mb-1">Metrics</div>
              <div class="space-y-2">
                <div v-for="(value, key) in deviceStatus.metrics" :key="key" class="flex justify-between">
                  <span class="text-gray-600">{{ formatMetricName(key) }}:</span>
                  <span class="font-medium">{{ formatMetricValue(key, value) }}</span>
                </div>
              </div>
            </div>
            
            <!-- View Activity Button -->
            <div>
              <Button
                label="View Activity"
                icon="pi pi-history"
                class="w-full"
                @click="showActivityDialog = true"
              />
            </div>
            
            <!-- Created & Updated Dates -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(thing.created) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(thing.updated) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Current State Card (if available) -->
      <div class="card mt-6" v-if="thing.current_state && Object.keys(thing.current_state).length > 0">
        <h2 class="text-xl font-semibold mb-4">Current State</h2>
        
        <div class="bg-gray-50 p-4 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
          <pre>{{ JSON.stringify(thing.current_state, null, 2) }}</pre>
        </div>
      </div>
      
      <!-- Graph Link Card -->
      <div class="card mt-6">
        <div class="flex items-center">
          <div class="flex-1">
            <h2 class="text-xl font-semibold mb-1">Analytics & Monitoring</h2>
            <p class="text-gray-600">View detailed metrics and logs for this thing in Grafana.</p>
          </div>
          <Button
            label="Open in Grafana"
            icon="pi pi-external-link"
            @click="openInGrafana(thing.id)"
          />
        </div>
      </div>
    </div>
    
    <!-- Activity Dialog -->
    <Dialog
      v-model:visible="showActivityDialog"
      header="Device Activity"
      :modal="true"
      :style="{ width: '90%', maxWidth: '900px' }"
    >
      <div v-if="messagesLoading" class="flex justify-center items-center p-4">
        <ProgressSpinner strokeWidth="4" />
      </div>
      <div v-else>
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <span 
              class="w-3 h-3 rounded-full mr-2" 
              :class="deviceStatus.online ? 'bg-green-500' : 'bg-red-500'"
            ></span>
            <div class="font-semibold">{{ deviceStatus.online ? 'Online' : 'Offline' }}</div>
            <div class="text-xs text-gray-500 ml-2">
              Last updated: {{ formatTime(deviceStatus.lastUpdated) }}
            </div>
          </div>
          <div>
            <Button
              icon="pi pi-refresh"
              class="p-button-text p-button-sm"
              @click="loadMessages(thing.thing_type)"
              :loading="messagesLoading"
            />
            <Button
              :icon="messagesPaused ? 'pi pi-play' : 'pi pi-pause'"
              class="p-button-text p-button-sm"
              @click="toggleMessagesPause"
              :disabled="messagesLoading"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-text p-button-sm p-button-danger"
              @click="clearMessages"
              :disabled="messagesLoading || messages.length === 0"
            />
          </div>
        </div>
        
        <div class="card">
          <DataTable
            :items="messages"
            :columns="messageColumns"
            :paginated="true"
            :rows="5"
            empty-message="No messages available"
          >
            <!-- Type column with icon -->
            <template #type-body="{ data }">
              <div class="flex items-center">
                <i 
                  class="mr-2"
                  :class="getMessageTypeIcon(data.type)"
                ></i>
                <span>{{ getMessageTypeLabel(data.type) }}</span>
              </div>
            </template>
            
            <!-- Timestamp column -->
            <template #timestamp-body="{ data }">
              <div class="text-sm text-gray-600">
                {{ formatTime(data.timestamp) }}
              </div>
            </template>
            
            <!-- Summary column -->
            <template #summary-body="{ data }">
              <div>{{ data.summary }}</div>
            </template>
            
            <!-- Details column with expand/collapse -->
            <template #details-body="{ data, rowIndex }">
              <div>
                <Button
                  :icon="data.expanded ? 'pi pi-minus' : 'pi pi-plus'"
                  class="p-button-text p-button-sm p-button-rounded"
                  @click="toggleMessageDetails(rowIndex)"
                />
                <div v-if="data.expanded" class="mt-2 bg-gray-50 p-2 rounded border border-gray-100 font-mono text-xs overflow-x-auto">
                  <pre>{{ JSON.stringify(data.payload, null, 2) }}</pre>
                </div>
              </div>
            </template>
          </DataTable>
          
          <div class="flex justify-center mt-4" v-if="hasMoreMessages">
            <Button
              label="Load More"
              icon="pi pi-plus"
              class="p-button-outlined p-button-sm"
              @click="loadMoreMessages"
              :loading="messagesLoading"
              :disabled="messagesLoading"
            />
          </div>
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
import { useThing } from '../../../composables/useThing'
import { useMessages } from '../../../composables/useMessages'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTypesStore } from '../../../stores/types'
import DataTable from '../../../components/common/DataTable.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const typesStore = useTypesStore()

// Ensure thing types are loaded
typesStore.loadThingTypes()

// Thing functionality from composable
const { 
  loading, 
  error, 
  formatDate,
  formatTime,
  getTypeName,
  getTypeClass,
  formatMetricName,
  formatMetricValue,
  hasMetadata,
  fetchThing,
  deleteThing,
  openInGrafana,
  navigateToThingEdit,
  navigateToLocationDetail,
  navigateToEdgeDetail
} = useThing()

// Messages functionality from composable
const {
  deviceStatus,
  messages,
  hasMoreMessages,
  loading: messagesLoading,
  loadMessages,
  loadMoreMessages,
  toggleMessageDetails
} = useMessages()

// Delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Local state
const thing = ref(null)
const location = ref(null)
const edge = ref(null)
const showActivityDialog = ref(false)
const messagesPaused = ref(false)

// Column definitions for messages table
const messageColumns = [
  { field: 'type', header: 'Type', sortable: true },
  { field: 'timestamp', header: 'Time', sortable: true },
  { field: 'summary', header: 'Description', sortable: false },
  { field: 'details', header: 'Details', sortable: false }
]

// Fetch thing data on component mount
onMounted(async () => {
  await loadThingDetail()
})

// Methods
const loadThingDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch thing data
    const thingData = await fetchThing(id)
    if (thingData) {
      thing.value = thingData
      
      // Fetch related data
      await Promise.all([
        fetchLocation(),
        fetchEdge()
      ])
      
      // Load initial messages
      await loadMessages(thing.value.thing_type)
    }
  } catch (err) {
    // Error handling is done in the composable
    console.error('Error in loadThingDetail:', err)
  }
}

// Fetch location for this thing
const fetchLocation = async () => {
  if (!thing.value || !thing.value.location_id) return
  
  try {
    const { locationService } = await import('../../../services')
    const response = await locationService.getById(thing.value.location_id)
    location.value = response.data
  } catch (err) {
    console.error('Error fetching location:', err)
  }
}

// Fetch edge for this thing
const fetchEdge = async () => {
  if (!thing.value || !thing.value.edge_id) return
  
  try {
    const { edgeService } = await import('../../../services')
    const response = await edgeService.getById(thing.value.edge_id)
    edge.value = response.data
  } catch (err) {
    console.error('Error fetching edge:', err)
  }
}

// Toggle pause/resume messages
const toggleMessagesPause = () => {
  messagesPaused.value = !messagesPaused.value
}

// Clear messages list
const clearMessages = () => {
  messages.value = []
}

// Get icon for message type
const getMessageTypeIcon = (type) => {
  switch (type) {
    case 'device.status.online': return 'pi pi-power-off text-green-500'
    case 'device.status.offline': return 'pi pi-power-off text-red-500'
    case 'device.status.heartbeat': return 'pi pi-heart text-blue-500'
    case 'access.entry.granted': return 'pi pi-check-circle text-green-500'
    case 'access.entry.denied': return 'pi pi-times-circle text-red-500'
    case 'environment.temperature': return 'pi pi-chart-line text-orange-500'
    case 'environment.humidity': return 'pi pi-cloud text-blue-500'
    case 'error': return 'pi pi-exclamation-triangle text-red-500'
    case 'warning': return 'pi pi-exclamation-circle text-amber-500'
    case 'info': return 'pi pi-info-circle text-blue-500'
    default: return 'pi pi-circle-fill text-gray-500'
  }
}

// Get label for message type
const getMessageTypeLabel = (type) => {
  return type.split('.').pop()
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!thing.value) return
  confirmDelete(thing.value, 'thing', 'thing_code')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!thing.value) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteThing(thing.value.id, thing.value.thing_code)
  
  if (success) {
    resetDeleteDialog()
    router.push({ name: 'things' })
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>
