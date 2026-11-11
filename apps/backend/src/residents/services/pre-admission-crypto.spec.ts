import {
  decryptPartA,
  decryptWholePart,
  encryptPartA,
  encryptPreAdmissionData,
  encryptWholePart,
  isEncrypted,
} from '@repo/db';

describe('pre-admission field encryption', () => {
  const partB = {
    nextOfKin: [{ name: 'Susan Ellison', phone: '07700 900123' }],
    lpa: [{ type: 'Health & Welfare', holderName: 'Susan Ellison' }],
  };

  it('round-trips a whole part and hides its contents', () => {
    const stored = encryptWholePart(partB);
    expect(typeof stored).toBe('string');
    expect(isEncrypted(stored as string)).toBe(true);
    expect(stored as string).not.toContain('Susan');
    expect(decryptWholePart(stored)).toEqual(partB);
  });

  it('does not double-encrypt an already encrypted part', () => {
    const once = encryptWholePart(partB) as string;
    expect(encryptWholePart(once)).toBe(once);
  });

  it('returns legacy plaintext JSON untouched on read', () => {
    expect(decryptWholePart(partB)).toEqual(partB);
  });

  it('encrypts only the sensitive keys of part A', () => {
    const partA = {
      firstName: 'Margaret',
      dob: '1942-03-14',
      nhsNumber: '999 123 4567',
      nationalId: 'AB123456C',
    };
    const stored = encryptPartA(partA) as typeof partA;
    expect(stored.firstName).toBe('Margaret');
    expect(isEncrypted(stored.dob)).toBe(true);
    expect(isEncrypted(stored.nhsNumber)).toBe(true);
    expect(isEncrypted(stored.nationalId)).toBe(true);
    expect(decryptPartA(stored)).toEqual(partA);
  });

  it('encrypts B/E/F and A in a write payload and leaves other parts alone', () => {
    const payload = {
      partA: { dob: '1942-03-14' },
      partB,
      partD: { iddsiLevel: '7' },
      status: 'Draft',
    };
    const out = encryptPreAdmissionData(payload);
    expect(typeof out.partB).toBe('string');
    expect(isEncrypted((out.partA as { dob: string }).dob)).toBe(true);
    expect(out.partD).toEqual({ iddsiLevel: '7' });
    expect(out.status).toBe('Draft');
  });

  it('ignores null and non-object values', () => {
    expect(encryptWholePart(null)).toBeNull();
    expect(decryptWholePart(null)).toBeNull();
    expect(encryptPreAdmissionData({ partB: null }).partB).toBeNull();
  });
});
