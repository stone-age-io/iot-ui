<!-- src/components/dashboard/ActivityItem.vue -->
<template>
  <div class="activity-item flex items-start py-3 first:pt-0 last:pb-0 border-b border-border-primary dark:border-border-primary-dark last:border-0 theme-transition">
    <div class="activity-icon w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0" :class="getIconColorClass">
      <i :class="iconClass"></i>
    </div>
    <div class="activity-content flex-1 min-w-0">
      <div class="activity-title text-content-primary dark:text-content-primary-dark text-sm font-medium">{{ title }}</div>
      <div class="activity-time text-content-secondary dark:text-content-secondary-dark text-xs mt-1">{{ time }}</div>
      <div v-if="showDetails && details" class="activity-details mt-2 text-xs text-content-secondary dark:text-content-secondary-dark bg-surface-secondary dark:bg-surface-secondary-dark rounded p-2">
        <div class="activity-collection">
          <span class="font-medium">Collection:</span> {{ formatCollection(details.collection) }}
        </div>
        <div v-if="details.recordId" class="activity-record-id">
          <span class="font-medium">Record ID:</span> {{ truncateId(details.recordId) }}
        </div>
        <div v-if="details.method" class="activity-method">
          <span class="font-medium">Method:</span> {{ details.method }}
        </div>
        <div v-if="details.changes && (details.changes.before || details.changes.after)" class="activity-changes mt-1">
          <div v-if="showChanges" class="changes-container bg-surface-tertiary dark:bg-surface-tertiary-dark rounded p-2 max-h-50 overflow-y-auto">
            <div v-if="details.changes.before" class="changes-before">
              <div class="font-medium mb-1">Before:</div>
              <pre class="changes-data bg-surface-primary dark:bg-surface-primary-dark p-1 rounded overflow-x-auto">{{ formatChanges(details.changes.before) }}</pre>
            </div>
            <div v-if="details.changes.after" class="changes-after mt-1">
              <div class="font-medium mb-1">After:</div>
              <pre class="changes-data bg-surface-primary dark:bg-surface-primary-dark p-1 rounded overflow-x-auto">{{ formatChanges(details.changes.after) }}</pre>
            </div>
          </div>
          <Button 
            v-if="details.changes.before || details.changes.after"
            :label="showChanges ? 'Hide Changes' : 'View Changes'" 
            class="p-button-text p-button-sm mt-1" 
            @click="showChanges = !showChanges"
          />
        </div>
      </div>
    </div>
    <!-- Optional action buttons -->
    <div v-if="showActions" class="activity-actions ml-2">
      <Button 
        v-tooltip.top="detailsExpanded ? 'Hide details' : 'Show details'"
        icon="pi pi-info-circle" 
        class="p-button-text p-button-rounded p-button-sm" 
        @click="detailsExpanded = !detailsExpanded"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';

// Component state
const detailsExpanded = ref(false);
const showChanges = ref(false);

const props = defineProps({
  // Main properties
  type: {
    type: String,
    required: true,
    validator: (value) => ['login', 'create', 'update', 'delete', 'error', 'info'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  
  // Optional properties
  id: {
    type: String,
    default: null
  },
  user: {
    type: String,
    default: null
  },
  details: {
    type: Object,
    default: null
  },
  
  // Display options
  showDetails: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: false
  }
});

// Determine icon based on activity type
const iconClass = computed(() => {
  switch (props.type) {
    case 'login': return 'pi pi-sign-in';
    case 'create': return 'pi pi-plus';
    case 'update': return 'pi pi-pencil';
    case 'delete': return 'pi pi-trash';
    case 'error': return 'pi pi-exclamation-triangle';
    default: return 'pi pi-info-circle';
  }
});

// Get the appropriate color class based on activity type with dark mode support
const getIconColorClass = computed(() => {
  const colorMap = {
    login: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    update: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    error: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
  };

  return colorMap[props.type] || colorMap.info;
});

// Format collection name for display
const formatCollection = (collection) => {
  if (!collection) return '';
  return collection
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

// Truncate long IDs for better display
const truncateId = (id) => {
  if (!id) return '';
  if (id.length <= 12) return id;
  return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
};

// Format changes data for display
const formatChanges = (changes) => {
  if (!changes) return '';
  if (typeof changes === 'string') {
    try {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(changes);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Return as is if not valid JSON
      return changes;
    }
  }
  // If already an object, format it
  return JSON.stringify(changes, null, 2);
};
</script>
