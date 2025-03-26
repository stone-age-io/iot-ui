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
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">
            <router-link :to="{ name: 'edges' }" class="text-primary-600 hover:underline">
              Edges
            </router-link>
            <i class="pi pi-angle-right mx-1 text-gray-400"></i>
            <router-link 
              :to="{ name: 'locations', query: { edge: thing.edge_id } }" 
              class="text-primary-600 hover:underline"
            >
              Locations
            </router-link>
            <i class="pi pi-angle-right mx-1 text-gray-400"></i>
            <router-link 
              :to="{ name: 'location-detail', params: { id: thing.location_id } }" 
              class="text-primary-600 hover:underline"
            >
              {{ thing.expand?.location_id?.code || thing.location_id }}
            </router-link>
          </div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ thing.name }}</h1>
          <div class="text-gray-600">
            <span class="font-mono">{{ thing.code }}</span>
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
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="card lg:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Thing Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Code -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Code</div>
              <div class="font-mono text-lg">{{ thing.code }}</div>
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
                  :class="getTypeClass(thing.type)"
                >
                  {{ getTypeName(thing.type) }}
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
            
            <!-- Location Reference -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Location</div>
              <div class="flex items-center">
                <router-link 
                  :to="{ name: 'location-detail', params: { id: thing.location_id } }"
                  class="text-primary-600 hover:underline flex items-center"
                >
                  {{ thing.expand?.location_id?.code || thing.location_id }}
                  <span class="text-gray-500 ml-2">{{ thing.expand?.location_id?.name }}</span>
                </router-link>
              </div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Description</div>
              <div class="text-gray-700">{{ thing.description || 'No description provided' }}</div>
            </div>

            <!-- Metadata (if any) -->
            <div v-if="hasThingMetadata" class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Metadata</div>
              <div class="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
                <pre>{{ JSON.stringify(thing.metadata, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Monitoring & Status Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Monitoring</h2>
          
          <div class="space-y-6">
            <!-- Current Status -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Current Status</div>
              <div class="flex items-center">
                <span 
                  class="w-3 h-3 rounded-full mr-2"
                  :class="deviceStatus.online ? 'bg-green-500' : 'bg-red-500'"
                ></span>
                <div class="font-medium">{{ deviceStatus.online ? 'Online' : 'Offline' }}</div>
              </div>
              <div class="text-sm text-gray-500 mt-1">
                Last updated: {{ formatTime(deviceStatus.lastUpdated) }}
              </div>
            </div>
            
            <!-- Device Metrics (if available) -->
            <div v-if="deviceStatus.metrics && Object.keys(deviceStatus.metrics).length > 0">
              <div class="text-sm text-gray-500 mb-2">Device Metrics</div>
              <div class="space-y-3">
                <div 
                  v-for="(value, key) in deviceStatus.metrics" 
                  :key="key"
                  class="flex justify-between items-center"
                >
                  <div class="text-gray-700 capitalize">{{ formatMetricName(key) }}</div>
                  <div class="font-medium">{{ formatMetricValue(key, value) }}</div>
                </div>
              </div>
            </div>
            
            <!-- Created Date -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(thing.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(thing.updated) }}</div>
            </div>
          </div>
          
          <!-- View in Grafana Button -->
          <div class="mt-6">
            <Button
              label="View in Grafana"
              icon="pi pi-external-link"
              @click="openInGrafana(thing.id)"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <!-- Message Stream Card -->
      <div class="card mt-6">
        <h2 class="text-xl font-semibold mb-4">Recent Messages</h2>
        
        <div v-if="messages.length === 0" class="text-center py-6 text-gray-500">
          No recent messages available.
        </div>
        
        <div v-else class="space-y-4">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            class="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
          >
            <div class="flex justify-between items-start mb-1">
              <div class="font-medium">{{ message.type }}</div>
              <div class="text-sm text-gray-500">{{ formatTime(message.timestamp) }}</div>
            </div>
            <div class="text-sm mb-2">{{ message.summary }}</div>
            <div 
              v-if="message.expanded" 
              class="bg-gray-50 p-3 rounded text-sm font-mono text-gray-700 break-all whitespace-pre-wrap"
            >
              {{ JSON.stringify(message.payload, null, 2) }}
            </div>
            <Button
              :label="message.expanded ? 'Hide Details' : 'Show Details'"
              :icon="message.expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              class="p-button-text p-button-sm mt-1"
              @click="toggleMessageDetails(index)"
            />
          </div>
        </div>
        
        <div class="flex justify-center mt-4">
          <Button
            label="Load More"
            icon="pi pi-refresh"
            class="p-button-outlined"
            :disabled="!hasMoreMessages"
            @click="loadMoreMessages"
          />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useThing } from '../../../composables/useThing'
import { useMessages } from '../../../composables/useMessages'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const route = useRoute()

// Thing functionality from composable
const { 
  loading, 
  error, 
  formatDate,
  hasMetadata: hasThingMetadata,
  getTypeName, 
  getTypeClass,
  formatMetricName,
  formatMetricValue,
  fetchThing,
  deleteThing,
  openInGrafana,
  navigateToThingEdit
} = useThing()

// Message functionality from composable
const {
  deviceStatus,
  messages,
  hasMoreMessages,
  formatTime,
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
      
      // Load mock messages based on thing type
      await loadMessages(thingData.type)
    }
  } catch (err) {
    // Error handling is done in the composable
  }
}

// Handle delete button click
const handleDeleteClick = () => {
  if (!thing.value) return
  confirmDelete(thing.value, 'thing', 'code')
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
