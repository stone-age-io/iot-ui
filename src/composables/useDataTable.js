// src/composables/useDataTable.js
import { ref, computed, watch } from 'vue'
import { FilterMatchMode } from 'primevue/api'
import { useToast } from 'primevue/usetoast'

/**
 * Composable for common DataTable functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.loadData - Function to load data (should return Promise)
 * @param {Array} options.defaultSortField - Default sort field
 * @param {Number} options.defaultSortOrder - Default sort order (1 for ascending, -1 for descending)
 * @param {Number} options.defaultRows - Default rows per page
 * @param {Array} options.defaultFilters - Default filters
 * @param {Array} options.searchFields - Fields to search in
 * @returns {Object} DataTable state and methods
 */
export function useDataTable(options = {}) {
  const toast = useToast()
  
  // Options with defaults
  const {
    loadData,
    defaultSortField = null,
    defaultSortOrder = 1,
    defaultRows = 10,
    defaultFilters = {},
    searchFields = []
  } = options
  
  // Reactive state
  const items = ref([])
  const loading = ref(false)
  const totalRecords = ref(0)
  const selectedItems = ref([])
  const lazyParams = ref({
    first: 0,
    rows: defaultRows,
    sortField: defaultSortField,
    sortOrder: defaultSortOrder,
    filters: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      ...defaultFilters
    }
  })
  
  // Computed values for pagination
  const currentPage = computed(() => {
    return Math.floor(lazyParams.value.first / lazyParams.value.rows) + 1
  })
  
  // Load data function
  const fetchData = async () => {
    if (!loadData) return
    
    loading.value = true
    
    try {
      const response = await loadData({
        page: currentPage.value,
        rows: lazyParams.value.rows,
        sortField: lazyParams.value.sortField,
        sortOrder: lazyParams.value.sortOrder,
        filters: lazyParams.value.filters
      })
      
      // Check if response has the expected format
      if (response && Array.isArray(response.data)) {
        items.value = response.data
        totalRecords.value = response.total || response.data.length
      } else if (Array.isArray(response)) {
        // Handle case where response is just an array
        items.value = response
        totalRecords.value = response.length
      } else {
        console.error('Invalid data format returned from loadData')
        toast.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load data correctly', 
          life: 3000 
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error.message || 'Failed to load data', 
        life: 3000 
      })
      
      items.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }
  
  // Initialize the data
  watch(lazyParams, () => {
    fetchData()
  }, { immediate: true })
  
  // Event handlers
  const onPage = (event) => {
    lazyParams.value = {
      ...lazyParams.value,
      first: event.first,
      rows: event.rows
    }
  }
  
  const onSort = (event) => {
    lazyParams.value = {
      ...lazyParams.value,
      sortField: event.sortField,
      sortOrder: event.sortOrder
    }
  }
  
  const onFilter = (event) => {
    lazyParams.value = {
      ...lazyParams.value,
      first: 0,
      filters: event.filters
    }
  }
  
  const onSearch = (value) => {
    lazyParams.value.first = 0
    lazyParams.value.filters.global.value = value
  }
  
  const refresh = () => {
    fetchData()
  }
  
  const reset = () => {
    lazyParams.value = {
      first: 0,
      rows: defaultRows,
      sortField: defaultSortField,
      sortOrder: defaultSortOrder,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        ...defaultFilters
      }
    }
    selectedItems.value = []
  }
  
  return {
    // State
    items,
    loading,
    totalRecords,
    selectedItems,
    lazyParams,
    searchFields,
    
    // Computed
    currentPage,
    
    // Methods
    fetchData,
    refresh,
    reset,
    
    // Event handlers
    onPage,
    onSort,
    onFilter,
    onSearch
  }
}
