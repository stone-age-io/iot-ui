<!-- src/views/Messaging/Clients/ClientListView.vue -->
<template>
  <div>
    <PageHeader title="Messaging Clients" subtitle="Manage NATS authentication clients">
      <template #actions>
        <Button 
          label="Create Client" 
          icon="pi pi-plus" 
          @click="navigateToClientCreate"
        />
      </template>
    </PageHeader>
    
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
      <div class="p-6">
        <DataTable
          :items="clients"
          :columns="columns"
          :loading="loading"
          :searchable="true"
          :searchFields="['username', 'expand.role_id.name']"
          empty-message="No clients found"
          @row-click="(data) => navigateToClientDetail(data.id)"
          :paginated="true"
          :rows="10"
          :rowsPerPageOptions="[5, 10, 25, 50]"
        >
          <!-- Username column with custom formatting -->
          <template #username-body="{ data }">
            <div class="font-medium font-mono text-primary-700 dark:text-primary-400">
              {{ data.username }}
            </div>
          </template>
          
          <!-- Role column with reference -->
          <template #role_id-body="{ data }">
            <div v-if="data.expand && data.expand.role_id">
              <router-link 
                :to="{ name: 'topic-permission-detail', params: { id: data.role_id } }"
                class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
                @click.stop
              >
                {{ data.expand.role_id.name }}
              </router-link>
            </div>
            <span v-else class="text-content-secondary dark:text-content-secondary-dark">No role assigned</span>
          </template>
          
          <!-- Status column with badge -->
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
          
          <!-- Actions column -->
          <template #row-actions="{ data }">
            <div class="flex gap-1 justify-center">
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToClientDetail(data.id)"
                tooltip="View"
                tooltipOptions="{ position: 'top' }"
              />
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToClientEdit(data.id)"
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
      title="Delete Client"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete client '${deleteDialog.item?.username || ''}'?`"
      details="This action cannot be undone."
      @confirm="handleDeleteClient"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useClient } from '../../../composables/useClient'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Use the client composable
const { 
  clients,
  loading,
  fetchClients,
  formatDate,
  deleteClient,
  navigateToClientCreate,
  navigateToClientDetail,
  navigateToClientEdit
} = useClient()

// Table columns definition
const columns = [
  { field: 'username', header: 'Username', sortable: true },
  { field: 'role_id', header: 'Role', sortable: true },
  { field: 'active', header: 'Status', sortable: true }
]

// Delete confirmation dialog
const deleteDialog = ref({
  visible: false,
  loading: false,
  item: null
})

// Fetch clients on component mount
onMounted(async () => {
  await fetchClients()
})

// Delete confirmation
const confirmDelete = (data) => {
  deleteDialog.value.item = data
  deleteDialog.value.visible = true
}

// Delete client
const handleDeleteClient = async () => {
  if (!deleteDialog.value.item) return
  
  deleteDialog.value.loading = true
  try {
    const success = await deleteClient(
      deleteDialog.value.item.id, 
      deleteDialog.value.item.username
    )
    
    if (success) {
      // Remove the deleted item from the list without refetching
      clients.value = clients.value.filter(
        item => item.id !== deleteDialog.value.item.id
      )
      deleteDialog.value.visible = false
    }
  } finally {
    deleteDialog.value.loading = false
  }
}
</script>

<style scoped>
/* Basic DataTable styling */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
  cursor: pointer;
}

/* Fix for dark mode table */
:deep(.dark .p-datatable .p-datatable-thead > tr > th) {
  background-color: var(--surface-ground);
  color: var(--text-color-secondary);
  border-color: var(--surface-border);
}

:deep(.dark .p-datatable .p-datatable-tbody > tr) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-datatable .p-datatable-tbody > tr > td) {
  border-color: var(--surface-border);
}

:deep(.dark .p-datatable .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
}
</style>
