<template>
  <div class="organization-selector relative">
    <!-- Current Organization Button -->
    <button 
      @click="toggleDropdown"
      type="button"
      :class="[
        'flex items-center px-3 py-2 text-sm rounded-md',
        isMobile ? 'w-full justify-between' : '',
        isOpen ? 'bg-gray-700 dark:bg-gray-600' : 'hover:bg-gray-700 dark:hover:bg-gray-600'
      ]"
    >
      <div class="flex items-center">
        <div v-if="currentOrganization.logo" class="w-5 h-5 mr-2">
          <img :src="currentOrganization.logo" alt="Logo" class="w-full h-full object-contain rounded" />
        </div>
        <div v-else class="w-5 h-5 bg-primary-700 rounded-sm flex items-center justify-center text-white mr-2">
          {{ currentOrganization.name ? currentOrganization.name.charAt(0).toUpperCase() : '?' }}
        </div>
        <span class="truncate max-w-[120px]">{{ currentOrganization.name }}</span>
      </div>
      <i :class="['pi ml-2', isOpen ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
    </button>
    
    <!-- Organization Dropdown -->
    <div 
      v-if="isOpen"
      class="absolute z-50 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
      :class="isMobile ? 'left-0 right-0 w-full' : dropdownPosition"
    >
      <div class="py-1">
        <!-- Search (shown if multiple organizations) -->
        <div v-if="userOrganizations.length > 5" class="px-3 py-2">
          <input 
            v-model="searchQuery" 
            placeholder="Search organizations..."
            class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
            @input="filterOrganizations"
          />
        </div>
        
        <!-- Organizations List -->
        <div class="max-h-60 overflow-y-auto">
          <button
            v-for="org in filteredOrganizations"
            :key="org.id"
            @click="selectOrganization(org)"
            class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            :class="org.id === currentOrganization.id ? 'bg-gray-100 dark:bg-gray-700' : ''"
          >
            <div class="flex items-center">
              <div v-if="org.logo" class="w-5 h-5 mr-2">
                <img :src="org.logo" alt="Logo" class="w-full h-full object-contain rounded" />
              </div>
              <div v-else class="w-5 h-5 bg-primary-700 rounded-sm flex items-center justify-center text-white mr-2">
                {{ org.name.charAt(0).toUpperCase() }}
              </div>
              <span class="truncate">{{ org.name }}</span>
              <i v-if="org.id === currentOrganization.id" class="pi pi-check ml-auto text-primary-500"></i>
            </div>
          </button>
        </div>
        
        <!-- Create New Organization (admin only) -->
        <div v-if="canManageOrganizations" class="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
          <button
            @click="createNewOrganization"
            class="block w-full text-left px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="pi pi-plus mr-2"></i> Create Organization
          </button>
        </div>
      </div>
    </div>
    
    <!-- Backdrop for mobile -->
    <div 
      v-if="isOpen && isMobile" 
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOrganization } from '../../composables/useOrganization'
import { useWindowSize } from '../../composables/useWindowSize'

// Props
const props = defineProps({
  position: {
    type: String,
    default: 'bottom-start',
    validator: (value) => ['bottom-start', 'bottom-end'].includes(value)
  }
})

// Composables
const { 
  userOrganizations, 
  currentOrganization,
  canManageOrganizations,
  loading, 
  switchOrganization,
  fetchUserOrganizations,
  navigateToCreateOrganization
} = useOrganization()

const { width } = useWindowSize()

// Local state
const isOpen = ref(false)
const searchQuery = ref('')
const filteredOrganizations = ref([])

// Computed
const isMobile = computed(() => width.value < 768)
const dropdownPosition = computed(() => 
  props.position === 'bottom-end' ? 'right-0' : 'left-0'
)

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectOrganization = async (org) => {
  if (org.id === currentOrganization.value?.id) {
    isOpen.value = false
    return
  }
  
  await switchOrganization(org.id)
  isOpen.value = false
}

const filterOrganizations = () => {
  if (!searchQuery.value) {
    filteredOrganizations.value = userOrganizations.value
    return
  }
  
  const query = searchQuery.value.toLowerCase()
  filteredOrganizations.value = userOrganizations.value.filter(org => 
    org.name.toLowerCase().includes(query) ||
    org.code.toLowerCase().includes(query)
  )
}

const createNewOrganization = () => {
  isOpen.value = false
  navigateToCreateOrganization()
}

const closeSidebar = () => {
  isOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const selector = document.querySelector('.organization-selector')
  if (selector && !selector.contains(event.target)) {
    isOpen.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await fetchUserOrganizations()
  filteredOrganizations.value = userOrganizations.value
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch
watch(userOrganizations, () => {
  filteredOrganizations.value = userOrganizations.value
})

watch(searchQuery, () => {
  filterOrganizations()
})
</script>

<style scoped>
.organization-selector {
  position: relative;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}
</style>
