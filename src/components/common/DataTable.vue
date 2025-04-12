<!-- src/components/common/DataTable.vue -->
<template>
  <div class="data-table-wrapper">
    <!-- Table Header with Title, Search and Actions -->
    <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 m-0" v-if="title">{{ title }}</h2>
      
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
      class="p-datatable-sm"
      filterDisplay="menu"
      tableStyle="min-width: 50rem"
      responsiveLayout="stack"
      breakpoint="960px"
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
      
      <!-- Row Actions Column - Only included when slot is provided-->
      <Column 
        v-if="hasRowActions" 
        header="Actions" 
        headerClass="text-center"
        bodyClass="text-center"
        headerStyle="width: 8rem; min-width: 8rem"
        style="width: 8rem; min-width: 8rem"
      >
        <template #body="slotProps">
          <slot name="row-actions" :data="slotProps.data"></slot>
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

// Handle row click - pass through the data directly to match original behavior
const onRowClick = (event) => {
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

<style scoped>
/* Make sure DataTable uses full width */
:deep(.p-datatable) {
  width: 100%;
}

:deep(.p-datatable-wrapper) {
  overflow-x: auto;
}

:deep(.p-datatable-table) {
  min-width: 100%;
  table-layout: auto;
}

/* Dark mode styles for PrimeVue DataTable */
:deep(.p-datatable) {
  @apply dark:bg-gray-800;
}

:deep(.p-datatable .p-datatable-header) {
  @apply dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  @apply dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  @apply dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  @apply dark:border-gray-700 dark:text-gray-300;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  @apply dark:bg-gray-700;
}

:deep(.p-paginator) {
  @apply dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
  @apply dark:text-gray-300 dark:hover:bg-gray-700;
}

:deep(.p-paginator .p-paginator-pages .p-highlight) {
  @apply dark:bg-primary-700 dark:text-white;
}

:deep(.p-dropdown-panel) {
  @apply dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700;
}

:deep(.p-inputtext) {
  @apply dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
}

:deep(.p-column-filter-row .p-column-filter-menu-button) {
  @apply dark:text-gray-400;
}

:deep(.p-column-filter-row .p-column-filter-menu-button:hover) {
  @apply dark:bg-gray-700 dark:text-gray-200;
}

:deep(.p-button.p-button-text) {
  @apply dark:text-gray-300 dark:hover:bg-gray-700;
}

:deep(.p-button.p-button-danger.p-button-text) {
  @apply dark:text-red-400 dark:hover:bg-red-900/20;
}

:deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
  @apply dark:bg-primary-900/30 dark:text-primary-200;
}

:deep(.p-datatable .p-datatable-tbody > tr.p-datatable-row-editing) {
  @apply dark:bg-gray-700;
}

/* Enhanced styles for responsive stack layout */
:deep(.p-datatable-responsive-scroll .p-datatable-wrapper) {
  overflow-x: auto;
}

/* Make column headers more distinct */
:deep(.p-datatable-thead > tr > th) {
  @apply bg-gray-50 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-200 text-sm;
}

/* Improve row hover styles */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  @apply bg-gray-50 dark:bg-gray-700;
}

/* Stack view styling */
:deep(.p-datatable[data-pc-section="root"][data-pc-name="datatable"][data-pc-section="root"].p-datatable-responsive-stack .p-datatable-tbody > tr > td) {
  @apply py-3 border-b dark:border-gray-700;
}

:deep(.p-datatable[data-pc-section="root"][data-pc-name="datatable"][data-pc-section="root"].p-datatable-responsive-stack .p-datatable-tbody > tr > td .p-column-title) {
  @apply font-medium text-gray-700 dark:text-gray-300 mr-2;
}

/* Improve paginator styling */
:deep(.p-paginator) {
  @apply py-3 border-t dark:border-gray-700;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  @apply bg-primary-600 text-white dark:bg-primary-700 dark:text-white;
}

:deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight) {
  @apply bg-primary-600 text-white dark:bg-primary-700 dark:text-white;
}

/* Add some breathing room to the dropdown filter panels */
:deep(.p-column-filter-overlay) {
  @apply p-2 dark:bg-gray-800 dark:border-gray-700;
}

:deep(.p-column-filter-buttonbar) {
  @apply pt-2 border-t dark:border-gray-700;
}

:deep(.p-column-filter-buttonbar .p-button) {
  @apply text-xs;
}

/* Stack view mobile enhancements */
@media screen and (max-width: 960px) {
  :deep(.p-datatable.p-datatable-responsive-stack .p-datatable-thead) {
    display: none !important;
  }
  
  :deep(.p-datatable.p-datatable-responsive-stack .p-datatable-tbody > tr) {
    @apply border border-gray-200 dark:border-gray-700 rounded-lg mb-3 block bg-white dark:bg-gray-800 shadow-sm;
  }
  
  :deep(.p-datatable.p-datatable-responsive-stack .p-datatable-tbody > tr > td) {
    @apply flex py-3 px-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0;
    text-align: left !important;
    display: flex !important;
    width: 100% !important;
    align-items: center;
    justify-content: space-between;
  }
  
  :deep(.p-datatable.p-datatable-responsive-stack .p-datatable-tbody > tr > td:before) {
    content: attr(data-p-column);
    @apply font-medium text-gray-700 dark:text-gray-300 mr-4;
    width: 40%;
    min-width: 10rem;
  }
  
  /* Adjust spacing for action buttons on mobile */
  :deep(.p-datatable.p-datatable-responsive-stack .p-datatable-tbody > tr > td:last-child) {
    @apply border-t border-gray-100 dark:border-gray-700 mt-auto justify-center;
  }
  
  :deep(.p-datatable.p-datatable-responsive-stack .p-datatable-tbody > tr > td:last-child:before) {
    display: none;
  }
}
</style>
