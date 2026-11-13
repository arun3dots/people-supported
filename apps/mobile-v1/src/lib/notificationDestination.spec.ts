import { describe, expect, it } from '@jest/globals';
import { notificationDestination } from './notificationDestination';

describe('mobile notification destinations', () => {
  it.each([
    '/carer/rota?shiftId=shift-1&reminder=30min',
    '/carer/rota',
    'https://web.example.com/carer/rota?shiftId=shift-1',
    '/admin/shifts',
  ])('opens the mobile weekly rota for %s', (actionUrl) => {
    expect(notificationDestination({ actionUrl })).toEqual({
      pathname: '/',
      params: { openShiftDetails: 'true', tab: 'weekly' },
    });
  });

  it('resolves shift reminders without a web action URL', () => {
    expect(
      notificationDestination({ title: 'Upcoming Shift in 30 Minutes', category: 'SYSTEM' }),
    ).toEqual({ pathname: '/', params: { openShiftDetails: 'true', tab: 'weekly' } });
  });

  it('keeps the resident identifier when opening their medication record', () => {
    expect(notificationDestination({ actionUrl: '/residents/resident-1/medication' })).toEqual({
      pathname: '/mar',
      params: { id: 'resident-1' },
    });
  });

  it('opens resident details for a web resident link', () => {
    expect(
      notificationDestination({ actionUrl: '/admin/residents/resident-1?tab=overview' }),
    ).toEqual({ pathname: '/resident-details', params: { id: 'resident-1' } });
  });

  it.each(['/does-not-exist', 'javascript:alert(1)', '/admin/finance/invoices'])(
    'falls back to notifications for unsupported destination %s',
    (actionUrl) => {
      expect(notificationDestination({ actionUrl })).toBe('/alerts');
    },
  );

  it('retains known task, medication and notification destinations', () => {
    expect(notificationDestination({ category: 'TASK' })).toBe('/tasks');
    expect(notificationDestination({ category: 'MEDICATION' })).toBe('/mar');
    expect(notificationDestination({ actionUrl: '/alerts' })).toBe('/alerts');
  });
});
