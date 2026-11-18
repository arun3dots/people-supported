import { useState, useCallback, useEffect } from 'react';
import { ADMINISTER_MEDICATION, GET_RESIDENT_MEDICATION_ROUNDS } from '@repo/endpoints';
import type { MedicationRoundItem, MedicationStatus } from '../../domain/entities/MedicationRound';
import { validateMedicationAdministration } from '../../domain/clinical/emar';
import type { ResidentAllergy } from '../../domain/entities/Resident';
import { makeMobileApiCall } from '../../data/api/client';
import { enqueueMutation } from '../../data/api/offlineQueue';
import { isNetworkError } from '../../data/api/errors';
import { useAuth } from '../context/AuthContext';
import { formatUkTime } from '../../lib/date';

export function useEmarRound(
  residentId?: string,
  initialResidentAllergies: Record<string, ResidentAllergy[]> = {},
) {
  const { user } = useAuth();
  const [items, setItems] = useState<MedicationRoundItem[]>([]);
  const [loading, setLoading] = useState(Boolean(residentId));
  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    setItems([]);
    if (!residentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void makeMobileApiCall<Array<Record<string, unknown>>>(
      GET_RESIDENT_MEDICATION_ROUNDS,
      undefined,
      undefined,
      { id: residentId },
    )
      .then((rounds) => {
        if (!Array.isArray(rounds)) throw new Error('Invalid medication rounds response');
        const mapped = rounds.flatMap((round): MedicationRoundItem[] => {
          if (typeof round.id !== 'string') return [];
          const resident = round.resident as { fullName?: string; roomNumber?: string } | undefined;
          const status = round.status;
          if (!['Pending', 'Given', 'Refused', 'Omitted', 'NPO'].includes(String(status)))
            return [];
          return [
            {
              id: round.id,
              residentId,
              residentName: resident?.fullName ?? 'Name not recorded',
              roomNumber: resident?.roomNumber ?? '',
              drugName: typeof round.drugName === 'string' ? round.drugName : 'Not recorded',
              dose: typeof round.dose === 'string' ? round.dose : 'Not recorded',
              form: typeof round.form === 'string' ? round.form : 'Not recorded',
              route: typeof round.route === 'string' ? round.route : 'Not recorded',
              scheduledTime: typeof round.scheduledTime === 'string' ? round.scheduledTime : '',
              instructions: typeof round.instructions === 'string' ? round.instructions : undefined,
              isControlledDrug: round.isControlledDrug === true,
              status: status as MedicationStatus,
            },
          ];
        });
        if (mounted) {
          setItems(mapped);
          setValidationAlert(null);
        }
      })
      .catch((error: unknown) => {
        if (mounted)
          setValidationAlert(
            error instanceof Error ? error.message : 'Unable to load medication rounds',
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [residentId]);

  const record = useCallback(
    async (
      item: MedicationRoundItem,
      status: 'Given' | 'Refused' | 'Omitted',
      reason?: string,
      witnessName?: string,
      witnessId?: string,
    ) => {
      if (!user?.id) throw new Error('Please sign in before recording medication');
      const payload = {
        roundId: item.id,
        residentId: item.residentId,
        status,
        reason,
        witnessName,
        witnessId,
      };
      try {
        await makeMobileApiCall(ADMINISTER_MEDICATION, payload);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        await enqueueMutation(ADMINISTER_MEDICATION, payload);
        setValidationAlert(
          'Saved offline. This administration has not yet been recorded on the server.',
        );
        return false;
      }
      setItems((previous) =>
        previous.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status,
                reason,
                administeredAt: formatUkTime(new Date()),
                administeredByStaffName: user.fullName,
                witnessStaffName: witnessName,
              }
            : row,
        ),
      );
      setValidationAlert(null);
      return true;
    },
    [user],
  );

  const administerItem = useCallback(
    async (
      item: MedicationRoundItem,
      _staffName?: string,
      witnessName?: string,
      witnessId?: string,
    ) => {
      const validation = validateMedicationAdministration({
        medication: item,
        residentAllergies: initialResidentAllergies[item.residentId] ?? [],
        status: 'Given',
        administeredByStaffId: user?.id ?? '',
        witnessStaffId: witnessId,
      });
      if (!validation.isValid) {
        setValidationAlert(validation.error ?? 'Administration validation failed');
        return false;
      }
      return record(item, 'Given', undefined, witnessName, witnessId);
    },
    [initialResidentAllergies, record, user?.id],
  );
  const refuseItem = useCallback(
    (item: MedicationRoundItem, reason: string, _staffName?: string) =>
      record(item, 'Refused', reason),
    [record],
  );
  const omitItem = useCallback(
    (item: MedicationRoundItem, reason: string, _staffName?: string) =>
      record(item, 'Omitted', reason),
    [record],
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
