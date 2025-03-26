<!-- src/views/Messaging/TopicPermissions/TopicPermissionDetailView.vue -->
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
        Failed to load permission details
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Permission Details -->
    <div v-else-if="permission">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">Permission Role</div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ permission.name }}</h1>
          <div class="text-gray-600">
            <span>{{ getTopicsCount(permission) }} total topics</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToPermissionEdit(permission.id)"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="confirmDelete"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Topics Lists Card -->
        <div class="card lg:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Permission Topics</h2>
          
          <TabView>
            <!-- Publish Topics Tab -->
            <TabPanel header="Publish Permissions">
              <div class="p-2">
                <p class="text-gray-600 mb-4">
                  Topics this role can publish to:
                </p>
                
                <div v-if="permission.publish_permissions.length > 0">
                  <div class="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                    <div class="flex items-center text-blue-800 mb-2">
                      <i class="pi pi-arrow-up-right mr-2"></i>
                      <span class="font-medium">{{ permission.publish_permissions.length }} Publish Topics</span>
                    </div>
                    <p class="text-sm text-blue-600">
                      Clients with this role can publish messages to these topics.
                    </p>
                  </div>
                  
                  <div class="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <ul class="divide-y divide-gray-200">
                      <li v-for="(topic, index) in permission.publish_permissions" :key="`pub-${index}`" class="p-3 hover:bg-gray-50">
                        <div class="flex items-center">
                          <span class="font-mono flex-grow">{{ topic }}</span>
                          <Button
                            icon="pi pi-copy"
                            class="p-button-text p-button-sm"
                            @click="copyToClipboard(topic)"
                            tooltip="Copy"
                          />
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div v-else class="bg-gray-50 p-6 rounded-md text-center text-gray-500">
                  <i class="pi pi-ban text-2xl mb-2 block"></i>
                  <p>No publish permissions defined</p>
                  <p class="text-sm mt-2">Clients with this role cannot publish to any topics</p>
                  
                  <Button
                    label="Add Publish Topics"
                    icon="pi pi-plus"
                    class="p-button-outlined p-button-sm mt-4"
                    @click="navigateToPermissionEdit(permission.id)"
                  />
                </div>
              </div>
            </TabPanel>
            
            <!-- Subscribe Topics Tab -->
            <TabPanel header="Subscribe Permissions">
              <div class="p-2">
                <p class="text-gray-600 mb-4">
                  Topics this role can subscribe to:
                </p>
                
                <div v-if="permission.subscribe_permissions.length > 0">
                  <div class="bg-green-50 p-3 rounded-md border border-green-100 mb-4">
                    <div class="flex items-center text-green-800 mb-2">
                      <i class="pi pi-arrow-down-right mr-2"></i>
                      <span class="font-medium">{{ permission.subscribe_permissions.length }} Subscribe Topics</span>
                    </div>
                    <p class="text-sm text-green-600">
                      Clients with this role can subscribe to receive messages from these topics.
                    </p>
                  </div>
                  
                  <div class="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <ul class="divide-y divide-gray-200">
                      <li v-for="(topic, index) in permission.subscribe_permissions" :key="`sub-${index}`" class="p-3 hover:bg-gray-50">
                        <div class="flex items-center">
                          <span class="font-mono flex-grow">{{ topic }}</span>
                          <Button
                            icon="pi pi-copy"
                            class="p-button-text p-button-sm"
                            @click="copyToClipboard(topic)"
                            tooltip="Copy"
                          />
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div v-else class="bg-gray-50 p-6 rounded-md text-center text-gray-500">
                  <i class="pi pi-ban text-2xl mb-2 block"></i>
                  <p>No subscribe permissions defined</p>
                  <p class="text-sm mt-2">Clients with this role cannot subscribe to any topics</p>
                  
                  <Button
                    label="Add Subscribe Topics"
                    icon="pi pi-plus"
                    class="p-button-outlined p-button-sm mt-4"
                    @click="navigateToPermissionEdit(permission.id)"
                  />
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>
        
        <!-- Clients Using Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Clients Using This Role</h2>
          
          <div v-if="loadingClients" class="flex justify-center items-center py-6">
            <ProgressSpinner :style="{width: '30px', height: '30px'}" />
          </div>
          
          <div v-else-if="clientError" class="bg-red-50 p-4 rounded-md text-center">
            <i class="pi pi-exclamation-circle text-red-500 text-2xl mb-2 block"></i>
            <p class="text-red-600">{{ clientError }}</p>
            <Button
              label="Try Again"
              icon="pi pi-refresh"
              class="p-button-outlined p-button-sm mt-4"
              @click="loadClients"
            />
          </div>
          
          <div v-else-if="clients.length === 0" class="bg-gray-50 p-6 rounded-md text-center text-gray-500">
            <i class="pi pi-users text-2xl mb-2 block"></i>
            <p>No clients are using this role</p>
            <p class="text-sm mt-2">Assign this role to clients to control their access</p>
            
            <Button
              label="Create Client with This Role"
              icon="pi pi-plus"
              class="p-button-outlined p-button-sm mt-4"
              @click="navigateToCreateClient(permission.id)"
            />
          </div>
          
          <div v-else>
            <p class="text-gray-600 mb-4">
              {{ clients.length }} {{ clients.length === 1 ? 'client is' : 'clients are' }} using this role:
            </p>
            
            <div class="bg-white border border-gray-200 rounded-md overflow-hidden">
              <ul class="divide-y divide-gray-200">
                <li v-for="client in clients" :key="client.id" class="p-3 hover:bg-gray-50">
                  <router-link
                    :to="{ name: 'client-detail', params: { id: client.id } }"
                    class="flex items-center justify-between text-gray-700 hover:text-primary-600"
                  >
                    <div>
                      <span class="font-medium">{{ client.username }}</span>
                      <span 
                        class="ml-2 px-2 py-0.5 text-xs rounded-full"
                        :class="client.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                      >
                        {{ client.active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                    <i class="pi pi-chevron-right text-gray-400"></i>
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
          
          <!-- Metadata -->
          <div class="mt-6 space-y-4">
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(permission.created) }}</div>
            </div>
            
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(permission.updated) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:visible="deleteDialog.visible"
      title="Delete Permission Role"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete the '${permission?.name || ''}' role?`"
      details="This action cannot be undone. Clients using this permission role will lose their access."
      @confirm="handleDeletePermission"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useTopicPermission } from '../../../composables/useTopicPermission'
import { topicPermissionService } from '../../../services'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

const route = useRoute()
const toast = useToast()

// Use the topic permission composable
const { 
  loading, 
  error,
  formatDate,
  getTopicsCount,
  copyToClipboard,
  fetchPermission,
  deletePermission,
  navigateToPermissionList,
  navigateToPermissionEdit,
  navigateToCreateClient
} = useTopicPermission()

// Data
const permission = ref(null)
const clients = ref([])
const loadingClients = ref(false)
const clientError = ref(null)
const deleteDialog = ref({
  visible: false,
  loading: false
})

// Fetch data on component mount
onMounted(async () => {
  await loadPermission()
})

// Load permission data
const loadPermission = async () => {
  const id = route.params.id
  
  permission.value = await fetchPermission(id)
  
  if (permission.value) {
    // Fetch clients using this role
    await loadClients()
  }
}

// Load clients using this role
const loadClients = async () => {
  if (!permission.value || !permission.value.id) return
  
  loadingClients.value = true
  clientError.value = null
  
  try {
    // Use topicPermissionService directly rather than through the composable
    // to ensure we have proper separation of loading states
    const response = await topicPermissionService.getClientsByPermission(permission.value.id)
    clients.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching clients by permission:', error)
    clientError.value = 'Failed to load clients using this role. Please try again.'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load clients using this role',
      life: 3000
    })
  } finally {
    loadingClients.value = false
  }
}

// Confirm delete
const confirmDelete = () => {
  deleteDialog.value.visible = true
}

// Handle permission deletion
const handleDeletePermission = async () => {
  deleteDialog.value.loading = true
  try {
    const success = await deletePermission(permission.value.id, permission.value.name)
    
    if (success) {
      deleteDialog.value.visible = false
      navigateToPermissionList()
    }
  } finally {
    deleteDialog.value.loading = false
  }
}
</script>
