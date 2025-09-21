module.exports = {
  apps: [
    {
      name: 'ccqe-ax-platform',
      script: 'server.js',
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}