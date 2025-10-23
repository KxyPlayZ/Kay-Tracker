module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/home/aktien/aktien-tracker/backend',
      script: 'npm',
      args: 'run dev -- --host',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'frontend',
      cwd: '/home/aktien/aktien-tracker/frontend',
      script: 'npm',
      args: 'run dev -- --host',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
