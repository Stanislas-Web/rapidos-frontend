module.exports = {
  apps: [
    {
      name: 'rapidos-frontend',
      script: 'node_modules/.bin/vite',
      args: '--host 0.0.0.0 --port 5173',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
