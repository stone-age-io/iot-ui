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
        
        <!-- Table Action Buttons -->
        <slot name="table-actions"></slot>
      </div>
    </div>
    
    <!-- Using PrimeVue's built-in responsive capabilities -->
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
      responsiveLayout="stack"
      breakpoint="768px"
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
          :showFilterMenu="!!col.filter"
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
      
      <!-- Row Actions Column - Only included when slot is provided-->
      <Column 
        v-if="hasRowActions" 
        header="Actions" 
        :style="{ width: '8rem' }" 
        headerClass="text-center" 
        bodyClass="text-center"
      >
        <template #body="slotProps">
          <slot name="row-actions" :data="slotProps.data"></slot>
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
