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
  
  // Get data from the cache store
  const data = computed(() => {
    const rawData = cacheStore.getData(collection, operation, id);
    return rawData ? processData(rawData) : null;
  });
  
  // Load data from API (initial load)
  const loadData = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      await performOperation(
        () => fetchFunction(),
        {
          loadingRef: loading,
          errorRef: error,
          errorMessage: `Failed to load ${collection} data`
        }
      );
      
      initialLoadComplete.value = true;
    } catch (err) {
      console.error(`Error loading ${collection} data:`, err);
      error.value = err.message || `Failed to load ${collection} data`;
    } finally {
      loading.value = false;
    }
  };
  
  // Refresh data (manual refresh)
  const refreshData = async (skipCache = true) => {
    loading.value = true;
    error.value = null;
    
    try {
      await performOperation(
        () => fetchFunction({ skipCache }),
        {
          loadingRef: loading,
          errorRef: error,
          errorMessage: `Failed to refresh ${collection} data`
        }
      );
    } catch (err) {
      console.error(`Error refreshing ${collection} data:`, err);
      error.value = err.message || `Failed to refresh ${collection} data`;
    } finally {
      loading.value = false;
    }
  };
  
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
    timestamp: computed(() => cacheStore.lastUpdated[collection])
  };
}
