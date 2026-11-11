import { useState, useCallback, useEffect } from 'react';
import {
  ADMINISTER_MEDICATION,
  GET_RESIDENT_MEDICATION_ROUNDS,
} from '@repo/endpoints';
import { MedicationRoundItem } from '../../domain/entities/MedicationRound';
import { validateMedicationAdministration, EmarValidationResult } from '../../domain/clinical/emar';
import { ResidentAllergy } from '../../domain/entities/Resident';
import { makeMobileApiCall } from '../../data/api/client';
import { enqueueMutation } from '../../data/api/offlineQueue';
import { safeLogger } from '../../data/security/safeLogger';
import { formatUkTime } from '../../lib/date';

export function useEmarRound(
  residentId?: string,
  initialResidentAllergies: Record<string, ResidentAllergy[]> = {}
) {
  const [items, setItems] = useState<MedicationRoundItem[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(residentId));
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Fetch real medication rounds if residentId is provided
  useEffect(() => {
    if (!residentId) return;
    const targetResidentId = residentId;

    let isMounted = true;
    async function loadRounds() {
      try {
        setLoading(true);
        const res = await makeMobileApiCall<Array<Record<string, unknown>>>(
          GET_RESIDENT_MEDICATION_ROUNDS,
          undefined,
          undefined,
          { id: targetResidentId }
        );
        if (isMounted && Array.isArray(res) && res.length > 0) {
          const mapped: MedicationRoundItem[] = res.map((r, idx) => {
            const residentObj = r.resident as Record<string, unknown> | undefined;
            const bedObj = residentObj?.bed as Record<string, unknown> | undefined;
            const roomObj = bedObj?.room as Record<string, unknown> | undefined;

            return {
              id: String(r.id || `round_${idx}`),
              residentId: targetResidentId,
              residentName: String(residentObj?.fullName || 'Person Supported'),
              roomNumber: String(
                residentObj?.roomNumber ||
                  roomObj?.roomNumber ||
                  bedObj?.bedLabel ||
                  ''
              ),
              drugName: String(r.drugName || 'Medication'),
              dose: String(r.dose || 'Standard dose'),
              form: String(r.form || 'Tablet'),
              route: String(r.route || 'Oral'),
              scheduledTime: String(r.scheduledTime || '12:00'),
              instructions: typeof r.instructions === 'string' ? r.instructions : undefined,
              isControlledDrug: Boolean(r.isControlledDrug),
              status: 'Pending',
            };
          });
          setItems(mapped);
        } else if (isMounted) {
          setItems([]);
        }
      } catch (err) {
        safeLogger.warn('Failed to fetch real medication rounds', err);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadRounds();
    return () => {
      isMounted = false;
    };
  }, [residentId]);

  const administerItem = useCallback(
    async (item: MedicationRoundItem, staffName = 'Care Staff', witnessName?: string) => {
      const allergies = initialResidentAllergies[item.residentId] || [];

      const validation: EmarValidationResult = validateMedicationAdministration({
        medication: item,
        residentAllergies: allergies,
        status: 'Given',
        administeredByStaffId: 'current-staff',
        witnessStaffId: witnessName ? 'witness-staff' : undefined,
      });

      if (!validation.isValid) {
        setValidationAlert(validation.error || 'Administration validation failed.');
        return false;
      }

      const nowTimeStr = formatUkTime(new Date());

      // 1. Optimistic UI update
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'Given',
                administeredAt: nowTimeStr,
                administeredByStaffName: staffName,
                witnessStaffName: witnessName,
              }
            : i
        )
      );
      setValidationAlert(null);

      // 2. Call backend API with offline fallback
      const payload = {
        roundId: item.id,
        residentId: item.residentId,
        status: 'Given' as const,
        witnessName: witnessName || undefined,
        witnessRole: witnessName ? 'Witness Staff' : undefined,
      };

      try {
        await makeMobileApiCall(ADMINISTER_MEDICATION, payload);
        safeLogger.info(`Successfully recorded medication administration for round ${item.id}`);
      } catch (err) {
        safeLogger.warn('Network error recording administration, queuing offline', err);
        await enqueueMutation(ADMINISTER_MEDICATION, payload);
      }

      return true;
    },
    [initialResidentAllergies]
  );

  const refuseItem = useCallback(
    async (item: MedicationRoundItem, reason: string, staffName = 'Care Staff') => {
      const nowTimeStr = formatUkTime(new Date());

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'Refused',
                reason,
                administeredAt: nowTimeStr,
                administeredByStaffName: staffName,
              }
            : i
        )
      );

      const payload = {
        roundId: item.id,
        residentId: item.residentId,
        status: 'Refused' as const,
        reason,
      };

      try {
        await makeMobileApiCall(ADMINISTER_MEDICATION, payload);
      } catch {
        await enqueueMutation(ADMINISTER_MEDICATION, payload);
      }
    },
    []
  );

  const omitItem = useCallback(
    async (item: MedicationRoundItem, reason: string, staffName = 'Care Staff') => {
      const nowTimeStr = formatUkTime(new Date());

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'Omitted',
                reason,
                administeredAt: nowTimeStr,
                administeredByStaffName: staffName,
              }
            : i
        )
      );

      const payload = {
        roundId: item.id,
        residentId: item.residentId,
        status: 'Omitted' as const,
        reason,
      };

      try {
        await makeMobileApiCall(ADMINISTER_MEDICATION, payload);
      } catch {
        await enqueueMutation(ADMINISTER_MEDICATION, payload);
      }
    },
    []
  );

  return {
    items,
    loading,
    validationAlert,
    dismissValidationAlert: () => setValidationAlert(null),
    administerItem,
    refuseItem,
    omitItem,
  };
}
