<template>
  <div>
    <PageHeader title="Topic Permissions" subtitle="Manage MQTT topic access control">
      <template #actions>
        <Button 
          label="Create Permission" 
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
        :searchFields="['name', 'topic_pattern', 'client.username']"
        title="Topic Permissions"
        empty-message="No permissions found"
        @row-click="navigateToDetail"
      >
        <!-- Name column with custom formatting -->
        <template #name-body="{ data }">
          <div class="font-medium text-primary-700">{{ data.name }}</div>
        </template>
        
        <!-- Topic Pattern column with monospace -->
        <template #topic_pattern-body="{ data }">
          <div class="font-mono">{{ data.topic_pattern }}</div>
        </template>
        
        <!-- Client column with reference -->
        <template #client_id-body="{ data }">
          <router-link 
            v-if="data.client && data.client.id"
            :to="{ name: 'client-detail', params: { id: data.client.id } }"
            class="text-primary-600 hover:underline flex items-center"
            @click.stop
          >
            {{ data.client.username }}
          </router-link>
          <span v-else class="text-gray-500">{{ data.client_id }}</span>
        </template>
        
        <!-- Pattern Type column with badge -->
        <template #pattern_type-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getPatternTypeClass(data.pattern_type)"
          >
            {{ formatPatternType(data.pattern_type) }}
          </span>
        </template>
        
        <!-- Permission Type column with badge -->
        <template #permission_type-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getPermissionTypeClass(data.permission_type)"
          >
            {{ formatPermissionType(data.permission_type) }}
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
      title="Delete Permission"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete permission '${deleteDialog.item?.name || ''}'?`"
      details="This action cannot be undone."
      @confirm="deletePermission"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { 
  topicPermissionService, 
  formatPermissionType, 
  formatPatternType 
} from '../../../services/topicPermission'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Data
const permissions = ref([])
const loading = ref(false)
const deleteDialog = ref({
  visible: false,
  loading: false,
  item: null
})

// Table columns definition
const columns = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'topic_pattern', header: 'Topic Pattern', sortable: true },
  { field: 'pattern_type', header: 'Pattern Type', sortable: true },
  { field: 'permission_type', header: 'Permission', sortable: true },
  { field: 'client_id', header: 'Client', sortable: true },
]

// Fetch permissions on component mount
onMounted(async () => {
  await fetchPermissions()
})

// Methods
const fetchPermissions = async () => {
  loading.value = true
  try {
    // Check if filtering by client_id from query params
    const params = {}
    if (route.query.client) {
      params.client_id = route.query.client
    }
    
    const response = await topicPermissionService.getTopicPermissions(params)
    permissions.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching permissions:', error)
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
  // Pass client_id as a query parameter if it was in the original request
  const query = route.query.client ? { client_id: route.query.client } : {}
  router.push({ name: 'create-topic-permission', query })
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
      detail: `Permission ${deleteDialog.value.item.name} has been deleted`,
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

// Helper methods for formatting
const getPermissionTypeClass = (permissionType) => {
  switch (permissionType) {
    case 'read': return 'bg-green-100 text-green-800'
    case 'write': return 'bg-blue-100 text-blue-800'
    case 'readwrite': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getPatternTypeClass = (patternType) => {
  switch (patternType) {
    case 'exact': return 'bg-blue-100 text-blue-800'
    case 'prefix': return 'bg-yellow-100 text-yellow-800'
    case 'pattern': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
