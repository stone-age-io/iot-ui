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
        Failed to load thing details
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Thing Details -->
    <div v-else-if="thing" class="thing-detail-container">
      <!-- Header Section with Thing title and actions -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div :class="['text-sm mb-1', textColor.secondary]">Thing</div>
          <h1 :class="['text-2xl font-bold mb-1', textColor.primary]">{{ thing.name }}</h1>
          <div class="flex flex-wrap items-center gap-2">
            <span :class="['font-mono', themeValue.class('text-primary-600', 'text-primary-400')]">{{ thing.thing_code }}</span>
            <span 
              class="badge"
              :class="getTypeClass(thing.thing_type)"
            >
              {{ getTypeName(thing.thing_type) }}
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
          <Card class="h-full">
            <template #title>
              <h2 :class="['text-xl font-semibold', textColor.primary]">Thing Details</h2>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <!-- Code -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Code</div>
                  <div :class="['font-mono text-lg', textColor.primary]">{{ thing.thing_code }}</div>
                </div>
                
                <!-- Name -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Name</div>
                  <div :class="['text-lg', textColor.primary]">{{ thing.name }}</div>
                </div>
                
                <!-- Type -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Type</div>
                  <div class="flex items-center">
                    <span 
                      class="badge"
                      :class="getTypeClass(thing.thing_type)"
                    >
                      {{ getTypeName(thing.thing_type) }}
                    </span>
                  </div>
                </div>
                
                <!-- Status -->
                <div class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Status</div>
                  <div class="flex items-center">
                    <span 
                      class="badge"
                      :class="thing.active ? 
                        themeValue.class('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300') : 
                        themeValue.class('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')"
                    >
                      {{ thing.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
                
                <!-- Location -->
                <div v-if="location" class="detail-field">
                  <div :class="['field-label', textColor.secondary]">Location</div>
                  <div class="flex items-center gap-2">
                    <span :class="['font-mono text-xs', textColor.secondary]">{{ location.code }}</span>
                    <span :class="textColor.primary">{{ location.name }}</span>
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
                  <div :class="['field-label', textColor.secondary]">Edge</div>
                  <div class="flex items-center gap-2">
                    <span :class="['font-mono text-xs', textColor.secondary]">{{ edge.code }}</span>
                    <span :class="textColor.primary">{{ edge.name }}</span>
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
                  <div :class="['field-label', textColor.secondary]">Description</div>
                  <div :class="textColor.primary">{{ thing.description }}</div>
                </div>
                
                <!-- Metadata (if any) -->
                <div v-if="hasMetadata(thing)" class="md:col-span-2">
                  <div :class="['field-label', textColor.secondary]">Metadata</div>
                  <div :class="[
                    'p-3 rounded border font-mono text-sm overflow-x-auto', 
                    backgroundColor.secondary,
                    borderColor.default,
                    textColor.primary
                  ]">
                    <pre>{{ JSON.stringify(thing.metadata, null, 2) }}</pre>
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
                <!-- Status Info -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Device Status</div>
                  <div class="flex items-center">
                    <span 
                      class="w-3 h-3 rounded-full mr-2" 
                      :class="deviceStatus.online ? 'bg-green-500' : 'bg-red-500'"
                    ></span>
                    <div :class="['font-semibold', textColor.primary]">
                      {{ deviceStatus.online ? 'Online' : 'Offline' }}
                    </div>
                  </div>
                  <div :class="['text-xs mt-1', textColor.secondary]">
                    Last updated: {{ formatTime(deviceStatus.lastUpdated) }}
                  </div>
                </div>
                
                <!-- Metrics -->
                <div v-if="deviceStatus.metrics" class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Metrics</div>
                  <div class="space-y-2">
                    <div v-for="(value, key) in deviceStatus.metrics" :key="key" class="flex justify-between">
                      <span :class="textColor.secondary">{{ formatMetricName(key) }}:</span>
                      <span :class="['font-medium', textColor.primary]">{{ formatMetricValue(key, value) }}</span>
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
                  <div :class="['field-label', textColor.secondary]">Created</div>
                  <div :class="textColor.secondary">{{ formatDate(thing.created) }}</div>
                </div>
                
                <!-- Last Updated -->
                <div class="stat-item">
                  <div :class="['field-label', textColor.secondary]">Last Updated</div>
                  <div :class="textColor.secondary">{{ formatDate(thing.updated) }}</div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
      
      <!-- Current State Card (if available) -->
      <div class="mt-6" v-if="thing.current_state && Object.keys(thing.current_state).length > 0">
        <Card>
          <template #title>
            <h2 :class="['text-xl font-semibold', textColor.primary]">Current State</h2>
          </template>
          <template #content>
            <div :class="[
              'p-4 rounded border font-mono text-sm overflow-x-auto', 
              backgroundColor.secondary,
              borderColor.default,
              textColor.primary
            ]">
              <pre>{{ JSON.stringify(thing.current_state, null, 2) }}</pre>
            </div>
          </template>
        </Card>
      </div>
      
      <!-- Graph Link Card -->
      <div class="mt-6">
        <Card>
          <template #content>
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1">
                <h2 :class="['text-xl font-semibold mb-1', textColor.primary]">Analytics & Monitoring</h2>
                <p :class="textColor.secondary">View detailed metrics and logs for this thing in Grafana.</p>
              </div>
              <Button
                label="Open in Grafana"
                icon="pi pi-external-link"
                @click="openInGrafana(thing.id)"
              />
            </div>
          </template>
        </Card>
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
        <ProgressSpinner 
          strokeWidth="4" 
          :class="themeValue.class('text-primary-500', 'text-primary-400')" 
        />
      </div>
      <div v-else>
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <span 
              class="w-3 h-3 rounded-full mr-2" 
              :class="deviceStatus.online ? 'bg-green-500' : 'bg-red-500'"
            ></span>
            <div :class="['font-semibold', textColor.primary]">
              {{ deviceStatus.online ? 'Online' : 'Offline' }}
            </div>
            <div :class="['text-xs ml-2', textColor.secondary]">
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
                <span :class="textColor.primary">{{ getMessageTypeLabel(data.type) }}</span>
              </div>
            </template>
            
            <!-- Timestamp column -->
            <template #timestamp-body="{ data }">
              <div :class="['text-sm', textColor.secondary]">
                {{ formatTime(data.timestamp) }}
              </div>
            </template>
            
            <!-- Summary column -->
            <template #summary-body="{ data }">
              <div :class="textColor.primary">{{ data.summary }}</div>
            </template>
            
            <!-- Details column with expand/collapse -->
            <template #details-body="{ data, rowIndex }">
              <div>
                <Button
                  :icon="data.expanded ? 'pi pi-minus' : 'pi pi-plus'"
                  class="p-button-text p-button-sm p-button-rounded"
                  @click="toggleMessageDetails(rowIndex)"
                />
                <div v-if="data.expanded" :class="[
                  'mt-2 p-2 rounded border font-mono text-xs overflow-x-auto',
                  backgroundColor.secondary,
                  borderColor.default,
                  textColor.primary
                ]">
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
import { useTheme } from '../../../composables/useTheme'
import DataTable from '../../../components/common/DataTable.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const typesStore = useTypesStore()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor, shadowStyle } = useTheme()

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
  confirmDelete(thing.value, 'Thing', 'thing_code')
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

<style scoped>
/* Theme-aware styling */
.thing-detail-container {
  margin-bottom: 2rem;
}

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

/* Fix dialog styling in dark mode */
:deep(.dark .p-dialog) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.dark .p-dialog-header) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-bottom-color: var(--surface-border);
}

:deep(.dark .p-dialog-content) {
  background-color: var(--surface-card);
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
