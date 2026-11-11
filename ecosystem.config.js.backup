
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/opt/app/apps/backend',
      script: 'dist/main.js',
      env_file: '/opt/app/apps/backend/.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '700M',
    },
    {
      name: 'web',
      cwd: '/opt/app/apps/web',
      script: 'pnpm',
      args: 'run start',
      env_file: '/opt/app/apps/web/.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'superadmin',
      cwd: '/opt/app/apps/superadmin',
      script: 'pnpm',
      args: 'run start --port 3001',
      env_file: '/opt/app/apps/superadmin/.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
