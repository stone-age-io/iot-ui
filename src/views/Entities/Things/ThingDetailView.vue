<!-- src/views/Entities/Things/ThingDetailView.vue -->
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
        Failed to load thing details
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Thing Details -->
    <div v-else-if="thing" class="thing-detail-container">
      <!-- Header Section with Thing title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Thing</div>
          <h1 class="text-2xl font-bold mb-1 text-content-primary dark:text-content-primary-dark">{{ thing.name }}</h1>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-primary-600 dark:text-primary-400">{{ thing.code }}</span>
            <span 
              class="badge"
              :class="getTypeClass(thing.type)"
            >
              {{ getTypeName(thing.type) }}
            </span>
          </div>
        </div>
        
        <div class="flex space-x-2">
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
      
      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="lg:col-span-2">
          <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition h-full">
            <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Thing Details</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <!-- Code -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Code</div>
                  <div class="font-mono text-lg text-content-primary dark:text-content-primary-dark">{{ thing.code }}</div>
                </div>
                
                <!-- Name -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Name</div>
                  <div class="text-lg text-content-primary dark:text-content-primary-dark">{{ thing.name }}</div>
                </div>
                
                <!-- Type -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Type</div>
                  <div class="flex items-center">
                    <span 
                      class="badge"
                      :class="getTypeClass(thing.type)"
                    >
                      {{ getTypeName(thing.type) }}
                    </span>
                  </div>
                </div>
                
                <!-- Status -->
                <div class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Status</div>
                  <div class="flex items-center">
                    <span 
                      class="badge"
                      :class="thing.active ? 
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
                    >
                      {{ thing.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
                
                <!-- Organization -->
                <div v-if="currentOrganization" class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Organization</div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs text-content-secondary dark:text-content-secondary-dark">{{ currentOrganization.code }}</span>
                    <span class="text-content-primary dark:text-content-primary-dark">{{ currentOrganization.name }}</span>
                  </div>
                </div>
                
                <!-- Location -->
                <div v-if="location" class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Location</div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs text-content-secondary dark:text-content-secondary-dark">{{ location.code }}</span>
                    <span class="text-content-primary dark:text-content-primary-dark">{{ location.name }}</span>
                    <Button
                      icon="pi pi-external-link"
                      class="p-button-text p-button-rounded p-button-sm"
                      @click="navigateToLocationDetail(location.id)"
                      tooltip="View Location"
                    />
                  </div>
                </div>
                
                <!-- Edge -->
                <div v-if="edge" class="detail-field">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Edge</div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs text-content-secondary dark:text-content-secondary-dark">{{ edge.code }}</span>
                    <span class="text-content-primary dark:text-content-primary-dark">{{ edge.name }}</span>
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
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Description</div>
                  <div class="text-content-primary dark:text-content-primary-dark">{{ thing.description }}</div>
                </div>
                
                <!-- Metadata (if any) -->
                <div v-if="hasMetadata(thing)" class="md:col-span-2">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Metadata</div>
                  <div class="p-3 rounded border font-mono text-sm overflow-x-auto bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark text-content-primary dark:text-content-primary-dark">
                    <pre>{{ JSON.stringify(thing.metadata, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats/Quick Info Card -->
        <div>
          <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition h-full">
            <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Overview</h2>
            </div>
            <div class="p-6">
              <div class="space-y-6">
                <!-- Status Info -->
                <div class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Device Status</div>
                  <div class="flex items-center">
                    <span 
                      class="w-3 h-3 rounded-full mr-2" 
                      :class="deviceStatus.online ? 'bg-green-500' : 'bg-red-500'"
                    ></span>
                    <div class="font-semibold text-content-primary dark:text-content-primary-dark">
                      {{ deviceStatus.online ? 'Online' : 'Offline' }}
                    </div>
                  </div>
                  <div class="text-xs mt-1 text-content-secondary dark:text-content-secondary-dark">
                    Last updated: {{ formatTime(deviceStatus.lastUpdated) }}
                  </div>
                </div>
                
                <!-- Metrics -->
                <div v-if="deviceStatus.metrics" class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Metrics</div>
                  <div class="space-y-2">
                    <div v-for="(value, key) in deviceStatus.metrics" :key="key" class="flex justify-between">
                      <span class="text-content-secondary dark:text-content-secondary-dark">{{ formatMetricName(key) }}:</span>
                      <span class="font-medium text-content-primary dark:text-content-primary-dark">{{ formatMetricValue(key, value) }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- View Activity Button -->
                <div class="stat-item">
                  <Button
                    label="View Activity"
                    icon="pi pi-history"
                    class="w-full"
                    @click="showActivityDialog = true"
                  />
                </div>
                
                <!-- Created Date -->
                <div class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Created</div>
                  <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(thing.created) }}</div>
                </div>
                
                <!-- Last Updated -->
                <div class="stat-item">
                  <div class="field-label text-content-secondary dark:text-content-secondary-dark">Last Updated</div>
                  <div class="text-content-secondary dark:text-content-secondary-dark">{{ formatDate(thing.updated) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Current State Card (if available) -->
      <div class="mt-6" v-if="thing.current_state && Object.keys(thing.current_state).length > 0">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Current State</h2>
          </div>
          <div class="p-6">
            <div class="p-4 rounded border font-mono text-sm overflow-x-auto bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark text-content-primary dark:text-content-primary-dark">
              <pre>{{ JSON.stringify(thing.current_state, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Message Stream Card -->                                                                                            <div class="mt-6">                                                                                                        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Message Stream</h2>
          </div>
          <div class="p-6">
            <ThingMessageFeed
              :thing="thingWithExpandedEdge"
              :maxMessages="50"
            />
          </div>
        </div>
      </div> 

      <!-- Graph Link Card -->
      <div class="mt-6">
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1">
                <h2 class="text-xl font-semibold mb-1 text-content-primary dark:text-content-primary-dark">Analytics & Monitoring</h2>
                <p class="text-content-secondary dark:text-content-secondary-dark">View detailed metrics and logs for this thing in Grafana.</p>
              </div>
              <Button
                label="Open in Grafana"
                icon="pi pi-external-link"
                @click="openInGrafana(thing.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Activity Dialog -->
    <Dialog
      v-model:visible="showActivityDialog"
      header="Device Activity"
      :modal="true"
      :style="{ width: '90%', maxWidth: '900px' }"
      class="thing-activity-dialog"
    >
      <div v-if="messagesLoading" class="flex justify-center items-center p-4">
        <ProgressSpinner 
          strokeWidth="4" 
          class="text-primary-500 dark:text-primary-400" 
        />
      </div>
      <div v-else>
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <span 
              class="w-3 h-3 rounded-full mr-2" 
              :class="deviceStatus.online ? 'bg-green-500' : 'bg-red-500'"
            ></span>
            <div class="font-semibold text-content-primary dark:text-content-primary-dark">
              {{ deviceStatus.online ? 'Online' : 'Offline' }}
            </div>
            <div class="text-xs ml-2 text-content-secondary dark:text-content-secondary-dark">
              Last updated: {{ formatTime(deviceStatus.lastUpdated) }}
            </div>
          </div>
          <div>
            <Button
              icon="pi pi-refresh"
              class="p-button-text p-button-sm"
              @click="loadMessages(thing.type)"
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
                <span class="text-content-primary dark:text-content-primary-dark">{{ getMessageTypeLabel(data.type) }}</span>
              </div>
            </template>
            
            <!-- Timestamp column -->
            <template #timestamp-body="{ data }">
              <div class="text-sm text-content-secondary dark:text-content-secondary-dark">
                {{ formatTime(data.timestamp) }}
              </div>
            </template>
            
            <!-- Summary column -->
            <template #summary-body="{ data }">
              <div class="text-content-primary dark:text-content-primary-dark">{{ data.summary }}</div>
            </template>
            
            <!-- Details column with expand/collapse -->
            <template #details-body="{ data, rowIndex }">
              <div>
                <Button
                  :icon="data.expanded ? 'pi pi-minus' : 'pi pi-plus'"
                  class="p-button-text p-button-sm p-button-rounded"
                  @click="toggleMessageDetails(rowIndex)"
                />
                <div v-if="data.expanded" class="mt-2 p-2 rounded border font-mono text-xs overflow-x-auto bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark text-content-primary dark:text-content-primary-dark">
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
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThing } from '../../../composables/useThing'
import { useMessages } from '../../../composables/useMessages'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTypesStore } from '../../../stores/types'
import { useOrganizationStore } from '../../../stores/organization'
import DataTable from '../../../components/common/DataTable.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import ThingMessageFeed from '../../../components/things/ThingMessageFeed.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const typesStore = useTypesStore()
const organizationStore = useOrganizationStore()

// Get current organization
const currentOrganization = computed(() => organizationStore.currentOrganization)

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

// Create a computed property that ensures edge is properly expanded in the thing object
const thingWithExpandedEdge = computed(() => {
  if (!thing.value) return null;
  
  // Create a copy of the thing object to avoid modifying the original
  const expandedThing = { ...thing.value };
  
  // If edge is loaded but not expanded in the thing, add it to the expand object
  if (edge.value && !expandedThing.expand?.edge_id) {
    expandedThing.expand = {
      ...(expandedThing.expand || {}),
      edge_id: edge.value
    };
  }
  
  return expandedThing;
});

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
      await loadMessages(thing.value.type)
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
    case 'device.status.online': return 'pi pi-power-off text-green-500';
    case 'device.status.offline': return 'pi pi-power-off text-red-500';
    case 'device.status.heartbeat': return 'pi pi-heart text-blue-500';
    case 'access.entry.granted': return 'pi pi-check-circle text-green-500';
    case 'access.entry.denied': return 'pi pi-times-circle text-red-500';
    case 'environment.temperature': return 'pi pi-chart-line text-orange-500';
    case 'environment.humidity': return 'pi pi-cloud text-blue-500';
    case 'error': return 'pi pi-exclamation-triangle text-red-500';
    case 'warning': return 'pi pi-exclamation-circle text-amber-500';
    case 'info': return 'pi pi-info-circle text-blue-500';
    default: return 'pi pi-circle-fill text-gray-500';
  }
}

// Get label for message type
const getMessageTypeLabel = (type) => {
  return type.split('.').pop()
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!thing.value) return
  confirmDelete(thing.value, 'Thing', 'code')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!thing.value) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteThing(thing.value.id, thing.value.code)
  
  if (success) {
    resetDeleteDialog()
    router.push({ name: 'things' })
  } else {
    updateDeleteDialog({ loading: false })
  }
}
</script>

<style scoped>
/* Theme-aware styling */
.thing-detail-container {
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

/* Fix dialog styling for dark mode */
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

:deep(.thing-activity-dialog .p-datatable) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.thing-activity-dialog .p-datatable-tbody > tr) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.thing-activity-dialog .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
}
</style>
