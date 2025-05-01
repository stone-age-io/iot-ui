<!-- src/views/Messaging/TopicPermissions/TopicPermissionListView.vue -->
<template>
  <div>
    <PageHeader title="Topic Permissions" subtitle="Manage NATS topic access control roles">
      <template #actions>
        <Button 
          label="Create Role" 
          icon="pi pi-plus" 
          @click="navigateToPermissionCreate"
        />
      </template>
    </PageHeader>
    
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
      <div class="p-6">
        <DataTable
          :items="permissions"
          :columns="columns"
          :loading="loading"
          :searchable="true"
          :searchFields="['name']"
          empty-message="No permission roles found"
          @row-click="handleRowClick"
          :paginated="true"
          :rows="10"
          :rowsPerPageOptions="[5, 10, 25, 50]"
        >
          <!-- Name column with custom formatting -->
          <template #name-body="{ data }">
            <div class="font-medium text-primary-700 dark:text-primary-400">{{ data.name }}</div>
          </template>
          
          <!-- Publish Permissions column -->
          <template #publish_permissions-body="{ data }">
            <div class="flex items-center">
              <span 
                class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {{ getTopicCount(data.publish_permissions) }}
              </span>
            </div>
          </template>
          
          <!-- Subscribe Permissions column -->
          <template #subscribe_permissions-body="{ data }">
            <div class="flex items-center">
              <span 
                class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              >
                {{ getTopicCount(data.subscribe_permissions) }}
              </span>
            </div>
          </template>
          
          <!-- Clients Using column -->
          <template #clients_using-body="{ data }">
            <div @click.stop>
              <Button
                icon="pi pi-users"
                class="p-button-text p-button-sm"
                @click="viewClientsUsingRole(data)"
                label="View Clients"
              />
            </div>
          </template>
          
          <!-- Row Actions -->
          <template #row-actions="{ data }">
            <div class="flex gap-1 justify-center">
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToPermissionDetail(data.id)"
                tooltip="View"
                tooltipOptions="{ position: 'top' }"
              />
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToPermissionEdit(data.id)"
                tooltip="Edit"
                tooltipOptions="{ position: 'top' }"
              />
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-text p-button-sm p-button-danger" 
                @click.stop="confirmDelete(data)"
                tooltip="Delete"
                tooltipOptions="{ position: 'top' }"
              />
            </div>
          </template>
        </DataTable>
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
      :message="`Are you sure you want to delete the '${deleteDialog.item?.name || ''}' role?`"
      details="This action cannot be undone. Clients using this permission role will lose their access."
      @confirm="handleDeletePermission"
    />
    
    <!-- Clients Using Role Dialog -->
    <Dialog
      v-model:visible="clientsDialog.visible"
      :header="`Clients Using '${clientsDialog.roleName}' Role`"
      :style="{ width: '80%', maxWidth: '800px' }"
      :modal="true"
    >
      <div class="p-4">
        <div v-if="clientsDialog.loading" class="flex justify-center py-4">
          <ProgressSpinner class="text-primary-500 dark:text-primary-400" />
        </div>
        <div v-else-if="clientsDialog.clients.length === 0" 
            class="py-4 text-center text-content-secondary dark:text-content-secondary-dark">
          No clients are using this role.
        </div>
        <div v-else>
          <div class="overflow-x-auto">
            <DataTable
              :items="clientsDialog.clients"
              :paginator="true"
              :rows="5"
              :columns="clientColumns"
            >
              <!-- Username column with link to client detail -->
              <template #username-body="{ data }">
                <router-link
                  :to="{ name: 'client-detail', params: { id: data.id } }"
                  class="text-primary-600 hover:underline dark:text-primary-400 dark:hover:underline"
                  @click="clientsDialog.visible = false"
                >
                  {{ data.username }}
                </router-link>
              </template>
              
              <!-- Status column with styled badge -->
              <template #active-body="{ data }">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="data.active ? 
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
                >
                  {{ data.active ? 'Active' : 'Inactive' }}
                </span>
              </template>
            </DataTable>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button
          label="Close"
          @click="clientsDialog.visible = false"
        />
      </template>
    </Dialog>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTopicPermission } from '../../../composables/useTopicPermission'
import { topicPermissionService } from '../../../services'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

// Use the topic permission composable
const { 
  permissions,
  loading,
  error,
  getTopicCount,
  getTopicSample,
  fetchPermissions,
  fetchClientsByPermission,
  deletePermission,
  navigateToPermissionCreate,
  navigateToPermissionDetail,
  navigateToPermissionEdit
} = useTopicPermission()

// Delete dialog state
const deleteDialog = ref({
  visible: false,
  loading: false,
  item: null
})

// Clients dialog state
const clientsDialog = ref({
  visible: false,
  loading: false,
  roleName: '',
  roleId: null,
  clients: []
})

// Columns definition for the clients table in the dialog
const clientColumns = [
  { field: 'username', header: 'Username', sortable: true },
  { field: 'active', header: 'Status', sortable: true }
]

// Table columns definition
const columns = [
  { field: 'name', header: 'Role Name', sortable: true },
  { field: 'publish_permissions', header: 'Publish Permissions', sortable: false },
  { field: 'subscribe_permissions', header: 'Subscribe Permissions', sortable: false },
  { field: 'clients_using', header: 'Clients', sortable: false }
]

// Fetch permissions on component mount
onMounted(async () => {
  await fetchPermissions()
})

// Handle row click
const handleRowClick = (data) => {
  navigateToPermissionDetail(data.id)
}

// Confirm delete 
const confirmDelete = (data) => {
  deleteDialog.value.item = data
  deleteDialog.value.visible = true
}

// Handle permission deletion
const handleDeletePermission = async () => {
  if (!deleteDialog.value.item) return
  
  deleteDialog.value.loading = true
  try {
    const success = await deletePermission(
      deleteDialog.value.item.id, 
      deleteDialog.value.item.name
    )
    
    if (success) {
      // Remove the deleted item from the list without refetching
      permissions.value = permissions.value.filter(item => item.id !== deleteDialog.value.item.id)
      deleteDialog.value.visible = false
    }
  } finally {
    deleteDialog.value.loading = false
  }
}

// View clients using a role
const viewClientsUsingRole = async (role) => {
  // Prevent event bubbling to parent row click
  event?.stopPropagation?.()
  
  clientsDialog.value.visible = true
  clientsDialog.value.loading = true
  clientsDialog.value.roleName = role.name
  clientsDialog.value.roleId = role.id
  clientsDialog.value.clients = []
  
  try {
    const response = await topicPermissionService.getClientsByPermission(role.id)
    clientsDialog.value.clients = response.data.items || []
  } catch (error) {
    console.error('Error fetching clients:', error)
  } finally {
    clientsDialog.value.loading = false
  }
}
</script>

<style scoped>
/* Basic DataTable styling */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
  cursor: pointer;
}

/* Fix dialog styling in dark mode */
:deep(.p-dialog) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-dialog .p-dialog-header) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.p-dialog .p-dialog-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-dialog .p-dialog-footer) {
  background-color: var(--surface-card);
  border-color: var(--surface-border);
}

/* Dark mode specific overrides */
:deep(.dark .p-datatable-tbody > tr) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.dark .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
}

:deep(.dark .p-datatable-thead > tr > th) {
  background-color: var(--surface-section);
  color: var(--text-color-secondary);
  border-color: var(--surface-border);
}

:deep(.dark .p-button-text) {
  color: var(--primary-color);
}

:deep(.dark .p-button-text:hover) {
  background: rgba(var(--primary-400-rgb), 0.16);
}
</style>
