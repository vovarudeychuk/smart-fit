import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    cors: true,
    // This will allow any host to access your application
    // including your ngrok URL
    strictPort: true,
    hmr: {
      clientPort: 4200
    },
    watch: {
      usePolling: true
    }
  }
}); 