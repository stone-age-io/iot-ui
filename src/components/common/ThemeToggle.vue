<!-- src/components/common/ThemeToggle.vue -->
<template>
  <div class="theme-toggle-wrapper">
    <button
      type="button"
      class="p-button p-button-text p-button-rounded theme-toggle-button"
      @click="toggleTheme"
      :title="tooltipText"
      aria-label="Toggle theme"
    >
      <span class="p-button-icon p-button-icon-only">
        <i :class="currentIcon"></i>
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useThemeStore } from '../../stores/theme';

const themeStore = useThemeStore();

// Icon mapping based on current theme
const currentIcon = computed(() => {
  switch(themeStore.theme) {
    case 'light': return 'pi pi-sun';
    case 'dark': return 'pi pi-moon';
    default: return 'pi pi-desktop';
  }
});

// Descriptive tooltip based on current theme
const tooltipText = computed(() => {
  switch(themeStore.theme) {
    case 'light': return 'Switch to dark theme';
    case 'dark': return 'Switch to system theme';
    default: return 'Switch to light theme';
  }
});

// Toggle theme in a cycle: light -> dark -> auto -> light
function toggleTheme() {
  const currentTheme = themeStore.theme;
  if (currentTheme === 'light') themeStore.setTheme('dark');
  else if (currentTheme === 'dark') themeStore.setTheme('auto');
  else themeStore.setTheme('light');
}

// Add keyboard shortcut for theme toggling (Ctrl/Cmd + Shift + T)
onMounted(() => {
  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
      event.preventDefault();
      toggleTheme();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  
  // Clean up event listener on unmount
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
});
</script>

<style scoped>
.theme-toggle-wrapper {
  position: relative;
  display: inline-block;
  width: 2.5rem;
  height: 2.5rem;
  overflow: visible;
}

.theme-toggle-button {
  position: relative;
  width: 2.5rem !important;
  height: 2.5rem !important;
  min-width: 2.5rem !important;
  min-height: 2.5rem !important;
  padding: 0 !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
  border-radius: 50% !important;
  transition: background-color 0.2s ease !important;
}

.theme-toggle-button:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

.dark .theme-toggle-button:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.theme-toggle-button .p-button-icon {
  margin: 0 !important;
  font-size: 1.25rem !important;
}

/* Different icon colors based on theme */
.pi-sun {
  color: #ff9800 !important;
}

.pi-moon {
  color: #5c6bc0 !important;
}

.pi-desktop {
  color: var(--primary-color, #3b82f6) !important;
}

.dark .pi-sun,
.dark .pi-moon,
.dark .pi-desktop {
  color: #e0e0e0 !important;
}
</style>
