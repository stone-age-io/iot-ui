<!-- src/components/common/ThemeToggle.vue -->
<template>
  <Button 
    :icon="currentIcon" 
    class="p-button-text p-button-rounded" 
    @click="toggleTheme"
    v-tooltip="'Toggle theme'" 
  />
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../../stores/theme'
import Button from 'primevue/button'

const themeStore = useThemeStore()

const currentIcon = computed(() => {
  switch(themeStore.theme) {
    case 'light': return 'pi pi-sun'
    case 'dark': return 'pi pi-moon'
    default: return 'pi pi-desktop'
  }
})

function toggleTheme() {
  const currentTheme = themeStore.theme
  if (currentTheme === 'light') themeStore.setTheme('dark')
  else if (currentTheme === 'dark') themeStore.setTheme('auto')
  else themeStore.setTheme('light')
}
</script>
