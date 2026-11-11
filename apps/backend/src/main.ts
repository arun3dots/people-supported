import './load-env'; // MUST be first â€” populates process.env before other modules load
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { assertEncryptionKeyConfigured } from '@repo/db';
import { assertJwtSecretConfigured } from './auth/jwt-secret.util';
import { assertAuditSigningKeyConfigured } from './audit/audit-db.service';
import { assertApiUrlConfigured } from './common/utils/api-url.util';
import { StructuredLoggerService } from './common/logger/structured-logger.service';

function isAllowedCorsOrigin(
  requestOrigin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!requestOrigin) return true;
  const normalized = requestOrigin.trim().replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;

  // Support tenant subdomains of configured origins (e.g. https://home1.cantracare.co.uk or http://home1.localhost:3000)
  try {
    const reqUrl = new URL(normalized);
    for (const allowed of allowedOrigins) {
      const allowedUrl = new URL(allowed);
      if (
        reqUrl.protocol === allowedUrl.protocol &&
        reqUrl.port === allowedUrl.port &&
        reqUrl.hostname.endsWith(`.${allowedUrl.hostname}`)
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // D-04, E-02, C-03: Fail closed at startup if cryptographic secrets are missing/weak
  assertJwtSecretConfigured();
  assertEncryptionKeyConfigured();
  assertAuditSigningKeyConfigured();
  assertApiUrlConfigured();

  // rawBody:true makes req.rawBody (Buffer) available for webhook signature
  // verification, while parsed JSON still works on every other route.
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger:
      process.env.NODE_ENV === 'production'
        ? new StructuredLoggerService()
        : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api');

  // E-04: Security headers via Helmet (HSTS, CSP, frame-ancestors, X-Content-Type-Options)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://storage.googleapis.com'],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.use(cookieParser());

  const corsOrigins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://localhost:3001,http://localhost:3002'
  )
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  // E-04: Enforce explicit CORS origin allow-list instead of origin: true
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isAllowedCorsOrigin(origin, corsOrigins)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type,Accept,Authorization,X-Requested-With,X-Tenant-Id,X-Latitude,X-Longitude',
    credentials: true,
  });

  // E-16: Attack surface reduction (UK GDPR Art 32). Expose Swagger ONLY in development/staging
  // or when explicitly enabled via ENABLE_SWAGGER=true in a non-production environment.
  const isSwaggerEnabled =
    process.env.ENABLE_SWAGGER === 'true' ||
    (process.env.NODE_ENV !== 'production' &&
      process.env.ENABLE_SWAGGER !== 'false');

  if (isSwaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Cantra Care API')
      .setDescription(
        'The Cantra Care platform API documentation. Supports Multi-tenancy and RBAC.',
      )
      .setVersion('1.0')
      .addTag('Auth', 'Authentication and session management')
      .addTag('Tenants', 'Super Admin tenant management')
      .addTag('Users', 'User and profile management')
      .addTag('Staff', 'Staff HR and role management')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(4400, '127.0.0.1');
  logger.log('Server is listening on port 4400');
}

bootstrap().catch((err) => {
  console.error('SERVER FATAL ERROR:', err);
  process.exit(1);
});
