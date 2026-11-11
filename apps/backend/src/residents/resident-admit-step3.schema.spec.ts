import { AdmitStep3Schema } from '@repo/schema';

describe('AdmitStep3Schema', () => {
  it('normalizes numeric vital readings and ignores blank medication rows', () => {
    const result = AdmitStep3Schema.parse({
      baselineVitals: {
        bp: '120/80',
        pulse: '72',
        temp: '36.8',
        respiratoryRate: '16',
        spO2: '98',
      },
      currentMedications: [{ name: '', dose: '', frequency: '', route: '' }],
    });

    expect(result.baselineVitals).toEqual({
      bp: '120/80',
      pulse: 72,
      temp: 36.8,
      respiratoryRate: 16,
      spO2: 98,
    });
    expect(result.currentMedications).toEqual([]);
  });

  it('does not turn blank vital readings into zero', () => {
    const result = AdmitStep3Schema.parse({
      baselineVitals: { pulse: '', temp: '  ' },
    });

    expect(result.baselineVitals?.pulse).toBeUndefined();
    expect(result.baselineVitals?.temp).toBeUndefined();
  });

  it('keeps required medication details explicit when a medicine is named', () => {
    const result = AdmitStep3Schema.safeParse({
      currentMedications: [{ name: 'Aspirin', dose: '', frequency: '' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual([
        'Dose is required',
        'Frequency is required',
      ]);
    }
  });
});
