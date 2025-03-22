<!-- src/views/Messaging/TopicPermissions/TopicPermissionListView.vue -->
<template>
  <div>
    <PageHeader title="Topic Permissions" subtitle="Manage NATS topic access control roles">
      <template #actions>
        <Button 
          label="Create Role" 
          icon="pi pi-plus" 
          @click="navigateToCreate"
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable
        :items="permissions"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['name']"
        title="Permission Roles"
        empty-message="No permission roles found"
        @row-click="navigateToDetail"
      >
        <!-- Name column with custom formatting -->
        <template #name-body="{ data }">
          <div class="font-medium text-primary-700">{{ data.name }}</div>
        </template>
        
        <!-- Publish Permissions column -->
        <template #publish_permissions-body="{ data }">
          <div class="flex items-center">
            <span class="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
              {{ getTopicCount(data.publish_permissions) }}
            </span>
            <span v-if="getTopicCount(data.publish_permissions) > 0" class="ml-2 text-sm text-gray-600">
              {{ getTopicSample(data.publish_permissions) }}
            </span>
          </div>
        </template>
        
        <!-- Subscribe Permissions column -->
        <template #subscribe_permissions-body="{ data }">
          <div class="flex items-center">
            <span class="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
              {{ getTopicCount(data.subscribe_permissions) }}
            </span>
            <span v-if="getTopicCount(data.subscribe_permissions) > 0" class="ml-2 text-sm text-gray-600">
              {{ getTopicSample(data.subscribe_permissions) }}
            </span>
          </div>
        </template>
        
        <!-- Clients Using column -->
        <template #clients_using-body="{ data }">
          <!-- FIX: Added div wrapper with event.stopPropagation() to ensure events don't bubble up -->
          <div @click.stop>
            <Button
              icon="pi pi-users"
              class="p-button-text p-button-sm"
              @click="viewClientsUsingRole(data)"
              label="View Clients"
            />
          </div>
        </template>
        
        <!-- Actions column -->
        <template #actions="{ data }">
          <div class="flex gap-1 justify-center">
            <Button 
              icon="pi pi-eye" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToDetail(data)"
              tooltip="View"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToEdit(data)"
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
      @confirm="deletePermission"
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
          <ProgressSpinner />
        </div>
        <div v-else-if="clientsDialog.clients.length === 0" class="py-4 text-center text-gray-500">
          No clients are using this role.
        </div>
        <div v-else>
          <!-- FIX: Using the correct DataTable props - our custom component uses 'items' not 'value' -->
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
                  class="text-primary-600 hover:underline"
                  @click="clientsDialog.visible = false"
                >
                  {{ data.username }}
                </router-link>
              </template>
              
              <!-- Status column with styled badge -->
              <template #active-body="{ data }">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="data.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
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
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { topicPermissionService } from '../../../services/topicPermission'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
// No need to import Column anymore as we're using our custom DataTable
// import Column from 'primevue/column'

const router = useRouter()
const toast = useToast()

// Data
const permissions = ref([])
const loading = ref(false)
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

// Table columns definition - updated to match actual schema
const columns = [
  { field: 'name', header: 'Role Name', sortable: true },
  { field: 'publish_permissions', header: 'Publish Permissions', sortable: false },
  { field: 'subscribe_permissions', header: 'Subscribe Permissions', sortable: false },
  { field: 'clients_using', header: 'Clients', sortable: false },
]

// Fetch permissions on component mount
onMounted(async () => {
  await fetchPermissions()
})

// Methods
const fetchPermissions = async () => {
  loading.value = true
  try {
    const response = await topicPermissionService.getTopicPermissions()
    permissions.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching topic permissions:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load topic permissions',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const navigateToCreate = () => {
  router.push({ name: 'create-topic-permission' })
}

const navigateToDetail = (data) => {
  router.push({ name: 'topic-permission-detail', params: { id: data.id } })
}

const navigateToEdit = (data) => {
  router.push({ name: 'edit-topic-permission', params: { id: data.id } })
}

const confirmDelete = (data) => {
  deleteDialog.value.item = data
  deleteDialog.value.visible = true
}

const deletePermission = async () => {
  if (!deleteDialog.value.item) return
  
  deleteDialog.value.loading = true
  try {
    await topicPermissionService.deleteTopicPermission(deleteDialog.value.item.id)
    
    // Remove the deleted item from the list
    permissions.value = permissions.value.filter(item => item.id !== deleteDialog.value.item.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Permission role '${deleteDialog.value.item.name}' has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
  } catch (error) {
    console.error('Error deleting permission:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete permission',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

// View clients using a role
const viewClientsUsingRole = async (role) => {
  // FIX: Prevent event bubbling to parent row click
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
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load clients using this role',
      life: 3000
    })
  } finally {
    clientsDialog.value.loading = false
  }
}

// Helper methods
const getTopicCount = (topics) => {
  if (!topics) return 0
  return Array.isArray(topics) ? topics.length : 0
}

const getTopicSample = (topics) => {
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return 'No topics'
  }
  
  if (topics.length === 1) {
    return topics[0]
  }
  
  return `${topics[0]} and ${topics.length - 1} more`
}
</script>
