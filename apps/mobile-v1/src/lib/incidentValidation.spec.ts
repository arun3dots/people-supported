import { describe, expect, it } from '@jest/globals';
import { incidentValidationError } from './incidentValidation';
import type { IncidentDetailsFormState } from '../components/incident/IncidentDetailsCard';

const form: IncidentDetailsFormState = {
  incidentName: 'Recorded incident',
  residentId: 'person-2',
  residentName: 'Same name',
  incidentDate: '2026-11-13',
  incidentTime: '10:30',
  category: 'Fall',
  harmLevel: '',
  severity: 'Low',
  roomNumber: '',
  bedNumber: '',
  escalationNotes: '',
};
const people = [
  { id: 'person-1', fullName: 'Same name', roomNumber: '1' },
  { id: 'person-2', fullName: 'Same name', roomNumber: '2' },
];

describe('incident records require actual selections', () => {
  it('identifies the selected person by ID when names are duplicated', () => {
    expect(incidentValidationError(form, people, '2026-11-13')).toBeNull();
    expect(
      incidentValidationError({ ...form, residentId: 'missing' }, people, '2026-11-13'),
    ).toContain('affected person');
  });

  it('requires severity and time rather than assigning clinical defaults', () => {
    expect(incidentValidationError({ ...form, severity: '' }, people, '2026-11-13')).toContain(
      'severity',
    );
    expect(incidentValidationError({ ...form, incidentTime: '' }, people, '2026-11-13')).toContain(
      'time',
    );
  });

  it('rejects impossible or future dates without silently changing the recorded incident date', () => {
    expect(
      incidentValidationError({ ...form, incidentDate: '2026-02-31' }, people, '2026-11-13'),
    ).toContain('valid incident date');
    expect(
      incidentValidationError({ ...form, incidentDate: '2026-11-14' }, people, '2026-11-13'),
    ).toContain('future');
  });
});
