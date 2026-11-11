import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true, profile: true, branches: true },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true, profile: true, branches: true },
    });
  }
}

export type UserWithRoleAndProfile = NonNullable<
  Awaited<ReturnType<UsersService['findByEmail']>>
>;
