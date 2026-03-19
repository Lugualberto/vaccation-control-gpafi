import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const basePath = globalThis?.process?.env?.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
  // Allows temporary public tunnel hosts for team testing.
  server: {
    allowedHosts: true,
  },
})
