import { formatPseudonymizedResident } from './pseudonymize.util';

describe('formatPseudonymizedResident', () => {
  it('formats full names into initials and short ID', () => {
    expect(
      formatPseudonymizedResident('Margaret Thatcher', 'clx123456789'),
    ).toBe('M.T. (#clx123)');
    expect(formatPseudonymizedResident('John Robert Doe', 'res-abc-xyz')).toBe(
      'J.R.D. (#res-ab)',
    );
  });

  it('handles single names or empty strings gracefully', () => {
    expect(formatPseudonymizedResident('Cher', 'clx98765')).toBe(
      'C. (#clx987)',
    );
    expect(formatPseudonymizedResident('', 'clx98765')).toBe(
      'Resident (#clx987)',
    );
    expect(formatPseudonymizedResident(null, 'clx98765')).toBe(
      'Resident (#clx987)',
    );
    expect(formatPseudonymizedResident(undefined, undefined)).toBe(
      'Resident (N/A)',
    );
  });
});
