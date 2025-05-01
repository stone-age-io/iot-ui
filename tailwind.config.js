/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': {
          '50': '#f0f9ff',
          '100': '#e0f2fe',
          '200': '#bae6fd',
          '300': '#7dd3fc',
          '400': '#38bdf8',
          '500': '#0ea5e9',
          '600': '#0284c7',
          '700': '#0369a1',
          '800': '#075985',
          '900': '#0c4a6e',
          '950': '#082f49',
        },
        'surface': {
          'primary': '#ffffff',
          'primary-dark': '#1f2937',
          'hover': '#f3f3f6',
	  'hover-dark': '#374151',
	  'secondary': '#f9fafb',
          'secondary-dark': '#111827',
          'tertiary': '#f3f4f6',
          'tertiary-dark': '#374151'
        },
        'content': {
          'primary': '#111827',
          'primary-dark': '#f9fafb',
          'secondary': '#4b5563',
          'secondary-dark': '#9ca3af'
        },
        'border': {
          'primary': '#e5e7eb',
          'primary-dark': '#4b5563',
          'secondary': '#f3f4f6',
          'secondary-dark': '#374151'
        }
      },
      boxShadow: {
        'theme-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'theme-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'theme-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'theme-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }
    },
  },
  plugins: [],
}
