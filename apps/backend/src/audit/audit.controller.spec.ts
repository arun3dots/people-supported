/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { AuditController } from './audit.controller';
import { assertAuditSigningKeyConfigured } from './audit-db.service';

describe('AuditController & AuditDbService Compliance (D-06 & C-03)', () => {
  it('enforces @Roles(Admin, Manager) on getLogs and @Roles(Admin) on verifyIntegrity (D-06)', () => {
    const getLogsRoles = Reflect.getMetadata(
      ROLES_KEY,
      AuditController.prototype.getLogs,
    );

    const verifyIntegrityRoles = Reflect.getMetadata(
      ROLES_KEY,
      AuditController.prototype.verifyIntegrity,
    );

    expect(getLogsRoles).toEqual(['Admin', 'Manager']);
    expect(verifyIntegrityRoles).toEqual(['Admin']);
  });

  it('rejects missing or weak (< 16 chars) AUDIT_SIGNING_KEY in production (C-03)', () => {
    expect(() => assertAuditSigningKeyConfigured('', 'production')).toThrow(
      /FATAL \[C-03\]/,
    );
    expect(() =>
      assertAuditSigningKeyConfigured('short-key', 'production'),
    ).toThrow(/FATAL \[C-03\]/);
    expect(() =>
      assertAuditSigningKeyConfigured(
        'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
        'production',
      ),
    ).not.toThrow();
  });
});
