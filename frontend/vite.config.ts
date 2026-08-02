import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// The `@/*` -> `src/*` alias is provided by vite-tsconfig-paths (reads tsconfig).
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: true, // listen on 0.0.0.0 so the dev container is reachable
    port: 5173,
    proxy: {
      // Proxy API calls to the FastAPI backend during local dev.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
