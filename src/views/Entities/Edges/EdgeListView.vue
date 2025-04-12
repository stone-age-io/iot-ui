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
    
    <div class="card dark:bg-gray-800">
      <DataTable
        :items="edges"
        :columns="columns"
        :loading="loading"
        :searchable="true"
        :searchFields="['code', 'name', 'description', 'type', 'region']"
        title="Edge Installations"
        empty-message="No edges found"
        @row-click="(data) => navigateToEdgeDetail(data.id)"
        :paginated="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25, 50]"
      >
        <!-- Code column with custom formatting -->
        <template #code-body="{ data }">
          <div class="font-medium text-primary-700 dark:text-primary-400">{{ data.code }}</div>
        </template>
        
        <!-- Type column with badge -->
        <template #type-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getTypeClass(data.type)"
          >
            {{ getTypeName(data.type) }}
          </span>
        </template>
        
        <!-- Region column with badge -->
        <template #region-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="getRegionClass(data.region)"
          >
            {{ getRegionName(data.region) }}
          </span>
        </template>
        
        <!-- Status column with badge -->
        <template #active-body="{ data }">
          <span 
            class="px-2 py-1 text-xs rounded-full font-medium"
            :class="data.active ? 
              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
          >
            {{ data.active ? 'Active' : 'Inactive' }}
          </span>
        </template>
        
        <!-- Created date column -->
        <template #created-body="{ data }">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ formatDate(data.created) }}
          </div>
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

        <!-- Table actions slot for adding custom filters -->
        <template #table-actions>
          <div class="flex gap-2">
            <Button 
              label="Refresh" 
              icon="pi pi-refresh" 
              class="p-button-outlined p-button-sm"
              @click="refreshData"
              :loading="loading"
            />
            <Button
              icon="pi pi-filter"
              class="p-button-outlined p-button-sm"
              @click="toggleFilters"
              :class="{'p-button-secondary': isFilterActive}"
            />
          </div>
        </template>
      </DataTable>
    </div>
    
    <!-- Filter Dialog -->
    <Dialog
      v-model:visible="showFilters"
      header="Filter Edges"
      :style="{ width: '30rem' }"
      :modal="true"
      class="p-fluid dark:bg-gray-800"
    >
      <div class="grid grid-cols-1 gap-4 mt-2">
        <div class="field">
          <label for="filter-type" class="font-medium mb-2 block dark:text-gray-300">Edge Type</label>
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
          <label for="filter-region" class="font-medium mb-2 block dark:text-gray-300">Region</label>
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
          <label for="filter-status" class="font-medium mb-2 block dark:text-gray-300">Status</label>
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
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'

const router = useRouter()
const typesStore = useTypesStore()

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

// Table columns definition with width styles to ensure proper column widths
const columns = [
  { field: 'code', header: 'Code', sortable: true, style: 'min-width: 10rem' },
  { field: 'name', header: 'Name', sortable: true, style: 'min-width: 12rem' },
  { field: 'type', header: 'Type', sortable: true, style: 'min-width: 8rem' },
  { field: 'region', header: 'Region', sortable: true, style: 'min-width: 8rem' },
  { field: 'active', header: 'Status', sortable: true, style: 'min-width: 8rem' },
  { field: 'created', header: 'Created', sortable: true, style: 'min-width: 10rem' }
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

<style>
/* Ensure edge type and region badges get proper dark mode styling */
.bg-blue-100.text-blue-800 {
  @apply dark:bg-blue-900/30 dark:text-blue-300;
}

.bg-purple-100.text-purple-800 {
  @apply dark:bg-purple-900/30 dark:text-purple-300;
}

.bg-green-100.text-green-800 {
  @apply dark:bg-green-900/30 dark:text-green-300;
}

.bg-amber-100.text-amber-800 {
  @apply dark:bg-amber-900/30 dark:text-amber-300;
}

.bg-red-100.text-red-800 {
  @apply dark:bg-red-900/30 dark:text-red-300;
}

.bg-gray-100.text-gray-800 {
  @apply dark:bg-gray-700 dark:text-gray-300;
}

/* Style improvements for the filter dialog */
:deep(.p-dialog-header) {
  @apply dark:bg-gray-800 dark:text-white dark:border-gray-700;
}

:deep(.p-dialog-content) {
  @apply dark:bg-gray-800 dark:text-gray-200;
}

:deep(.p-dialog-footer) {
  @apply dark:bg-gray-800 dark:border-gray-700;
}

:deep(.p-dropdown) {
  @apply dark:bg-gray-700 dark:border-gray-600;
}

:deep(.p-dropdown-panel) {
  @apply dark:bg-gray-700 dark:border-gray-600;
}

:deep(.p-dropdown-items) {
  @apply dark:bg-gray-700;
}

:deep(.p-dropdown-item) {
  @apply dark:text-gray-300 dark:hover:bg-gray-600;
}

/* Fix badge displays in stack view on mobile */
@media screen and (max-width: 960px) {
  :deep(.p-datatable.p-datatable-responsive-stack .p-datatable-tbody > tr > td) span[class*="rounded-full"] {
    display: inline-flex !important;
    width: auto !important;
  }
}
</style>
