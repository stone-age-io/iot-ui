<!-- src/components/common/DataTable.vue -->
<template>
  <div class="data-table-wrapper">
    <!-- Table Header with Title, Search and Actions -->
    <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 v-if="title" class="text-xl font-semibold text-gray-800 dark:text-gray-200 m-0">{{ title }}</h2>
      
      <div class="flex flex-col sm:flex-row gap-2 sm:items-center ml-auto">
        <!-- Search Input -->
        <span v-if="searchable" class="p-input-icon-left w-full sm:w-auto">
          <i class="pi pi-search" />
          <InputText 
            v-model="filters.global.value" 
            placeholder="Search..." 
            class="p-inputtext-sm w-full"
          />
        </span>
        
        <!-- Table Action Buttons -->
        <slot name="table-actions"></slot>
      </div>
    </div>
    
    <!-- PrimeVue DataTable -->
    <DataTable
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
      @row-click="onRowClick"
      :scrollable="scrollable"
      :scrollHeight="scrollHeight"
      :rowHover="true"
      stripedRows
      v-model:selection="selectedItems"
      :selectionMode="selectionMode"
      class="p-datatable-sm datatable-responsive"
      filterDisplay="menu"
      responsiveLayout="stack"
      breakpoint="960px"
      tableClass="custom-datatable"
      dataKey="id"
    >
      <!-- Selection Column -->
      <Column selectionMode="multiple" v-if="selectionMode === 'multiple'" headerStyle="width: 3rem" />
      
      <!-- Dynamic Columns -->
      <Column 
        v-for="col in columns" 
        :key="col.field" 
        :field="col.field" 
        :header="col.header"
        :sortable="col.sortable !== false"
        :style="col.style || null"
        :headerStyle="col.headerStyle || null"
      >
        <template #body="slotProps">
          <slot :name="`${col.field}-body`" :data="slotProps.data" :field="col.field">
            {{ formatCellValue(slotProps.data, col.field, col.format) }}
          </slot>
        </template>
        
        <template #filter v-if="col.filter">
          <slot :name="`${col.field}-filter`" :field="col.field"></slot>
        </template>
      </Column>
      
      <!-- Row Actions Column - Only included when slot is provided -->
      <Column 
        v-if="hasRowActions" 
        header="Actions" 
        headerClass="text-center"
        bodyClass="text-center"
        headerStyle="width: 8rem; min-width: 8rem"
        style="width: 8rem; min-width: 8rem"
        :exportable="false"
      >
        <template #body="slotProps">
          <div @click.stop class="action-buttons">
            <slot name="row-actions" :data="slotProps.data"></slot>
          </div>
        </template>
      </Column>
      
      <!-- Empty Message -->
      <template #empty>
        <div class="text-center p-4 text-gray-500 dark:text-gray-400">
          {{ emptyMessage || "No records found" }}
        </div>
      </template>
      
      <!-- Loading Message -->
      <template #loading>
        <div class="text-center p-4 text-gray-500 dark:text-gray-400">
          Loading data...
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, useSlots } from 'vue'
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

// Get slot information
const slots = useSlots()
const hasRowActions = computed(() => !!slots['row-actions'])

// Reactive state
const selectedItems = ref([])
const sortField = ref(props.defaultSortField)
const sortOrder = ref(props.defaultSortOrder)
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

// Format cell value based on format function or type
const formatCellValue = (data, field, format) => {
  // Handle nested paths like 'expand.location_id.code'
  const value = field.split('.').reduce((obj, key) => obj?.[key], data)
  
  if (format) {
    return format(value, data)
  }
  
  return value
}

// Handle row click - pass through the data directly
const onRowClick = (event) => {
  // Don't trigger row click when clicking action buttons
  const target = event.originalEvent.target;
  if (target.closest('.action-buttons') || target.closest('[data-no-row-click]')) {
    return;
  }
  
  emit('row-click', event.data)
}

// Pagination and sorting handlers
const onPage = (event) => {
  emit('page', event)
}

const onSort = (event) => {
  emit('sort', event)
}
</script>

<style>
/* Base datatable styles */
.p-datatable {
  width: 100%;
}

.p-datatable-wrapper {
  overflow-x: auto;
}

.p-datatable-table {
  min-width: 100%;
  table-layout: auto;
}

/* Dark mode styles */
.dark .p-datatable {
  background-color: rgb(31, 41, 55); /* bg-gray-800 */
}

.dark .p-datatable .p-datatable-header,
.dark .p-datatable .p-datatable-footer {
  background-color: rgb(31, 41, 55); /* bg-gray-800 */
  color: rgb(229, 231, 235); /* text-gray-200 */
  border-color: rgb(75, 85, 99); /* border-gray-600 */
}

.dark .p-datatable .p-datatable-thead > tr > th {
  background-color: rgb(55, 65, 81); /* bg-gray-700 */
  color: rgb(229, 231, 235); /* text-gray-200 */
  border-color: rgb(75, 85, 99); /* border-gray-600 */
}

.dark .p-datatable .p-datatable-tbody > tr {
  background-color: rgb(31, 41, 55); /* bg-gray-800 */
  color: rgb(229, 231, 235); /* text-gray-200 */
  border-color: rgb(75, 85, 99); /* border-gray-600 */
}

.dark .p-datatable .p-datatable-tbody > tr > td {
  border-color: rgb(75, 85, 99); /* border-gray-600 */
  color: rgb(209, 213, 219); /* text-gray-300 */
}

/* Stack layout CRITICAL fixes */
/* Fix for stack view (responsive mobile layout) */
.p-datatable.datatable-responsive .p-datatable-tbody > tr.p-datatable-row > td .p-column-title {
  display: none !important;
}

/* Only show column titles in stack view */
@media screen and (max-width: 960px) {
  .p-datatable.datatable-responsive .p-datatable-thead {
    /* Keep the header visible in all modes */
    display: table-header-group !important;
  }
  
  .p-datatable.datatable-responsive .p-datatable-tbody > tr {
    /* Use flexbox for rows in stack mode */
    display: flex !important;
    flex-wrap: wrap !important;
    border: 1px solid #dee2e6;
    margin-bottom: 1rem;
    border-radius: 0.25rem;
  }
  
  .dark .p-datatable.datatable-responsive .p-datatable-tbody > tr {
    border-color: rgb(75, 85, 99); /* border-gray-600 */
  }
  
  .p-datatable.datatable-responsive .p-datatable-tbody > tr > td {
    /* Style of each cell in stack mode */
    width: 100% !important;
    display: flex !important;
    align-items: center;
    border-width: 0;
    border-bottom-width: 1px;
    padding: 0.75rem 1rem;
  }
  
  .p-datatable.datatable-responsive .p-datatable-tbody > tr > td:last-child {
    border-bottom-width: 0;
  }
  
  .p-datatable.datatable-responsive .p-datatable-tbody > tr > td[data-pc-section="bodycell"]:last-child {
    justify-content: center;
    padding: 0.75rem;
  }
}

/* Badge styling in dark mode */
.dark .bg-blue-100.text-blue-800,
.dark .bg-blue-900\/30.text-blue-300 {
  background-color: rgba(37, 99, 235, 0.2);
  color: rgb(147, 197, 253);
}

.dark .bg-green-100.text-green-800,
.dark .bg-green-900\/30.text-green-300 {
  background-color: rgba(22, 163, 74, 0.2);
  color: rgb(134, 239, 172);
}

.dark .bg-amber-100.text-amber-800,
.dark .bg-amber-900\/30.text-amber-300 {
  background-color: rgba(217, 119, 6, 0.2);
  color: rgb(252, 211, 77);
}

.dark .bg-purple-100.text-purple-800,
.dark .bg-purple-900\/30.text-purple-300 {
  background-color: rgba(126, 34, 206, 0.2);
  color: rgb(216, 180, 254);
}

.dark .bg-red-100.text-red-800,
.dark .bg-red-900\/30.text-red-300 {
  background-color: rgba(220, 38, 38, 0.2);
  color: rgb(252, 165, 165);
}

.dark .bg-gray-100.text-gray-800,
.dark .bg-gray-700.text-gray-300 {
  background-color: rgba(75, 85, 99, 0.2);
  color: rgb(209, 213, 219);
}

/* Paginator styling */
.dark .p-paginator {
  background-color: rgb(31, 41, 55); /* bg-gray-800 */
  color: rgb(229, 231, 235); /* text-gray-200 */
  border-color: rgb(75, 85, 99); /* border-gray-600 */
}

.dark .p-paginator .p-paginator-page {
  color: rgb(209, 213, 219); /* text-gray-300 */
}

.dark .p-paginator .p-paginator-page:hover {
  background-color: rgb(55, 65, 81); /* bg-gray-700 */
}

.dark .p-paginator .p-paginator-page.p-highlight {
  background-color: rgb(59, 130, 246); /* bg-blue-600 */
  color: white;
}

/* Fix for form elements in datatable */
.dark .p-inputtext {
  background-color: rgb(55, 65, 81); /* bg-gray-700 */
  color: rgb(229, 231, 235); /* text-gray-200 */
  border-color: rgb(75, 85, 99); /* border-gray-600 */
}

/* Make icons more visible in dark mode */
.dark .pi {
  color: rgb(209, 213, 219); /* text-gray-300 */
}

/* Fix for action buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.dark .p-button.p-button-text {
  color: rgb(209, 213, 219); /* text-gray-300 */
}

.dark .p-button.p-button-text:hover {
  background-color: rgb(55, 65, 81); /* bg-gray-700 */
}

.dark .p-button.p-button-danger.p-button-text {
  color: rgb(248, 113, 113); /* text-red-400 */
}

.dark .p-button.p-button-danger.p-button-text:hover {
  background-color: rgba(220, 38, 38, 0.16); /* bg-red-600/16 */
}
</style>
