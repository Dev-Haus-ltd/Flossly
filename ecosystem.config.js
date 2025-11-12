module.exports = {
  apps: [{
    name: 'flossly',
    script: '.output/server/index.mjs',
    instances: 'max', // Use all CPU cores (cluster mode)
    exec_mode: 'cluster', // Cluster mode for better performance
    env: {
      NODE_ENV: 'production',
      PORT: 3000 // Base port, PM2 will handle port distribution
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048',
    // IMPORTANT: For transcription to work with cluster mode, configure nginx with sticky sessions
    // See nginx-sticky-sessions.conf for configuration
    // The app sets a cookie 'transcription_session' that can be used for routing
  }]
};


