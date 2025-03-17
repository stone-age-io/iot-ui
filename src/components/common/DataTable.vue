<!-- src/components/common/DataTable.vue -->
<template>
  <div class="data-table-wrapper">
    <!-- Table Header with Title, Search and Actions -->
    <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 class="text-xl font-semibold text-gray-800 m-0" v-if="title">{{ title }}</h2>
      
      <div class="flex flex-col sm:flex-row gap-2 sm:items-center ml-auto">
        <!-- Search Input -->
        <span class="p-input-icon-left w-full sm:w-auto" v-if="searchable">
          <i class="pi pi-search" />
          <InputText 
            v-model="filters.global.value" 
            placeholder="Search..." 
            class="p-inputtext-sm w-full"
          />
        </span>
        
        <!-- Action Button (e.g., Create New) -->
        <slot name="actions"></slot>
      </div>
    </div>
    
    <!-- Mobile Card View -->
    <div v-if="isMobileView" class="space-y-4">
      <div 
        v-for="(item, index) in items" 
        :key="index"
        class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        @click="$emit('row-click', item)"
      >
        <!-- Generate card content based on columns -->
        <div v-for="col in visibleColumns" :key="col.field" class="mb-2">
          <div class="flex justify-between items-start">
            <div class="text-sm text-gray-500">{{ col.header }}</div>
            <div class="text-right">
              <slot :name="`${col.field}-body`" :data="item" :field="col.field">
                {{ formatCellValue(item, col.field, col.format) }}
              </slot>
            </div>
          </div>
        </div>
        
        <!-- Actions Row -->
        <div v-if="$slots.actions" class="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <slot name="actions" :data="item"></slot>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="items.length === 0" class="text-center p-4 text-gray-500 bg-white rounded-lg border border-gray-200">
        {{ emptyMessage || "No records found" }}
      </div>
    </div>
    
    <!-- Desktop DataTable Component -->
    <DataTable
      v-else
      :value="items"
      :paginator="paginated"
      :rows="rows"
      :rowsPerPageOptions="rowsPerPageOptions"
      :loading="loading"
      :filters="filters"
      :globalFilterFields="searchFields"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :sortField="sortField"
      :sortOrder="sortOrder"
      :lazy="lazy"
      :totalRecords="totalRecords"
      @page="onPage"
      @sort="onSort"
      :scrollable="scrollable"
      :scrollHeight="scrollHeight"
      :rowHover="true"
      stripedRows
      v-model:selection="selectedItems"
      :selectionMode="selectionMode"
      class="p-datatable-sm"
      filterDisplay="menu"
      responsiveLayout="stack"
    >
      <!-- Selection Column -->
      <Column selectionMode="multiple" v-if="selectionMode === 'multiple'" headerStyle="width: 3rem" />
      
      <!-- Dynamic Columns -->
      <template v-for="col in columns" :key="col.field">
        <Column
          :field="col.field"
          :header="col.header"
          :sortable="col.sortable !== false"
          :style="col.style"
          :headerStyle="col.headerStyle"
          :bodyStyle="col.bodyStyle"
        >
          <template #body="{ data, field }">
            <slot :name="`${field}-body`" :data="data" :field="field">
              {{ formatCellValue(data, field, col.format) }}
            </slot>
          </template>
          
          <template #filter v-if="col.filter">
            <slot :name="`${col.field}-filter`" :field="col.field"></slot>
          </template>
        </Column>
      </template>
      
      <!-- Actions Column -->
      <Column v-if="$slots.actions" header="Actions" :style="{ width: '8rem' }" headerClass="text-center" bodyClass="text-center">
        <template #body="slotProps">
          <slot name="actions" :data="slotProps.data"></slot>
        </template>
      </Column>
      
      <!-- Empty Message -->
      <template #empty>
        <div class="text-center p-4 text-gray-500">
          {{ emptyMessage || "No records found" }}
        </div>
      </template>
      
      <!-- Loading Message -->
      <template #loading>
        <div class="text-center p-4 text-gray-500">
          Loading data...
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { FilterMatchMode } from 'primevue/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: ''
  },
  paginated: {
    type: Boolean,
    default: true
  },
  rows: {
    type: Number,
    default: 10
  },
  rowsPerPageOptions: {
    type: Array,
    default: () => [5, 10, 20, 50]
  },
  searchable: {
    type: Boolean,
    default: true
  },
  searchFields: {
    type: Array,
    default: () => []
  },
  selectionMode: {
    type: String,
    default: 'none' // none, single, multiple
  },
  scrollable: {
    type: Boolean,
    default: false
  },
  scrollHeight: {
    type: String,
    default: '400px'
  },
  lazy: {
    type: Boolean,
    default: false
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  defaultSortField: {
    type: String,
    default: null
  },
  defaultSortOrder: {
    type: Number,
    default: 1 // 1 for ascending, -1 for descending
  },
  // New props for responsive behavior
  mobileBreakpoint: {
    type: Number,
    default: 768 // Switch to mobile view under 768px
  },
  // Columns to prioritize in mobile view (limit to 3-4 most important)
  mobileColumns: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:selection',
  'page',
  'sort',
  'row-click',
  'row-select',
  'row-unselect'
])

// Reactive state
const selectedItems = ref([])
const sortField = ref(props.defaultSortField)
const sortOrder = ref(props.defaultSortOrder)
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

// Track window width for responsive behavior
const windowWidth = ref(window.innerWidth)
const isMobileView = computed(() => windowWidth.value < props.mobileBreakpoint)

// Determine visible columns for mobile view
const visibleColumns = computed(() => {
  if (props.mobileColumns.length > 0) {
    // Filter columns based on specified mobile columns
    return props.columns.filter(col => props.mobileColumns.includes(col.field))
  }
  
  // Default: take first 3 columns plus any that are marked as 'priority'
  const priorityColumns = props.columns.filter(col => col.priority === true)
  const essentialColumns = props.columns.slice(0, 3)
  
  // Combine and deduplicate
  return [...new Set([...priorityColumns, ...essentialColumns])]
})

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // Initial check
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Watch for selection changes
watch(selectedItems, (newValue) => {
  emit('update:selection', newValue)
})

// Format cell value based on format function or type
const formatCellValue = (data, field, format) => {
  const value = field.split('.').reduce((obj, key) => obj?.[key], data)
  
  if (format) {
    return format(value, data)
  }
  
  return value
}

// Pagination and sorting handlers
const onPage = (event) => {
  emit('page', event)
}

const onSort = (event) => {
  emit('sort', event)
}
</script>
