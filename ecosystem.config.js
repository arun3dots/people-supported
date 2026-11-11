module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/home/ubuntu/apps/people-supported/apps/backend',
      script: 'dist/main.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'web',
      cwd: '/home/ubuntu/apps/people-supported/apps/web',
      script: '/home/ubuntu/apps/people-supported/node_modules/next/dist/bin/next',
      args: 'start --hostname 127.0.0.1 --port 3000',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'superadmin',
      cwd: '/home/ubuntu/apps/people-supported/apps/superadmin',
      script: '/home/ubuntu/apps/people-supported/node_modules/next/dist/bin/next',
      args: 'start --hostname 127.0.0.1 --port 3001',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
