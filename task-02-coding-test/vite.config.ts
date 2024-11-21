import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    // Vitest configuration options
    globals: true,
    environment: 'jsdom',
  },
})