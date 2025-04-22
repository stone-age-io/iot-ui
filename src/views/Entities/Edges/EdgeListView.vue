<template>
  <div>
    <PageHeader title="Edges" subtitle="Manage your edge installations">
      <template #actions>
        <Button 
          label="Create Edge" 
          icon="pi pi-plus" 
          @click="handleCreateClick" 
        />
      </template>
    </PageHeader>
    
    <Card>
    <template #content>
      <DataTable
        :items="edges"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['code', 'name', 'description', 'type', 'region']"
        empty-message="No edges found"
        @row-click="(data) => navigateToEdgeDetail(data.id)"
        :paginated="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25, 50]"
      >
        <!-- Code column with custom formatting -->
        <template #code-body="{ data }">
          <div class="font-medium text-primary-700 dark:text-primary-400 font-mono">{{ data.code }}</div>
        </template>
        
        <!-- Type column with badge -->
        <template #type-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium inline-block"
            :class="getTypeClass(data.type)"
          >
            {{ getTypeName(data.type) }}
          </span>
        </template>
        
        <!-- Region column with badge -->
        <template #region-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium inline-block"
            :class="getRegionClass(data.region)"
          >
            {{ getRegionName(data.region) }}
          </span>
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
        
        <!-- Row actions -->
        <template #row-actions="{ data }">
          <div class="flex gap-1 justify-center">
            <Button 
              icon="pi pi-eye" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToEdgeDetail(data.id)"
              tooltip="View"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-text p-button-sm" 
              @click.stop="navigateToEdgeEdit(data.id)"
              tooltip="Edit"
              tooltipOptions="{ position: 'top' }"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-rounded p-button-text p-button-sm p-button-danger" 
              @click.stop="handleDeleteClick(data)"
              tooltip="Delete"
              tooltipOptions="{ position: 'top' }"
            />
          </div>
        </template>
      </DataTable>
    </template>
    </Card>
    
    <!-- Filter Dialog -->
    <Dialog
      v-model:visible="showFilters"
      header="Filter Edges"
      :style="{ width: '30rem' }"
      :modal="true"
      class="p-fluid"
    >
      <div class="grid grid-cols-1 gap-4 mt-2">
        <div class="field">
          <label 
            for="filter-type" 
            class="font-medium mb-2 block"
          >Edge Type</label>
          <Dropdown
            id="filter-type"
            v-model="filters.type"
            :options="edgeTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Any Type"
            class="w-full"
            :filter="true"
          />
        </div>
        
        <div class="field">
          <label 
            for="filter-region" 
            class="font-medium mb-2 block"
          >Region</label>
          <Dropdown
            id="filter-region"
            v-model="filters.region"
            :options="edgeRegions"
            optionLabel="label"
            optionValue="value"
            placeholder="Any Region"
            class="w-full"
            :filter="true"
          />
        </div>
        
        <div class="field">
          <label 
            for="filter-status" 
            class="font-medium mb-2 block"
          >Status</label>
          <Dropdown
            id="filter-status"
            v-model="filters.active"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Any Status"
            class="w-full"
          />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Reset" icon="pi pi-undo" @click="resetFilters" class="p-button-text" />
          <Button label="Apply" icon="pi pi-check" @click="applyFilters" />
        </div>
      </template>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEdge } from '../../../composables/useEdge'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTypesStore } from '../../../stores/types'
import { useTheme } from '../../../composables/useTheme'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'

const router = useRouter()
const typesStore = useTypesStore()

// Theme composable for theme-aware styling
const { themeValue } = useTheme()

// Get edge functionality from composable
const { 
  edges,
  loading,
  fetchEdges,
  formatDate,
  getTypeName,
  getRegionName,
  getTypeClass,
  getRegionClass,
  deleteEdge,
  navigateToEdgeDetail,
  navigateToEdgeEdit
} = useEdge()

// Get delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Table columns definition
const columns = [
  { field: 'code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'region', header: 'Region', sortable: true },
  { field: 'active', header: 'Status', sortable: true }
]

// Load types for filters
onMounted(async () => {
  await typesStore.loadEdgeTypes()
  await typesStore.loadEdgeRegions() 
  await fetchEdges()
})

// Status filter options
const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
]

// Filter state
const showFilters = ref(false)
const filters = ref({
  type: null,
  region: null,
  active: null
})

// Computed properties for filter-related data
const edgeTypes = computed(() => {
  return typesStore.edgeTypes
})

const edgeRegions = computed(() => {
  return typesStore.edgeRegions
})

const isFilterActive = computed(() => {
  return filters.value.type || filters.value.region || filters.value.active !== null
})

// Filter methods
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const resetFilters = () => {
  filters.value = {
    type: null,
    region: null,
    active: null
  }
}

const applyFilters = async () => {
  showFilters.value = false
  await fetchEdges(filters.value)
}

const refreshData = async () => {
  await fetchEdges(isFilterActive.value ? filters.value : undefined)
}

// Handle create button click
const handleCreateClick = () => {
  router.push({ name: 'create-edge' })
}

// Handle delete button click
const handleDeleteClick = (edge) => {
  confirmDelete(edge, 'Edge')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.item) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteEdge(
    deleteDialog.value.item.id, 
    deleteDialog.value.item.code
  )
  
  if (success) {
    // Remove the deleted item from the list
    const index = edges.value.findIndex(e => e.id === deleteDialog.value.item.id)
    if (index !== -1) {
      edges.value.splice(index, 1)
    }
    resetDeleteDialog()
  } else {
    updateDeleteDialog({ loading: false })
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

/* Minimal styling, letting the component handle mobile view */
/* Badge styling for consistency */
:deep(.badge) {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Basic DataTable styling */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
  cursor: pointer;
}
</style>
