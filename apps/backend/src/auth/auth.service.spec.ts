import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { MailService } from '../common/mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { MfaService } from './mfa.service';
import { PasswordService } from './password.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('@repo/db', () => ({
  prisma: {
    branch: {
      findFirst: jest.fn().mockResolvedValue({ id: 'branch-123' }),
      create: jest.fn().mockResolvedValue({ id: 'branch-123' }),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 'tenant-123' }),
    },
    userBranch: {
      upsert: jest.fn().mockResolvedValue({ branchId: 'branch-123' }),
      findMany: jest.fn().mockResolvedValue([{ branchId: 'branch-123' }]),
    },
    user: {
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
  let refreshTokenService: jest.Mocked<
    Pick<RefreshTokenService, 'createRefreshToken'>
  >;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: { name: 'Admin' },
    tenantId: 'tenant-123',
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    } as unknown as jest.Mocked<Pick<JwtService, 'sign'>>;

    refreshTokenService = {
      createRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
    } as unknown as jest.Mocked<
      Pick<RefreshTokenService, 'createRefreshToken'>
    >;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: MailService, useValue: {} },
        { provide: AuditService, useValue: {} },
        {
          provide: MfaService,
          useValue: { isMfaConfigured: jest.fn().mockResolvedValue(false) },
        },
        {
          provide: PasswordService,
          useValue: {
            checkPasswordNotBreached: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('returns the user without passwordHash on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toHaveProperty('id', 'user-123');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws UnauthorizedException on unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('wrong@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('issues an access token and a refresh token', async () => {
      const result = await service.login(mockUser as never);
      expect(result.access_token).toBe('mocked-jwt-token');
      expect(result.refresh_token).toBe('refresh-token');
    });
  });
});
