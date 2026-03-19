import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allows temporary public tunnel hosts for team testing.
  server: {
    allowedHosts: true,
  },
})
