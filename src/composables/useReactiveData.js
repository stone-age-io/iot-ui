// src/composables/useReactiveData.js
import { ref, computed, watch, onMounted } from 'vue';
import { useCacheStore } from '../stores/cacheStore';
import { useApiOperation } from './useApiOperation';

/**
 * Composable for working with reactive data from the cache store
 * This provides a simple way for components to access and display reactive data
 * that automatically updates when the background refresh happens
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.collection - Collection name
 * @param {string} options.operation - Operation type ('list' or 'detail')
 * @param {string} options.id - ID for detail operations (optional)
 * @param {Function} options.fetchFunction - Function to call to fetch data
 * @param {Function} options.processData - Function to process data (optional)
 * @returns {Object} - Reactive data, loading state, and utility functions
 */
export function useReactiveData(options) {
  const {
    collection,
    operation,
    id = null,
    fetchFunction,
    processData = data => data
  } = options;
  
  // API operation composable for loading/error handling
  const { performOperation } = useApiOperation();
  
  // Get the cache store
  const cacheStore = useCacheStore();
  
  // Local state
  const loading = ref(true);
  const error = ref(null);
  const initialLoadComplete = ref(false);
  const data = ref(null);
  
  // Get timestamp from the cache store
  const timestamp = computed(() => cacheStore.lastUpdated[collection]);
  
  /**
   * Retrieve data from cache and update the local reference
   * @returns {boolean} - Whether data was successfully retrieved from cache
   */
  const getDataFromCache = () => {
    try {
      const cachedData = cacheStore.getData(collection, operation, id);
      if (cachedData) {
        data.value = processData(cachedData);
        return true;
      }
    } catch (err) {
      console.warn(`Error retrieving ${collection} data from cache:`, err);
    }
    return false;
  };
  
  // Load data from API (initial load)
  const loadData = async () => {
    // Check cache first for immediate display
    if (getDataFromCache()) {
      loading.value = false; // Data from cache is immediately available
    } else {
      loading.value = true;
    }
    
    error.value = null;
    
    try {
      const response = await performOperation(
        () => fetchFunction(),
        {
          loadingRef: loading,
          errorRef: error,
          errorMessage: `Failed to load ${collection} data`,
          collection
        }
      );
      
      // Process the response data and store it
      if (response && (response.data || response.fromCache)) {
        // Handle different response formats
        const rawData = response.data || response;
        data.value = processData(rawData);
        
        // Also update the cache store if it's a cacheable operation
        if (operation === 'list' || operation === 'detail') {
          cacheStore.storeData(collection, operation, id, rawData);
        }
      }
      
      initialLoadComplete.value = true;
      return data.value;
    } catch (err) {
      console.error(`Error loading ${collection} data:`, err);
      error.value = err.message || `Failed to load ${collection} data`;
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Refresh data (manual refresh)
  const refreshData = async (skipCache = true) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await performOperation(
        () => fetchFunction({ skipCache }),
        {
          loadingRef: loading,
          errorRef: error,
          errorMessage: `Failed to refresh ${collection} data`,
          collection
        }
      );
      
      // Process the response data and store it
      if (response && (response.data || response.fromCache)) {
        // Handle different response formats
        const rawData = response.data || response;
        data.value = processData(rawData);
        
        // Also update the cache store
        if (operation === 'list' || operation === 'detail') {
          cacheStore.storeData(collection, operation, id, rawData);
        }
      }
      
      return data.value;
    } catch (err) {
      console.error(`Error refreshing ${collection} data:`, err);
      error.value = err.message || `Failed to refresh ${collection} data`;
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Manually update the data in the reactive state and cache store
   * Useful for when data is updated outside the normal fetch flow
   * 
   * @param {Object} newData - New data to store
   */
  const updateData = (newData) => {
    if (!newData) return;
    
    // Update local state
    const processedData = processData(newData.data || newData);
    data.value = processedData;
    
    // Update the cache store
    if (operation === 'list' || operation === 'detail') {
      cacheStore.storeData(collection, operation, id, newData.data || newData);
      cacheStore.updateTimestamp(collection);
    }
  };
  
  // Watch for changes in the cache timestamp for this collection
  // This is the key fix to ensure reactivity when the cache is updated
  watch(
    () => timestamp.value,
    (newTimestamp, oldTimestamp) => {
      if (newTimestamp && initialLoadComplete.value) {
        getDataFromCache();
      }
    }
  );
  
  // Watch for changes in the current collection
  watch(
    () => cacheStore.currentCollection,
    (newCollection) => {
      if (newCollection === collection && !initialLoadComplete.value) {
        // Load data when navigating to this collection and not yet loaded
        loadData();
      }
    },
    { immediate: true }
  );
  
  // Load data on component mount if not already loading/loaded
  onMounted(() => {
    if (!initialLoadComplete.value && !loading.value) {
      loadData();
    }
  });
  
  return {
    data,
    loading,
    error,
    refreshData,
    updateData,
    timestamp
  };
}
