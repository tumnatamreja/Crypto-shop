module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'npm',
      args: 'start',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './backend/logs/error.log',
      out_file: './backend/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './frontend/logs/error.log',
      out_file: './frontend/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
