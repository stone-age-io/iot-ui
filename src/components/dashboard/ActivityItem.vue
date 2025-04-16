<!-- src/components/dashboard/ActivityItem.vue -->
<template>
  <div class="activity-item border-theme">
    <div class="activity-icon" :class="getIconColorClass">
      <i :class="iconClass"></i>
    </div>
    <div class="activity-content">
      <div class="activity-title text-theme-primary">{{ title }}</div>
      <div class="activity-time text-theme-secondary">{{ time }}</div>
      <div v-if="showDetails && details" class="activity-details mt-2 text-xs text-theme-secondary">
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
          <div v-if="showChanges" class="changes-container">
            <div v-if="details.changes.before" class="changes-before">
              <div class="font-medium mb-1">Before:</div>
              <pre class="changes-data">{{ formatChanges(details.changes.before) }}</pre>
            </div>
            <div v-if="details.changes.after" class="changes-after mt-1">
              <div class="font-medium mb-1">After:</div>
              <pre class="changes-data">{{ formatChanges(details.changes.after) }}</pre>
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
import { useTheme } from '../../composables/useTheme';
import Button from 'primevue/button';

// Use theme composable for reactive theme values
const { themeValue } = useTheme();
const router = useRouter();

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

// Get the appropriate color class based on activity type
const getIconColorClass = computed(() => {
  const colorMap = {
    login: themeValue.value.class('bg-blue-100 text-blue-700', 'bg-blue-900/30 text-blue-400'),
    create: themeValue.value.class('bg-green-100 text-green-700', 'bg-green-900/30 text-green-400'),
    update: themeValue.value.class('bg-purple-100 text-purple-700', 'bg-purple-900/30 text-purple-400'),
    delete: themeValue.value.class('bg-red-100 text-red-700', 'bg-red-900/30 text-red-400'),
    error: themeValue.value.class('bg-amber-100 text-amber-700', 'bg-amber-900/30 text-amber-400'),
    info: themeValue.value.class('bg-gray-100 text-gray-700', 'bg-gray-700 text-gray-400')
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

<style scoped>
.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom-width: 1px;
  border-bottom-style: solid;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25;
}

.activity-time {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.activity-details {
  background-color: rgba(var(--color-surface-alt), 0.6);
  border-radius: 0.25rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  transition: background-color var(--theme-transition-duration, 0.2s) var(--theme-transition-timing, ease);
}

.changes-container {
  background-color: rgba(var(--color-surface-alt), 0.4);
  border-radius: 0.25rem;
  padding: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.changes-data {
  font-family: monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  margin: 0;
  background-color: rgba(var(--color-code-bg, 241, 245, 249), 0.6);
  padding: 0.25rem;
  border-radius: 0.25rem;
  overflow-x: auto;
}
</style>
