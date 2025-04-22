<!-- src/views/Entities/Locations/LocationsListView.vue -->
<template>
  <div>
    <PageHeader title="Locations" subtitle="Manage your physical locations">
      <template #actions>
        <Button 
          label="Create Location" 
          icon="pi pi-plus" 
          @click="navigateToLocationCreate()" 
        />
      </template>
    </PageHeader>
    
    <Card>
      <template #content>
        <DataTable
          :items="locations"
          :columns="columns"
          :loading="loading"
          :searchable="true"
          :searchFields="['code', 'name', 'path', 'type', 'expand.edge_id.code', 'expand.parent_id.code']"
          empty-message="No locations found"
          @row-click="(data) => navigateToLocationDetail(data.id)"
          :paginated="true"
          :rows="10"
        >
          <!-- Code column with custom formatting -->
          <template #code-body="{ data }">
            <div :class="['font-medium font-mono', themeValue.class('text-primary-700', 'text-primary-400')]">{{ data.code }}</div>
          </template>
          
          <!-- Path column with hierarchical display -->
          <template #path-body="{ data }">
            <div class="flex items-center">
              <span v-for="(segment, index) in parseLocationPath(data.path)" :key="index" class="flex items-center">
                <span v-if="index > 0" :class="['mx-1', textColor.muted]">/</span>
                <span :class="textColor.secondary">{{ segment }}</span>
              </span>
            </div>
          </template>
          
          <!-- Type column with badge -->
          <template #type-body="{ data }">
            <span 
              class="badge"
              :class="getTypeClass(data.type)"
            >
              {{ getTypeName(data.type) }}
            </span>
          </template>
          
          <!-- Parent column with link -->
          <template #parent_id-body="{ data }">
            <router-link 
              v-if="data.expand && data.expand.parent_id"
              :to="{ name: 'location-detail', params: { id: data.parent_id } }"
              :class="themeValue.class('text-primary-600', 'text-primary-400') + ' hover:underline flex items-center'"
              @click.stop
            >
              {{ data.expand.parent_id.code }}
            </router-link>
            <span v-else :class="textColor.secondary">-</span>
          </template>
          
          <!-- Edge column with code -->
          <template #edge_id-body="{ data }">
            <router-link 
              v-if="data.expand && data.expand.edge_id"
              :to="{ name: 'edge-detail', params: { id: data.edge_id } }"
              :class="themeValue.class('text-primary-600', 'text-primary-400') + ' hover:underline flex items-center'"
              @click.stop
            >
              {{ data.expand.edge_id.code }}
            </router-link>
            <span v-else :class="textColor.secondary">Unknown Edge</span>
          </template>
          
          <!-- Row actions -->
          <template #row-actions="{ data }">
            <div class="flex gap-1 justify-center">
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToLocationDetail(data.id)"
                tooltip="View"
                tooltipOptions="{ position: 'top' }"
              />
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-text p-button-sm" 
                @click.stop="navigateToLocationEdit(data.id)"
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
      header="Filter Locations"
      :style="{ width: '30rem' }"
      :modal="true"
      :contentStyle="themeValue.value({}, { 'background-color': 'var(--surface-card)' })"
      class="p-fluid"
    >
      <div class="grid grid-cols-1 gap-4 mt-2">
        <div class="field">
          <label 
            for="filter-type" 
            :class="['font-medium mb-2 block', textColor.primary]"
          >Location Type</label>
          <Dropdown
            id="filter-type"
            v-model="filters.type"
            :options="locationTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Any Type"
            class="w-full"
            :filter="true"
          />
        </div>
        
        <div class="field">
          <label 
            for="filter-edge" 
            :class="['font-medium mb-2 block', textColor.primary]"
          >Edge</label>
          <Dropdown
            id="filter-edge"
            v-model="filters.edge_id"
            :options="edgeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Any Edge"
            class="w-full"
            :filter="true"
          />
        </div>
        
        <div class="field">
          <label 
            for="filter-parent" 
            :class="['font-medium mb-2 block', textColor.primary]"
          >Parent</label>
          <Dropdown
            id="filter-parent"
            v-model="filters.parent_id"
            :options="parentOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Any Parent"
            class="w-full"
            :filter="true"
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLocation } from '../../../composables/useLocation'
import { useDeleteConfirmation } from '../../../composables/useConfirmation'
import { useTheme } from '../../../composables/useTheme'
import { useTypesStore } from '../../../stores/types'
import DataTable from '../../../components/common/DataTable.vue'
import PageHeader from '../../../components/common/PageHeader.vue'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'

const route = useRoute()
const typesStore = useTypesStore()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor } = useTheme()

// Get location functionality from composable
const { 
  locations,
  loading,
  fetchLocations,
  formatDate,
  getTypeName,
  getTypeClass,
  parseLocationPath,
  deleteLocation,
  navigateToLocationCreate,
  navigateToLocationDetail,
  navigateToLocationEdit
} = useLocation()

// Load location types
onMounted(() => {
  typesStore.loadLocationTypes()
})

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
  { field: 'path', header: 'Path', sortable: true },
  { field: 'type', header: 'Type', sortable: true },
  { field: 'parent_id', header: 'Parent', sortable: true },
  { field: 'edge_id', header: 'Edge', sortable: true }
]

// Filter state
const showFilters = ref(false)
const locationTypes = ref([])
const edgeOptions = ref([])
const parentOptions = ref([])
const filters = ref({
  type: null,
  edge_id: null,
  parent_id: null
})

// Fetch locations on component mount
onMounted(async () => {
  // Initialize filters and location types
  await initializeFilters()
  
  // Check if filtering by edge_id from query params
  const params = {}
  if (route.query.edge) {
    params.edge_id = route.query.edge
    filters.value.edge_id = route.query.edge
  }
  
  await fetchLocations(params)
})

// Initialize filters based on available data
const initializeFilters = async () => {
  // Get location types from store
  locationTypes.value = typesStore.locationTypes
  
  // Extract unique edges from locations
  if (locations.value.length > 0) {
    const edges = new Set()
    locations.value.forEach(loc => {
      if (loc.expand?.edge_id) {
        edges.add(JSON.stringify({
          value: loc.edge_id,
          label: `${loc.expand.edge_id.code} (${loc.expand.edge_id.name})`
        }))
      }
    })
    edgeOptions.value = Array.from(edges).map(e => JSON.parse(e))
    
    // Extract unique parents
    const parents = new Set()
    parents.add(JSON.stringify({
      value: 'none',
      label: 'Root Locations (No Parent)'
    }))
    
    locations.value.forEach(loc => {
      if (loc.expand?.parent_id) {
        parents.add(JSON.stringify({
          value: loc.parent_id,
          label: `${loc.expand.parent_id.code} (${loc.expand.parent_id.name})`
        }))
      }
    })
    parentOptions.value = Array.from(parents).map(p => JSON.parse(p))
  }
}

// Filter methods
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const resetFilters = () => {
  filters.value = {
    type: null,
    edge_id: null,
    parent_id: null
  }
}

const applyFilters = async () => {
  showFilters.value = false
  
  // Prepare filter parameters
  const params = {}
  if (filters.value.type) {
    params.type = filters.value.type
  }
  if (filters.value.edge_id) {
    params.edge_id = filters.value.edge_id
  }
  if (filters.value.parent_id === 'none') {
    params.parent_id = ''
  } else if (filters.value.parent_id) {
    params.parent_id = filters.value.parent_id
  }
  
  await fetchLocations(params)
}

// Handle delete button click
const handleDeleteClick = (location) => {
  confirmDelete(location, 'Location')
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.item) return
  
  updateDeleteDialog({ loading: true })
  
  const success = await deleteLocation(
    deleteDialog.value.item.id, 
    deleteDialog.value.item.code
  )
  
  if (success) {
    // Remove the deleted item from the list
    const index = locations.value.findIndex(l => l.id === deleteDialog.value.item.id)
    if (index !== -1) {
      locations.value.splice(index, 1)
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

/* Badge styling */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Table row hover effect */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
  cursor: pointer;
}

/* Fix for dialog in dark mode */
:deep(.p-dialog) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border: 1px solid var(--surface-border);
}

:deep(.p-dialog .p-dialog-header) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-dialog .p-dialog-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-dialog .p-dialog-footer) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-top: 1px solid var(--surface-border);
}

/* Dark mode component fixes */
:deep(.dark .p-inputtext),
:deep(.dark .p-dropdown),
:deep(.dark .p-multiselect) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-dropdown-panel),
:deep(.dark .p-dropdown-items-wrapper) {
  background-color: var(--surface-hover);
  color: var(--text-color);
}

:deep(.dark .p-dropdown-item) {
  color: var(--text-color);
}

:deep(.dark .p-dropdown-item:hover) {
  background-color: var(--primary-400);
  color: var(--primary-color-text);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  :deep(.p-card .p-card-content) {
    padding: 1rem;
  }
}
</style>
