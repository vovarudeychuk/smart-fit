export default {
  server: {
    host: true,
    cors: true,
    // This specifically allows your ngrok domain
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'bef7-135-23-37-241.ngrok-free.app',
      // The wildcard will allow any ngrok domain
      '*.ngrok-free.app'
    ],
    strictPort: true,
    hmr: {
      clientPort: 4200
    },
    watch: {
      usePolling: true
    }
  }
}; 