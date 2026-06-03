import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: '/japanesestudy/' is needed for GitHub Pages deployment
// Set VITE_BASE=/japanesestudy/ when building for GitHub Pages, or use npm run deploy
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router-dom') || id.includes('scheduler')) {
              return 'react-vendor'
            }
          }

          if (id.includes('/src/data/lessons') || id.includes('/src/data/supplementary')) {
            return 'lesson-data'
          }

          if (id.includes('/src/data/kanji') || id.includes('/src/data/strokeOrder')) {
            return 'kanji-data'
          }

          if (id.includes('/src/data/dialogs')) {
            return 'reading-data'
          }
        },
      },
    },
  },
})
