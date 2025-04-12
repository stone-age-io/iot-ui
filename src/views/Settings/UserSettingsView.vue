<!-- src/views/Settings/UserSettingsView.vue -->
<template>
  <div>
    <PageHeader 
      title="User Settings" 
      subtitle="Configure your application preferences"
    />
    
    <!-- Theme Settings -->
    <div class="card mb-6">
      <ThemeSettings />
    </div>
    
    <!-- NATS Settings -->
    <div class="card">
      <NatsSettings />
    </div>
    
    <Toast />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Toast from 'primevue/toast';
import PageHeader from '../../components/common/PageHeader.vue';
import NatsSettings from './NatsSettings.vue';
import ThemeSettings from './ThemeSettings.vue';

onMounted(() => {
  // Any initialization logic
});
</script>
