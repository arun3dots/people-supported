import { prisma } from './packages/db/src/index';

console.log('Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('$')));
