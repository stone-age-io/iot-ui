<template>
  <div class="settings-container">
    <PageHeader 
      title="User Settings" 
      subtitle="Configure your application preferences"
    />
    
    <!-- Settings Grid Layout -->
    <div class="grid grid-cols-1 gap-6">
      <!-- Theme Settings -->
      <Card>
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">
            <i class="pi pi-palette mr-2"></i>
            Appearance
          </h2>
        </template>
        <template #content>
          <ThemeSettings />
        </template>
      </Card>
      
      <!-- NATS Settings -->
      <Card>
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">
            <i class="pi pi-server mr-2"></i>
            NATS Messaging
          </h2>
        </template>
        <template #content>
          <NatsSettings />
        </template>
      </Card>
    </div>
    
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useTheme } from '../../composables/useTheme';
import Toast from 'primevue/toast';
import Card from 'primevue/card';
import PageHeader from '../../components/common/PageHeader.vue';
import NatsSettings from './NatsSettings.vue';
import ThemeSettings from './ThemeSettings.vue';

// Theme composable for theme-aware styling
const { textColor, backgroundColor, borderColor } = useTheme();

onMounted(() => {
  // Initialize any components or load user settings
  document.title = 'User Settings | IoT Platform';
});
</script>

<style scoped>
.settings-container {
  margin-bottom: 2rem;
}

:deep(.p-card) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

:deep(.p-card .p-card-title) {
  padding: 1.25rem 1.5rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color);
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

/* Fix for dark mode styling */
:deep(.dark .p-card),
:deep(.dark .p-card .p-card-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}
</style>
