import {
  buildInvoiceWhere,
  buildPaymentWhere,
  buildExpenseWhere,
} from './finance-query.helper';

describe('finance-query.helper branch scoping', () => {
  it('buildInvoiceWhere filters by branchId directly when set', () => {
    const where = buildInvoiceWhere('tenant-1', { branchId: 'branch-1' });
    expect(where.branchId).toBe('branch-1');
    expect(where.tenantId).toBe('tenant-1');
  });

  it('buildInvoiceWhere omits branchId when absent', () => {
    const where = buildInvoiceWhere('tenant-1', {});
    expect(where.branchId).toBeUndefined();
  });

  it('buildPaymentWhere scopes through the invoice relation, not its own column', () => {
    const where = buildPaymentWhere('tenant-1', { branchId: 'branch-1' });
    expect(where.invoice).toEqual({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
    });
  });

  it('buildPaymentWhere omits the branch clause when absent', () => {
    const where = buildPaymentWhere('tenant-1', {});
    expect(where.invoice).toEqual({ tenantId: 'tenant-1' });
  });

  it('buildExpenseWhere filters by branchId directly when set', () => {
    const where = buildExpenseWhere('tenant-1', { branchId: 'branch-1' });
    expect(where.branchId).toBe('branch-1');
  });

  it('buildExpenseWhere omits branchId when absent', () => {
    const where = buildExpenseWhere('tenant-1', {});
    expect(where.branchId).toBeUndefined();
  });
});
