<template>
  <div>
    <PageHeader title="Things" subtitle="Manage your IoT devices and things">
      <template #actions>
        <Button 
          label="Create Thing" 
          icon="pi pi-plus" 
          @click="navigateToThingCreate(routeQuery)" 
        />
      </template>
    </PageHeader>
    
    <Card>
      <template #content>
        <DataTable
          :items="things"
          :columns="columns"
          :loading="loading"
          :searchable="true"
          :searchFields="['thing_code', 'name', 'thing_type', 'expand.location_id.code', 'expand.edge_id.code']"
          empty-message="No things found"
          @row-click="(data) => navigateToThingDetail(data.id)"
          :paginated="true"
          :rows="10"
          :rowsPerPageOptions="[5, 10, 25, 50]"
        >
          <!-- Code column with custom formatting -->
          <template #thing_code-body="{ data }">
            <div :class="['font-medium font-mono', themeValue.class('text-primary-700', 'text-primary-400')]">{{ data.thing_code }}</div>
          </template>
          
          <!-- Type column with badge -->
          <template #thing_type-body="{ data }">
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium inline-block"
              :class="getTypeClass(data.thing_type)"
            >
              {{ getTypeName(data.thing_type) }}
            </span>
          </template>
          
          <!-- Location column with code -->
          <template #location_id-body="{ data }">
            <router-link 
              v-if="data.expand && data.expand.location_id"
              :to="{ name: 'location-detail', params: { id: data.location_id } }"
              :class="['hover:underline flex items-center', themeValue.class('text-primary-600', 'text-primary-400')]"
              @click.stop
            >
              {{ data.expand.location_id.code }}
            </router-link>
            <span v-else :class="textColor.secondary">Unknown Location</span>
          </template>
          
          <!-- Edge column with code -->
          <template #edge_id-body="{ data }">
            <router-link 
              v-if="data.expand && data.expand.edge_id"
              :to="{ name: 'edge-detail', params: { id: data.edge_id } }"
              :class="['hover:underline flex items-center', themeValue.class('text-primary-600', 'text-primary-400')]"
              @click.stop
            >
              {{ data.expand.edge_id.code }}
            </router-link>
            <span v-else :class="textColor.secondary">Unknown Edge</span>
          </template>
          
          <!-- Status column with badge -->
          <template #active-body="{ data }">
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium inline-block"
              :class="data.active ? 
                themeValue.class('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300') : 
                themeValue.class('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')"
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
                @click.stop="navigateToThingDetail(data.id)"
                tooltip="View"
                tooltipOptions="{ position: 'top' }"
              />
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToThingEdit(data.id)"
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
      header="Filter Things"
      :style="{ width: '30rem' }"
      :modal="true"
      class="p-fluid"
    >
      <div class="grid grid-cols-1 gap-4 mt-2">
        <div class="field">
          <label 
            for="filter-type" 
            :class="['font-medium mb-2 block', textColor.primary]"
          >Thing Type</label>
          <Dropdown
            id="filter-type"
            v-model="filters.thing_type"
            :options="thingTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Any Type"
            class="w-full"
            :filter="true"
          />
        </div>
        
        <div class="field">
          <label 
            for="filter-location" 
            :class="['font-medium mb-2 block', textColor.primary]"
          >Location</label>
          <Dropdown
            id="filter-location"
            v-model="filters.location_id"
            :options="locations"
            optionLabel="name"
            optionValue="id"
            placeholder="Any Location"
            class="w-full"
            :filter="true"
            :loading="locationsLoading"
          />
        </div>
        
        <div class="field">
          <label 
            for="filter-status" 
            :class="['font-medium mb-2 block', textColor.primary]"
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
import { useRoute } from 'vue-router'
import { useThing } from '../../../composables/useThing'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTheme } from '../../../composables/useTheme'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'

const route = useRoute()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor } = useTheme()

// Get thing functionality from composable
const { 
  things,
  loading,
  fetchThings,
  formatDate,
  getTypeName,
  getTypeClass,
  deleteThing,
  navigateToThingCreate,
  navigateToThingDetail,
  navigateToThingEdit
} = useThing()

// Get delete confirmation functionality
const { 
  deleteDialog,
  confirmDelete,
  updateDeleteDialog,
  resetDeleteDialog 
} = useDeleteConfirmation()

// Table columns definition - updated to use correct field names
const columns = [
  { field: 'thing_code', header: 'Code', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'thing_type', header: 'Type', sortable: true },
  { field: 'location_id', header: 'Location', sortable: true },
  { field: 'edge_id', header: 'Edge', sortable: true },
  { field: 'active', header: 'Status', sortable: true }
]

// Filter state
const showFilters = ref(false)
const filters = ref({
  thing_type: null,
  location_id: null,
  active: null
})

// Status filter options
const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
]

// Location options for filter
const locations = ref([])
const locationsLoading = ref(false)

// Computed route query for filtering
const routeQuery = computed(() => {
  const query = {}
  if (route.query.edge) query.edge_id = route.query.edge
  if (route.query.location) query.location_id = route.query.location
  return query
})

// Computed to check if filters are active
const isFilterActive = computed(() => {
  return filters.value.thing_type || 
         filters.value.location_id || 
         filters.value.active !== null
})

// Filter methods
const toggleFilters = () => {
  showFilters.value = !showFilters.value
  
  // Load locations for filters if needed
  if (showFilters.value && locations.value.length === 0) {
    fetchFilterLocations()
  }
}

const resetFilters = () => {
  filters.value = {
    thing_type: null,
    location_id: null,
    active: null
  }
}

const applyFilters = async () => {
  showFilters.value = false
  await fetchThings(filters.value)
}

// Load locations for filter dropdown
const fetchFilterLocations = async () => {
  locationsLoading.value = true
  try {
    const { locationService } = await import('../../../services')
    const response = await locationService.getList({ perPage: 100 })
    locations.value = response.data.items || []
  } catch (err) {
    console.error('Error fetching locations for filter:', err)
  } finally {
    locationsLoading.value = false
  }
}

// Refresh data with current filters
const refreshData = async () => {
  await fetchThings(isFilterActive.value ? filters.value : routeQuery.value)
}

// Handle create button click
const handleCreateClick = () => {
  navigateToThingCreate(routeQuery.value)
}

// Handle filter button click
const handleFilterClick = () => {
  toggleFilters()
}

// Handle delete button click
const handleDeleteClick = (thing) => {
  confirmDelete(thing, 'Thing', 'thing_code')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.item) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteThing(
    deleteDialog.value.item.id, 
    deleteDialog.value.item.thing_code
  )
  
  if (success) {
    // Remove the deleted item from the list
    const index = things.value.findIndex(t => t.id === deleteDialog.value.item.id)
    if (index !== -1) {
      things.value.splice(index, 1)
    }
    resetDeleteDialog()
  } else {
    updateDeleteDialog({ loading: false })
  }
}

// Fetch things and filter data on component mount
onMounted(async () => {
  await fetchThings(routeQuery.value)
})
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

/* Dialog styling for dark mode */
:deep(.dark .p-dialog) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.dark .p-dialog-header) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-bottom-color: var(--surface-border);
}

:deep(.dark .p-dialog-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.dark .p-dialog-footer) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-top-color: var(--surface-border);
}

/* Basic DataTable styling */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
  cursor: pointer;
}

:deep(.dark .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
}

/* Fix dropdown styling in dark mode */
:deep(.dark .p-dropdown) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-dropdown-panel) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-dropdown-items-wrapper) {
  background-color: var(--surface-hover);
}

:deep(.dark .p-dropdown-item) {
  color: var(--text-color);
}

:deep(.dark .p-dropdown-item:hover) {
  background-color: var(--primary-900/20);
}
</style>
