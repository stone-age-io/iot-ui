<!-- src/views/Messaging/TopicPermissions/TopicPermissionDetailView.vue -->
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
        Failed to load permission details
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Permission Details -->
    <div v-else-if="permission">
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Permission Role</div>
          <h1 class="text-2xl font-bold mb-1 text-content-primary dark:text-content-primary-dark">{{ permission.name }}</h1>
          <div class="text-content-secondary dark:text-content-secondary-dark">
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
        <div class="lg:col-span-2">
          <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
            <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Permission Topics</h2>
            </div>
            <div class="p-6">
              <div class="bg-surface-secondary dark:bg-surface-secondary-dark rounded-lg border border-border-primary dark:border-border-primary-dark overflow-hidden theme-transition">
                <TabView>
                  <!-- Publish Topics Tab -->
                  <TabPanel header="Publish Permissions">
                    <div class="p-4 bg-surface-secondary dark:bg-surface-secondary-dark theme-transition">
                      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">
                        Topics this role can publish to:
                      </p>
                      
                      <div v-if="permission.publish_permissions.length > 0">
                        <div class="p-3 rounded-md mb-4 border bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30 theme-transition">
                          <div class="flex items-center mb-2 text-blue-800 dark:text-blue-300">
                            <i class="pi pi-arrow-up-right mr-2"></i>
                            <span class="font-medium">{{ permission.publish_permissions.length }} Publish Topics</span>
                          </div>
                          <p class="text-sm text-blue-600 dark:text-blue-300/80">
                            Clients with this role can publish messages to these topics.
                          </p>
                        </div>
                        
                        <div class="border rounded-md overflow-hidden bg-surface-primary dark:bg-surface-primary-dark border-border-primary dark:border-border-primary-dark theme-transition">
                          <ul class="divide-y divide-border-primary dark:divide-border-primary-dark">
                            <li v-for="(topic, index) in permission.publish_permissions" 
                                :key="`pub-${index}`" 
                                class="p-3 topic-item hover:bg-surface-hover dark:hover:bg-surface-hover-dark"
                            >
                              <div class="flex items-center">
                                <span class="font-mono flex-grow text-content-primary dark:text-content-primary-dark">{{ topic }}</span>
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
                      
                      <div v-else class="p-6 rounded-md text-center bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-secondary dark:text-content-secondary-dark theme-transition">
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
                    <div class="p-4 bg-surface-secondary dark:bg-surface-secondary-dark theme-transition">
                      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">
                        Topics this role can subscribe to:
                      </p>
                      
                      <div v-if="permission.subscribe_permissions.length > 0">
                        <div class="p-3 rounded-md mb-4 border bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/30 theme-transition">
                          <div class="flex items-center mb-2 text-green-800 dark:text-green-300">
                            <i class="pi pi-arrow-down-right mr-2"></i>
                            <span class="font-medium">{{ permission.subscribe_permissions.length }} Subscribe Topics</span>
                          </div>
                          <p class="text-sm text-green-600 dark:text-green-300/80">
                            Clients with this role can subscribe to receive messages from these topics.
                          </p>
                        </div>
                        
                        <div class="border rounded-md overflow-hidden bg-surface-primary dark:bg-surface-primary-dark border-border-primary dark:border-border-primary-dark theme-transition">
                          <ul class="divide-y divide-border-primary dark:divide-border-primary-dark">
                            <li v-for="(topic, index) in permission.subscribe_permissions" 
                                :key="`sub-${index}`" 
                                class="p-3 topic-item hover:bg-surface-hover dark:hover:bg-surface-hover-dark"
                            >
                              <div class="flex items-center">
                                <span class="font-mono flex-grow text-content-primary dark:text-content-primary-dark">{{ topic }}</span>
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
                      
                      <div v-else class="p-6 rounded-md text-center bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-secondary dark:text-content-secondary-dark theme-transition">
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
            </div>
          </div>
        </div>
        
        <!-- Clients Using Card -->
        <div>
          <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
            <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
              <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Clients Using This Role</h2>
            </div>
            <div class="p-6">
              <div v-if="loadingClients" class="flex justify-center items-center py-6">
                <ProgressSpinner :style="{width: '30px', height: '30px'}" class="text-primary-500 dark:text-primary-400" />
              </div>
              
              <div v-else-if="clientError" class="p-4 rounded-md text-center bg-red-50 dark:bg-red-900/20">
                <i class="pi pi-exclamation-circle text-2xl mb-2 block text-red-500 dark:text-red-400"></i>
                <p class="text-red-600 dark:text-red-400">{{ clientError }}</p>
                <Button
                  label="Try Again"
                  icon="pi pi-refresh"
                  class="p-button-outlined p-button-sm mt-4"
                  @click="loadClients"
                />
              </div>
              
              <div v-else-if="clients.length === 0" class="p-6 rounded-md text-center bg-surface-secondary dark:bg-surface-secondary-dark text-content-secondary dark:text-content-secondary-dark">
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
                <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">
                  {{ clients.length }} {{ clients.length === 1 ? 'client is' : 'clients are' }} using this role:
                </p>
                
                <div class="border rounded-md overflow-hidden bg-surface-primary dark:bg-surface-primary-dark border-border-primary dark:border-border-primary-dark">
                  <ul class="divide-y divide-border-primary dark:divide-border-primary-dark">
                    <li v-for="client in clients" :key="client.id" class="p-3 client-item hover:bg-surface-hover dark:hover:bg-surface-hover-dark">
                      <router-link
                        :to="{ name: 'client-detail', params: { id: client.id } }"
                        class="flex items-center justify-between text-content-primary dark:text-content-primary-dark hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <div>
                          <span class="font-medium">{{ client.username }}</span>
                          <span 
                            class="ml-2 px-2 py-0.5 text-xs rounded-full"
                            :class="client.active ? 
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
                          >
                            {{ client.active ? 'Active' : 'Inactive' }}
                          </span>
                        </div>
                        <i class="pi pi-chevron-right text-content-secondary dark:text-content-secondary-dark"></i>
                      </router-link>
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- Metadata -->
              <div class="mt-6 space-y-4">
                <div>
                  <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Created</div>
                  <div class="text-content-primary dark:text-content-primary-dark">{{ formatDate(permission.created) }}</div>
                </div>
                
                <div>
                  <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Last Updated</div>
                  <div class="text-content-primary dark:text-content-primary-dark">{{ formatDate(permission.updated) }}</div>
                </div>
              </div>
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

<style scoped>
/* List item hover effect */
.topic-item:hover,
.client-item:hover {
  background-color: var(--surface-hover);
}

/* Tab panel fixes */
:deep(.p-tabview-panels) {
  background-color: transparent;
  color: var(--text-color);
}

:deep(.p-tabview-nav) {
  background-color: var(--surface-section);
  border-color: var(--surface-border);
}

:deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.p-tabview-nav li .p-tabview-nav-link) {
  color: var(--text-color-secondary);
}

:deep(.dark .p-tabview-panels) {
  background-color: transparent;
}

:deep(.dark .p-tabview-nav) {
  background-color: var(--surface-secondary-dark);
  border-color: var(--surface-border);
}

:deep(.dark .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  color: var(--primary-400);
  border-color: var(--primary-400);
}

:deep(.dark .p-tabview-nav li .p-tabview-nav-link) {
  color: var(--text-color-secondary);
}

/* Button styling fixes */
:deep(.p-button-text) {
  color: var(--primary-color);
}

:deep(.dark .p-button-text) {
  color: var(--primary-400);
}

:deep(.dark .p-button-text:hover) {
  background: rgba(var(--primary-400), 0.16);
}
</style>
