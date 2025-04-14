<!-- src/views/Messaging/TopicPermissions/TopicPermissionDetailView.vue -->
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
    <div v-else-if="error" :class="['p-error-container p-6 text-center', backgroundColor.surface, borderColor.default]">
      <div :class="['text-xl mb-4', textColor.error]">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load permission details
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Permission Details -->
    <div v-else-if="permission">
      <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div :class="['text-sm mb-1', textColor.secondary]">Permission Role</div>
          <h1 :class="['text-2xl font-bold mb-1', textColor.primary]">{{ permission.name }}</h1>
          <div :class="textColor.secondary">
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
        <Card class="lg:col-span-2">
          <template #title>
            <h2 :class="['text-xl font-semibold', textColor.primary]">Permission Topics</h2>
          </template>
          <template #content>
            <TabView>
              <!-- Publish Topics Tab -->
              <TabPanel header="Publish Permissions">
                <div class="p-2">
                  <p :class="['mb-4', textColor.secondary]">
                    Topics this role can publish to:
                  </p>
                  
                  <div v-if="permission.publish_permissions.length > 0">
                    <div :class="[
                      'p-3 rounded-md mb-4 border',
                      themeValue.class('bg-blue-50 border-blue-100', 'bg-blue-900/20 border-blue-800/30')
                    ]">
                      <div :class="[
                        'flex items-center mb-2',
                        themeValue.class('text-blue-800', 'text-blue-300')
                      ]">
                        <i class="pi pi-arrow-up-right mr-2"></i>
                        <span class="font-medium">{{ permission.publish_permissions.length }} Publish Topics</span>
                      </div>
                      <p :class="[
                        'text-sm',
                        themeValue.class('text-blue-600', 'text-blue-300/80')
                      ]">
                        Clients with this role can publish messages to these topics.
                      </p>
                    </div>
                    
                    <div :class="[
                      'border rounded-md overflow-hidden',
                      backgroundColor.surface,
                      borderColor.default
                    ]">
                      <ul :class="['divide-y', borderColor.default]">
                        <li v-for="(topic, index) in permission.publish_permissions" 
                            :key="`pub-${index}`" 
                            :class="['p-3 topic-item', backgroundColor.hover]"
                        >
                          <div class="flex items-center">
                            <span :class="['font-mono flex-grow', textColor.primary]">{{ topic }}</span>
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
                  
                  <div v-else :class="[
                    'p-6 rounded-md text-center',
                    backgroundColor.secondary,
                    textColor.secondary
                  ]">
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
                  <p :class="['mb-4', textColor.secondary]">
                    Topics this role can subscribe to:
                  </p>
                  
                  <div v-if="permission.subscribe_permissions.length > 0">
                    <div :class="[
                      'p-3 rounded-md mb-4 border',
                      themeValue.class('bg-green-50 border-green-100', 'bg-green-900/20 border-green-800/30')
                    ]">
                      <div :class="[
                        'flex items-center mb-2',
                        themeValue.class('text-green-800', 'text-green-300')
                      ]">
                        <i class="pi pi-arrow-down-right mr-2"></i>
                        <span class="font-medium">{{ permission.subscribe_permissions.length }} Subscribe Topics</span>
                      </div>
                      <p :class="[
                        'text-sm',
                        themeValue.class('text-green-600', 'text-green-300/80')
                      ]">
                        Clients with this role can subscribe to receive messages from these topics.
                      </p>
                    </div>
                    
                    <div :class="[
                      'border rounded-md overflow-hidden',
                      backgroundColor.surface,
                      borderColor.default
                    ]">
                      <ul :class="['divide-y', borderColor.default]">
                        <li v-for="(topic, index) in permission.subscribe_permissions" 
                            :key="`sub-${index}`" 
                            :class="['p-3 topic-item', backgroundColor.hover]"
                        >
                          <div class="flex items-center">
                            <span :class="['font-mono flex-grow', textColor.primary]">{{ topic }}</span>
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
                  
                  <div v-else :class="[
                    'p-6 rounded-md text-center',
                    backgroundColor.secondary,
                    textColor.secondary
                  ]">
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
          </template>
        </Card>
        
        <!-- Clients Using Card -->
        <Card>
          <template #title>
            <h2 :class="['text-xl font-semibold', textColor.primary]">Clients Using This Role</h2>
          </template>
          <template #content>
            <div v-if="loadingClients" class="flex justify-center items-center py-6">
              <ProgressSpinner :style="{width: '30px', height: '30px'}" :class="themeValue.class('text-primary-500', 'text-primary-400')" />
            </div>
            
            <div v-else-if="clientError" :class="[
              'p-4 rounded-md text-center',
              themeValue.class('bg-red-50', 'bg-red-900/20')
            ]">
              <i :class="['pi pi-exclamation-circle text-2xl mb-2 block', themeValue.class('text-red-500', 'text-red-400')]"></i>
              <p :class="themeValue.class('text-red-600', 'text-red-400')">{{ clientError }}</p>
              <Button
                label="Try Again"
                icon="pi pi-refresh"
                class="p-button-outlined p-button-sm mt-4"
                @click="loadClients"
              />
            </div>
            
            <div v-else-if="clients.length === 0" :class="[
              'p-6 rounded-md text-center',
              backgroundColor.secondary,
              textColor.secondary
            ]">
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
              <p :class="['mb-4', textColor.secondary]">
                {{ clients.length }} {{ clients.length === 1 ? 'client is' : 'clients are' }} using this role:
              </p>
              
              <div :class="[
                'border rounded-md overflow-hidden',
                backgroundColor.surface,
                borderColor.default
              ]">
                <ul :class="['divide-y', borderColor.default]">
                  <li v-for="client in clients" :key="client.id" :class="['p-3 client-item', backgroundColor.hover]">
                    <router-link
                      :to="{ name: 'client-detail', params: { id: client.id } }"
                      :class="['flex items-center justify-between', textColor.primary, themeValue.class('hover:text-primary-600', 'hover:text-primary-400')]"
                    >
                      <div>
                        <span class="font-medium">{{ client.username }}</span>
                        <span 
                          class="ml-2 px-2 py-0.5 text-xs rounded-full"
                          :class="client.active ? 
                            themeValue.class('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300') : 
                            themeValue.class('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')"
                        >
                          {{ client.active ? 'Active' : 'Inactive' }}
                        </span>
                      </div>
                      <i :class="['pi pi-chevron-right', textColor.secondary]"></i>
                    </router-link>
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- Metadata -->
            <div class="mt-6 space-y-4">
              <div>
                <div :class="['text-sm mb-1', textColor.secondary]">Created</div>
                <div :class="textColor.primary">{{ formatDate(permission.created) }}</div>
              </div>
              
              <div>
                <div :class="['text-sm mb-1', textColor.secondary]">Last Updated</div>
                <div :class="textColor.primary">{{ formatDate(permission.updated) }}</div>
              </div>
            </div>
          </template>
        </Card>
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
import { useTheme } from '../../../composables/useTheme'
import { topicPermissionService } from '../../../services'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

const route = useRoute()
const toast = useToast()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor } = useTheme()

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
/* Theme-aware styling */
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
  color: var(--text-color);
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

/* Tab panel fixes */
:deep(.p-tabview-panels) {
  background-color: var(--surface-card);
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

/* List item hover effect */
.topic-item:hover,
.client-item:hover {
  background-color: var(--surface-hover);
}

/* Error container styling */
.p-error-container {
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
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
