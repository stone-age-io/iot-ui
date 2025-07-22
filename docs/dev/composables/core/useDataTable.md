# useDataTable

## Overview

The `useDataTable` composable provides comprehensive state management for PrimeVue DataTable components with lazy loading, pagination, sorting, filtering, and search capabilities. It standardizes data table interactions and provides consistent patterns across the application.

## Location

```
src/composables/useDataTable.js
```

## Purpose

- **DataTable State Management**: Centralized state for pagination, sorting, and filtering
- **Lazy Loading**: Server-side pagination and data fetching
- **Search Integration**: Global search functionality
- **Filter Management**: Dynamic filtering with multiple filter types
- **Performance Optimization**: Efficient data loading and caching
- **Consistent UX**: Standardized data table behavior

## Dependencies

```javascript
import { ref, computed, watch } from 'vue'
import { FilterMatchMode } from 'primevue/api'
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fetchFunction` | `Function` | Yes | Function to fetch data from API |
| `options` | `Object` | No | Configuration options |

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `defaultRows` | `number` | No | `10` | Default page size |
| `defaultSortField` | `string` | No | `null` | Default sort field |
| `defaultSortOrder` | `number` | No | `1` | Default sort order (1 or -1) |
| `searchFields` | `Array<string>` | No | `[]` | Fields to search in |
| `defaultFilters` | `Object` | No | `{}` | Default filter configuration |

## Returns

```javascript
{
  // State
  items: Ref<Array>,
  loading: Ref<boolean>,
  totalRecords: Ref<number>,
  selectedItems: Ref<Array>,
  lazyParams: Ref<Object>,
  searchFields: Ref<Array>,
  
  // Computed
  currentPage: ComputedRef<number>,
  
  // Methods
  fetchData: Function,
  refresh: Function,
  reset: Function,
  
  // Event handlers
  onPage: Function,
  onSort: Function,
  onFilter: Function,
  onSearch: Function
}
```

---

## Properties

### items

Reactive array containing the current page of data items.

**Type:** `Ref<Array>`

**Description:** Contains the items returned from the last successful fetch operation.

### loading

Reactive boolean indicating if a data fetch operation is in progress.

**Type:** `Ref<boolean>`

### totalRecords

Reactive number indicating the total number of records available.

**Type:** `Ref<number>`

**Description:** Used for pagination calculations and display.

### selectedItems

Reactive array containing currently selected items (for multi-select tables).

**Type:** `Ref<Array>`

### lazyParams

Reactive object containing current table state parameters.

**Type:** `Ref<Object>`

**Structure:**

```javascript
{
  first: number,           // Starting record index
  rows: number,            // Number of rows per page
  sortField: string|null,  // Current sort field
  sortOrder: number,       // Sort order (1 or -1)
  filters: Object          // Current filter configuration
}
```

### searchFields

Reactive array of field names that support global search.

**Type:** `Ref<Array<string>>`

### currentPage

Computed property returning the current page number (1-based).

**Type:** `ComputedRef<number>`

```javascript
const currentPage = computed(() => 
  Math.floor(lazyParams.value.first / lazyParams.value.rows) + 1
)
```

---

## Methods

### fetchData()

Fetches data based on current lazy parameters.

**Returns:** `Promise<void>`

**Description:** Called automatically when lazy parameters change. Can be called manually to refresh data.

### refresh()

Refreshes the current data without changing parameters.

**Returns:** `void`

**Description:** Convenient method to reload current page with same filters and sorting.

### reset()

Resets all table state to defaults.

**Returns:** `void`

**Description:** Clears filters, sorting, pagination, and selections back to initial state.

### onPage(event)

Handles pagination events from DataTable.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `event` | `Object` | Yes | Pagination event from DataTable |

**Event Structure:**

```javascript
{
  first: number,  // Starting record index
  rows: number    // Number of rows per page
}
```

### onSort(event)

Handles sorting events from DataTable.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `event` | `Object` | Yes | Sort event from DataTable |

**Event Structure:**

```javascript
{
  sortField: string,  // Field to sort by
  sortOrder: number   // Sort order (1 or -1)
}
```

### onFilter(event)

Handles filtering events from DataTable.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `event` | `Object` | Yes | Filter event from DataTable |

**Event Structure:**

```javascript
{
  filters: Object  // Current filter configuration
}
```

### onSearch(value)

Handles global search functionality.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `value` | `string` | Yes | Search term |

**Description:** Updates the global filter and resets pagination to first page.

---

## Usage Examples

### Basic Data Table

```vue
<template>
  <div>
    <!-- Search input -->
    <div class="flex justify-between mb-4">
      <InputText
        placeholder="Search..."
        @input="dataTable.onSearch($event.target.value)"
        class="w-64"
      />
      <Button
        label="Refresh"
        icon="pi pi-refresh"
        @click="dataTable.refresh()"
      />
    </div>
    
    <!-- Data table -->
    <DataTable
      :value="dataTable.items.value"
      :lazy="true"
      :paginator="true"
      :rows="dataTable.lazyParams.value.rows"
      :totalRecords="dataTable.totalRecords.value"
      :loading="dataTable.loading.value"
      :first="dataTable.lazyParams.value.first"
      :sortField="dataTable.lazyParams.value.sortField"
      :sortOrder="dataTable.lazyParams.value.sortOrder"
      :filters="dataTable.lazyParams.value.filters"
      filterDisplay="row"
      @page="dataTable.onPage"
      @sort="dataTable.onSort"
      @filter="dataTable.onFilter"
    >
      <Column field="code" header="Code" sortable>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            @input="filterCallback()"
            placeholder="Filter by code"
          />
        </template>
      </Column>
      
      <Column field="name" header="Name" sortable>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            @input="filterCallback()"
            placeholder="Filter by name"
          />
        </template>
      </Column>
      
      <Column field="created" header="Created" sortable>
        <template #body="{ data }">
          {{ formatDate(data.created) }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { useDataTable } from '@/composables/useDataTable'
import { edgeService } from '@/services'

// Fetch function for edges
const fetchEdges = async (params) => {
  const response = await edgeService.getList(params)
  return {
    items: response.data.items,
    totalRecords: response.data.totalItems
  }
}

// Initialize data table
const dataTable = useDataTable(fetchEdges, {
  defaultRows: 20,
  defaultSortField: 'created',
  defaultSortOrder: -1,
  searchFields: ['code', 'name', 'description']
})
</script>
```

### Advanced Data Table with Custom Filters

```vue
<template>
  <div>
    <!-- Advanced filter controls -->
    <Card class="mb-4">
      <template #title>Filters</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Type filter -->
          <div>
            <label class="block text-sm font-medium mb-2">Type</label>
            <Dropdown
              v-model="typeFilter"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Types"
              @change="applyTypeFilter"
            />
          </div>
          
          <!-- Status filter -->
          <div>
            <label class="block text-sm font-medium mb-2">Status</label>
            <MultiSelect
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Statuses"
              @change="applyStatusFilter"
            />
          </div>
          
          <!-- Date range filter -->
          <div>
            <label class="block text-sm font-medium mb-2">Created Date</label>
            <Calendar
              v-model="dateRange"
              selectionMode="range"
              @date-select="applyDateFilter"
            />
          </div>
        </div>
        
        <div class="flex gap-2 mt-4">
          <Button
            label="Apply Filters"
            @click="applyAllFilters"
          />
          <Button
            label="Clear Filters"
            class="p-button-secondary"
            @click="clearAllFilters"
          />
        </div>
      </template>
    </Card>
    
    <!-- Data table with selection -->
    <DataTable
      :value="dataTable.items.value"
      v-model:selection="dataTable.selectedItems.value"
      :lazy="true"
      :paginator="true"
      :rows="dataTable.lazyParams.value.rows"
      :totalRecords="dataTable.totalRecords.value"
      :loading="dataTable.loading.value"
      selectionMode="multiple"
      dataKey="id"
      @page="dataTable.onPage"
      @sort="dataTable.onSort"
      @filter="dataTable.onFilter"
    >
      <!-- Bulk actions header -->
      <template #header>
        <div class="flex justify-between items-center">
          <h3>Edges ({{ dataTable.totalRecords.value }})</h3>
          <div v-if="dataTable.selectedItems.value.length > 0">
            <Button
              :label="`Delete ${dataTable.selectedItems.value.length} items`"
              icon="pi pi-trash"
              class="p-button-danger"
              @click="handleBulkDelete"
            />
          </div>
        </div>
      </template>
      
      <!-- Columns -->
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="code" header="Code" sortable />
      <Column field="name" header="Name" sortable />
      <Column field="type" header="Type" sortable />
      <Column field="status" header="Status" sortable />
      <Column field="created" header="Created" sortable />
    </DataTable>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDataTable } from '@/composables/useDataTable'

// Filter state
const typeFilter = ref(null)
const statusFilter = ref([])
const dateRange = ref(null)

// Filter options
const typeOptions = [
  { label: 'Building', value: 'bld' },
  { label: 'Data Center', value: 'dc' }
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

// Enhanced fetch function with custom filters
const fetchEdges = async (params) => {
  const enhancedParams = {
    ...params,
    type: typeFilter.value,
    status: statusFilter.value,
    dateFrom: dateRange.value?.[0],
    dateTo: dateRange.value?.[1]
  }
  
  const response = await edgeService.getList(enhancedParams)
  return {
    items: response.data.items,
    totalRecords: response.data.totalItems
  }
}

const dataTable = useDataTable(fetchEdges, {
  defaultRows: 25,
  searchFields: ['code', 'name']
})

// Filter methods
const applyTypeFilter = () => dataTable.fetchData()
const applyStatusFilter = () => dataTable.fetchData()
const applyDateFilter = () => dataTable.fetchData()

const applyAllFilters = () => dataTable.fetchData()

const clearAllFilters = () => {
  typeFilter.value = null
  statusFilter.value = []
  dateRange.value = null
  dataTable.reset()
}
</script>
```

### Export and Bulk Operations

```javascript
export function useAdvancedDataTable(fetchFunction, options = {}) {
  const baseDataTable = useDataTable(fetchFunction, options)
  
  // Additional state for advanced features
  const exportLoading = ref(false)
  const bulkOperationLoading = ref(false)
  
  // Export functionality
  const exportData = async (format = 'csv') => {
    exportLoading.value = true
    
    try {
      // Fetch all data for export (not just current page)
      const allDataParams = {
        ...baseDataTable.lazyParams.value,
        first: 0,
        rows: baseDataTable.totalRecords.value,
        export: true
      }
      
      const response = await fetchFunction(allDataParams)
      
      // Generate export file
      if (format === 'csv') {
        downloadCSV(response.items)
      } else if (format === 'excel') {
        downloadExcel(response.items)
      }
    } finally {
      exportLoading.value = false
    }
  }
  
  // Bulk operations
  const bulkDelete = async (items) => {
    bulkOperationLoading.value = true
    
    try {
      const deletePromises = items.map(item => 
        deleteService.delete(item.id)
      )
      
      await Promise.all(deletePromises)
      
      // Refresh data after bulk delete
      await baseDataTable.fetchData()
      
      // Clear selection
      baseDataTable.selectedItems.value = []
    } finally {
      bulkOperationLoading.value = false
    }
  }
  
  const bulkUpdate = async (items, updateData) => {
    bulkOperationLoading.value = true
    
    try {
      const updatePromises = items.map(item =>
        updateService.update(item.id, { ...item, ...updateData })
      )
      
      await Promise.all(updatePromises)
      await baseDataTable.fetchData()
      baseDataTable.selectedItems.value = []
    } finally {
      bulkOperationLoading.value = false
    }
  }
  
  return {
    ...baseDataTable,
    
    // Export features
    exportData,
    exportLoading,
    
    // Bulk operations
    bulkDelete,
    bulkUpdate,
    bulkOperationLoading
  }
}
```

---

## Integration with Services

### Server-Side Implementation

The composable expects the fetch function to handle server-side processing:

```javascript
// Service method supporting DataTable parameters
async getList(params = {}) {
  const queryParams = {
    // Pagination
    page: Math.floor(params.first / params.rows) + 1 || 1,
    limit: params.rows || 10,
    
    // Sorting
    sort: params.sortField,
    order: params.sortOrder === 1 ? 'asc' : 'desc',
    
    // Filtering
    ...this.buildFilterParams(params.filters),
    
    // Search
    search: params.filters?.global?.value,
    searchFields: params.searchFields?.join(','),
    
    // Additional parameters
    ...params
  }
  
  return this.apiCall('/api/edges', { params: queryParams })
}

buildFilterParams(filters) {
  const filterParams = {}
  
  Object.entries(filters || {}).forEach(([field, filter]) => {
    if (field === 'global') return // Skip global filter
    
    if (filter.value !== null && filter.value !== undefined) {
      switch (filter.matchMode) {
        case FilterMatchMode.CONTAINS:
          filterParams[`${field}_contains`] = filter.value
          break
        case FilterMatchMode.STARTS_WITH:
          filterParams[`${field}_starts`] = filter.value
          break
        case FilterMatchMode.EQUALS:
          filterParams[field] = filter.value
          break
        case FilterMatchMode.DATE_IS:
          filterParams[`${field}_date`] = filter.value
          break
      }
    }
  })
  
  return filterParams
}
```

### Caching Integration

```javascript
// Enhanced fetch function with caching
const fetchEdgesWithCache = async (params) => {
  // Create cache key from parameters
  const cacheKey = `edges-${JSON.stringify(params)}`
  
  // Check cache first
  const cached = cacheStore.getData('dataTable', cacheKey)
  if (cached && !params.skipCache) {
    return cached
  }
  
  // Fetch from API
  const response = await edgeService.getList(params)
  
  // Cache the result
  cacheStore.setData('dataTable', cacheKey, response)
  
  return {
    items: response.data.items,
    totalRecords: response.data.totalItems
  }
}
```

---

## Best Practices

### 1. Optimize Fetch Functions

```javascript
// ✅ Good - efficient API calls
const fetchEdges = async (params) => {
  const response = await edgeService.getList({
    page: Math.floor(params.first / params.rows) + 1,
    limit: params.rows,
    sort: params.sortField,
    order: params.sortOrder === 1 ? 'asc' : 'desc',
    ...buildFilters(params.filters)
  })
  
  return {
    items: response.data.items,
    totalRecords: response.data.totalItems
  }
}

// ❌ Avoid - fetching all data client-side
const fetchEdges = async (params) => {
  const allData = await edgeService.getAll()
  // Client-side filtering, sorting, pagination
  return processDataClientSide(allData, params)
}
```

### 2. Configure Appropriate Defaults

```javascript
// ✅ Good - sensible defaults
const dataTable = useDataTable(fetchEdges, {
  defaultRows: 25,           // Reasonable page size
  defaultSortField: 'created',
  defaultSortOrder: -1,      // Newest first
  searchFields: ['code', 'name', 'description']
})

// ❌ Avoid - inefficient defaults
const dataTable = useDataTable(fetchEdges, {
  defaultRows: 1000,         // Too large
  searchFields: []           // No search capability
})
```

### 3. Handle Loading States

```vue
<template>
  <DataTable
    :value="dataTable.items.value"
    :loading="dataTable.loading.value"
    loadingIcon="pi pi-spin pi-spinner"
  >
    <template #loading>
      <div class="flex items-center justify-center p-4">
        <ProgressSpinner />
        <span class="ml-2">Loading data...</span>
      </div>
    </template>
  </DataTable>
</template>
```

### 4. Provide User Feedback

```vue
<template>
  <div>
    <!-- Row count information -->
    <div class="text-sm text-gray-600 mb-2">
      Showing {{ dataTable.lazyParams.value.first + 1 }} to 
      {{ Math.min(dataTable.lazyParams.value.first + dataTable.lazyParams.value.rows, dataTable.totalRecords.value) }}
      of {{ dataTable.totalRecords.value }} results
    </div>
    
    <!-- No data message -->
    <DataTable :value="dataTable.items.value">
      <template #empty>
        <div class="text-center p-8">
          <i class="pi pi-info-circle text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600">No data found matching your criteria.</p>
          <Button
            label="Clear Filters"
            class="p-button-text mt-2"
            @click="dataTable.reset()"
          />
        </div>
      </template>
    </DataTable>
  </div>
</template>
```

### 5. Implement Proper Error Handling

```javascript
const fetchEdges = async (params) => {
  try {
    const response = await edgeService.getList(params)
    return {
      items: response.data.items,
      totalRecords: response.data.totalItems
    }
  } catch (error) {
    console.error('Error fetching edges:', error)
    
    // Return empty result on error
    return {
      items: [],
      totalRecords: 0
    }
  }
}
```

---

## Testing

### Unit Testing

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDataTable } from '@/composables/useDataTable'

describe('useDataTable', () => {
  let mockFetchFunction
  
  beforeEach(() => {
    mockFetchFunction = vi.fn().mockResolvedValue({
      items: [{ id: '1', name: 'Test' }],
      totalRecords: 1
    })
  })
  
  it('should initialize with default parameters', () => {
    const dataTable = useDataTable(mockFetchFunction)
    
    expect(dataTable.lazyParams.value.first).toBe(0)
    expect(dataTable.lazyParams.value.rows).toBe(10)
    expect(dataTable.loading.value).toBe(false)
  })
  
  it('should handle pagination events', async () => {
    const dataTable = useDataTable(mockFetchFunction)
    
    dataTable.onPage({ first: 20, rows: 10 })
    
    expect(dataTable.lazyParams.value.first).toBe(20)
    expect(dataTable.lazyParams.value.rows).toBe(10)
  })
  
  it('should handle sort events', () => {
    const dataTable = useDataTable(mockFetchFunction)
    
    dataTable.onSort({ sortField: 'name', sortOrder: -1 })
    
    expect(dataTable.lazyParams.value.sortField).toBe('name')
    expect(dataTable.lazyParams.value.sortOrder).toBe(-1)
  })
  
  it('should fetch data when parameters change', async () => {
    const dataTable = useDataTable(mockFetchFunction)
    
    await dataTable.fetchData()
    
    expect(mockFetchFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        first: 0,
        rows: 10
      })
    )
  })
})
```

The `useDataTable` composable provides a comprehensive solution for managing complex data table interactions, making it easy to build efficient, user-friendly data displays with minimal boilerplate code.
