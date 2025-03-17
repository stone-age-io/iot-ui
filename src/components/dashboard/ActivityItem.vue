<!-- src/components/dashboard/ActivityItem.vue -->
<template>
  <div class="activity-item">
    <div class="activity-icon" :class="getIconClass">
      <i :class="iconClass"></i>
    </div>
    <div class="activity-content">
      <div class="activity-title">{{ title }}</div>
      <div class="activity-time">{{ time }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
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
  }
});

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

const getIconClass = computed(() => {
  // For the current screenshot styling, we'll use a more neutral approach
  // that matches the existing design more closely
  return 'bg-gray-100 text-gray-600';
});
</script>

<style scoped>
.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
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
  font-weight: 400;
  color: #1f2937;
  line-height: 1.25;
}

.activity-time {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}
</style>
