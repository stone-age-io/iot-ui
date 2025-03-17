<!-- src/views/Messaging/Clients/ClientListView.vue -->
<template>
  <div>
    <PageHeader title="Messaging Clients" subtitle="Manage access to messaging system">
      <template #actions>
        <Button 
          label="Create Client" 
          icon="pi pi-plus" 
          @click="navigateToCreate"
        />
      </template>
    </PageHeader>
    
    <div class="card">
      <DataTable
        :items="clients"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['username', 'name', 'description', 'client_type']"
        title="Messaging Clients"
        empty-message="No clients found"
        @row-click="navigateToDetail"
      >
        <!-- Username column with custom formatting -->
        <template #username-body="{ data }">
          <div class="font-medium text-primary-700">{{ data.username }}</div>
        </template>
        
        <!-- Client Type column with badge -->
        <template #client_type-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getTypeClass(data.client_type)"
          >
            {{ getTypeName(data.client_type) }}
          </span>
        </template>
        
        <!-- Access Level column with badge -->
        <template #access_level-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getAccessLevelClass(data.access_level)"
          >
            {{ getAccessLevelName(data.access_level) }}
          </span>
        </template>
        
        <!-- Status column with badge -->
        <template #active-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="data.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
          >
            {{ data.active ? 'Active' : 'Inactive' }}
          </span>
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
      title="Delete Client"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete client '${deleteDialog.item?.username || ''}'?`"
      details="This action cannot be undone. All topic permissions associated with this client will be deleted as well."
      @confirm="deleteClient"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { clientService, clientTypes, accessLevels } from '../../../services/client'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()

// Data
const clients = ref([])
const loading = ref(false)
const deleteDialog = ref({
  visible: false,
  loading: false,
  item: null
})

// Table columns definition
const columns = [
  { field: 'username', header: 'Username', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'client_type', header: 'Type', sortable: true },
  { field: 'access_level', header: 'Access Level', sortable: true },
  { field: 'active', header: 'Status', sortable: true },
  { field: 'description', header: 'Description', sortable: false }
]

// Fetch clients on component mount
onMounted(async () => {
  await fetchClients()
})

// Methods
const fetchClients = async () => {
  loading.value = true
  try {
    const response = await clientService.getClients()
    clients.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching clients:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load clients',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const navigateToCreate = () => {
  router.push({ name: 'create-client' })
}

const navigateToDetail = (data) => {
  router.push({ name: 'client-detail', params: { id: data.id } })
}

const navigateToEdit = (data) => {
  router.push({ name: 'edit-client', params: { id: data.id } })
}

const confirmDelete = (data) => {
  deleteDialog.value.item = data
  deleteDialog.value.visible = true
}

const deleteClient = async () => {
  if (!deleteDialog.value.item) return
  
  deleteDialog.value.loading = true
  try {
    await clientService.deleteClient(deleteDialog.value.item.id)
    
    // Remove the deleted item from the list
    clients.value = clients.value.filter(item => item.id !== deleteDialog.value.item.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Client ${deleteDialog.value.item.username} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
  } catch (error) {
    console.error('Error deleting client:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete client',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

// Helper methods for formatting
const getTypeName = (clientType) => {
  const type = clientTypes.find(t => t.value === clientType)
  return type ? type.label : clientType
}

const getAccessLevelName = (accessLevel) => {
  const level = accessLevels.find(l => l.value === accessLevel)
  return level ? level.label : accessLevel
}

const getTypeClass = (clientType) => {
  switch (clientType) {
    case 'device': return 'bg-blue-100 text-blue-800'
    case 'service': return 'bg-purple-100 text-purple-800'
    case 'user': return 'bg-green-100 text-green-800'
    case 'integration': return 'bg-amber-100 text-amber-800'
    case 'system': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getAccessLevelClass = (accessLevel) => {
  switch (accessLevel) {
    case 'read': return 'bg-green-100 text-green-800'
    case 'write': return 'bg-blue-100 text-blue-800'
    case 'readwrite': return 'bg-purple-100 text-purple-800'
    case 'admin': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
