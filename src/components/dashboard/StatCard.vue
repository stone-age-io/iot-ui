<!-- src/components/dashboard/StatCard.vue -->
<template>
  <div class="stat-card">
    <div class="stat-card-icon" :class="iconBgClass">
      <i :class="[icon, iconColorClass]"></i>
    </div>
    <div class="stat-card-content">
      <div class="stat-card-label">{{ label }}</div>
      <div class="stat-card-value">{{ value }}</div>
    </div>
    <router-link :to="linkTo" class="stat-card-link" :class="linkColorClass">
      <span>{{ linkText }}</span>
      <i class="pi pi-arrow-right"></i>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'purple', 'orange', 'red', 'gray'].includes(value)
  },
  linkTo: {
    type: [String, Object],
    required: true
  },
  linkText: {
    type: String,
    default: 'View all'
  }
});

const iconBgClass = computed(() => `bg-${props.color}-50`);
const iconColorClass = computed(() => `text-${props.color}-600`);
const linkColorClass = computed(() => `text-${props.color}-600`);
</script>

<style scoped>
.stat-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.stat-card-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.875rem;
  flex-shrink: 0;
}

.stat-card-icon i {
  font-size: 1.125rem;
}

.stat-card-content {
  flex: 1;
  min-width: 0;
}

.stat-card-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.25;
}

.stat-card-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.25;
}

.stat-card-link {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 500;
  transition: opacity 0.15s ease;
}

.stat-card-link i {
  font-size: 0.675rem;
  margin-left: 0.25rem;
}

.stat-card-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
</style>
