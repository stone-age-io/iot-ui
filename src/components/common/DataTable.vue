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
      class="p-datatable-sm custom-datatable"
      filterDisplay="menu"
      dataKey="id"
      :class="{ 'mobile-view': isMobileView }"
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
          <div class="cell-content">
            <!-- Column Header in Mobile View -->
            <span v-if="isMobileView" class="column-header">{{ col.header }}</span>
            
            <!-- Actual Content -->
            <div class="cell-value">
              <slot :name="`${col.field}-body`" :data="slotProps.data" :field="col.field">
                {{ formatCellValue(slotProps.data, col.field, col.format) }}
              </slot>
            </div>
          </div>
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
          <div class="cell-content actions-cell">
            <!-- Column Header in Mobile View -->
            <span v-if="isMobileView" class="column-header">Actions</span>
            
            <!-- Actions -->
            <div @click.stop class="action-buttons">
              <slot name="row-actions" :data="slotProps.data"></slot>
            </div>
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
import { ref, computed, useSlots, onMounted, onUnmounted } from 'vue'
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
  mobileBreakpoint: {
    type: Number,
    default: 960
  }
});

const emit = defineEmits([
  'update:selection',
  'page',
  'sort',
  'row-click',
  'row-select',
  'row-unselect'
]);

// Get slot information
const slots = useSlots();
const hasRowActions = computed(() => !!slots['row-actions']);

// Reactive state
const selectedItems = ref([]);
const sortField = ref(props.defaultSortField);
const sortOrder = ref(props.defaultSortOrder);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const windowWidth = ref(window.innerWidth);
const isMobileView = computed(() => windowWidth.value < props.mobileBreakpoint);

// Handle window resize for responsive detection
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

/**
 * Format cell value based on format function or type
 * Handles nested paths like 'expand.location_id.code'
 */
const formatCellValue = (data, field, format) => {
  if (!data || !field) return '';
  
  // Handle nested paths
  const value = field.split('.').reduce((obj, key) => {
    return obj && obj[key] !== undefined ? obj[key] : undefined;
  }, data);
  
  if (value === undefined) return '';
  
  if (format && typeof format === 'function') {
    return format(value, data);
  }
  
  return value;
};

/**
 * Handle row click but ignore clicks on action buttons
 */
const onRowClick = (event) => {
  // Don't trigger row click when clicking action buttons
  const target = event.originalEvent.target;
  if (target.closest('.action-buttons') || target.closest('[data-no-row-click]')) {
    return;
  }
  
  emit('row-click', event.data);
};

// Pagination and sorting handlers
const onPage = (event) => {
  emit('page', event);
};

const onSort = (event) => {
  emit('sort', event);
};
</script>

<style>
/* Base datatable styles */
.custom-datatable {
  @apply w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.custom-datatable .p-datatable-wrapper {
  @apply overflow-x-auto;
}

.custom-datatable .p-datatable-table {
  @apply min-w-full table-auto;
}

/* Row styles */
.custom-datatable .p-datatable-tbody > tr {
  @apply transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50;
}

.custom-datatable .p-datatable-tbody > tr:nth-child(even) {
  @apply bg-gray-50/50 dark:bg-gray-800/50;
}

/* Header styles */
.custom-datatable .p-datatable-thead > tr > th {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium p-3 text-left border-b border-gray-200 dark:border-gray-600;
}

/* Cell styles */
.custom-datatable .p-datatable-tbody > tr > td {
  @apply p-3 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300;
}

/* Cell Content Layout */
.cell-content {
  @apply flex items-center;
}

.column-header {
  @apply hidden;
}

/* Links within table cells */
.custom-datatable a {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

/* Custom Mobile View */
.custom-datatable.mobile-view {
  @apply border-0 bg-transparent overflow-visible w-full;
}

.custom-datatable.mobile-view .p-datatable-wrapper {
  @apply overflow-visible w-full;
}

.custom-datatable.mobile-view .p-datatable-thead {
  @apply hidden;
}

.custom-datatable.mobile-view .p-datatable-tbody > tr {
  @apply flex flex-col mb-4 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm hover:shadow bg-white dark:bg-gray-800 w-full;
}

.custom-datatable.mobile-view .p-datatable-tbody > tr > td {
  @apply flex w-full border-0 border-b border-gray-200 dark:border-gray-700 p-3;
}

.custom-datatable.mobile-view .p-datatable-tbody > tr > td:last-child {
  @apply border-b-0;
}

.custom-datatable.mobile-view .cell-content {
  @apply flex w-full justify-between items-center px-1;
}

.custom-datatable.mobile-view .column-header {
  @apply block font-medium text-gray-500 dark:text-gray-400 text-sm w-1/3 text-left;
}

.custom-datatable.mobile-view .cell-value {
  @apply flex items-center justify-end w-2/3 text-right;
}

.custom-datatable.mobile-view .actions-cell {
  @apply justify-center py-4;
}

.custom-datatable.mobile-view .actions-cell .column-header {
  @apply hidden;
}

.custom-datatable.mobile-view .action-buttons {
  @apply w-full flex justify-center gap-2;
}

/* Paginator Styling */
.p-paginator {
  @apply flex justify-center items-center p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 gap-1;
}

.p-paginator .p-paginator-first,
.p-paginator .p-paginator-prev,
.p-paginator .p-paginator-next,
.p-paginator .p-paginator-last,
.p-paginator .p-paginator-page {
  @apply inline-flex justify-center items-center min-w-[2.5rem] h-10 rounded-md text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.p-paginator .p-paginator-first.p-disabled,
.p-paginator .p-paginator-prev.p-disabled,
.p-paginator .p-paginator-next.p-disabled,
.p-paginator .p-paginator-last.p-disabled {
  @apply opacity-50 cursor-not-allowed;
}

.p-paginator .p-paginator-page.p-highlight {
  @apply bg-blue-600 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-600;
}

.p-paginator .p-dropdown {
  @apply border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300;
}

.p-paginator .p-dropdown-label {
  @apply px-3 py-2;
}

/* Action buttons styling */
.action-buttons {
  @apply flex justify-center gap-1;
}

.action-buttons .p-button.p-button-icon-only {
  @apply w-8 h-8 p-0;
}

/* PrimeVue Button Overrides */
.p-button.p-button-text {
  @apply text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700;
}

.p-button.p-button-danger.p-button-text {
  @apply text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20;
}

.p-button.p-button-text .p-button-icon {
  @apply text-gray-500 dark:text-gray-400;
}

.p-button.p-button-danger.p-button-text .p-button-icon {
  @apply text-red-600 dark:text-red-400;
}

/* Badge styling for consistent types */
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

/* Form controls in tables */
.custom-datatable .p-inputtext {
  @apply p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md;
}

/* Fix for selection checkbox */
.p-datatable .p-selection-column {
  @apply w-10 min-w-[2.5rem];
}

/* Improve sort indicator visibility */
.custom-datatable .p-sortable-column {
  @apply cursor-pointer;
}

.custom-datatable .p-sortable-column .p-sortable-column-icon {
  @apply ml-2 text-gray-400 dark:text-gray-500;
}

.custom-datatable .p-sortable-column.p-highlight {
  @apply bg-gray-100 dark:bg-gray-700;
}

.custom-datatable .p-sortable-column.p-highlight .p-sortable-column-icon {
  @apply text-blue-600 dark:text-blue-400;
}

/* Transition for theme changes */
.custom-datatable,
.custom-datatable * {
  @apply transition-colors duration-200;
}

/* Fix mobile view in dark mode */
.dark .custom-datatable.mobile-view .p-datatable-tbody > tr {
  @apply bg-gray-800 border-gray-600;
}

.dark .custom-datatable.mobile-view .p-datatable-tbody > tr > td {
  @apply border-gray-700;
}

.dark .p-paginator {
  @apply bg-gray-800 border-gray-700;
}

/* Fix for loading overlay */
.p-datatable .p-datatable-loading-overlay {
  @apply bg-white/70 dark:bg-gray-900/70;
}
</style>
