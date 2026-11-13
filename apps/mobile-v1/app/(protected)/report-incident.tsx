import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import {
  GET_RESIDENTS,
  CREATE_INCIDENT,
  UPLOAD_INCIDENT_ATTACHMENT,
  UPDATE_INCIDENT,
} from '@repo/endpoints';
import { ScreenWrapper, Text } from '../../src/presentation/components/common';
import { formatUkDate, formatUkTime, getUkDateString, normalizeToIsoDate } from '../../src/lib/date';
import { appendFileToFormData } from '../../src/lib/fileUpload';
import {
  IncidentDetailsCard,
  type IncidentDetailsFormState,
  type ResidentOption,
} from '../../src/components/incident/IncidentDetailsCard';
import {
  IncidentActionsAndAttachments,
  type IncidentAttachment,
} from '../../src/components/incident/IncidentActionsAndAttachments';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { makeMobileApiCall } from '../../src/data/api/client';

export default function ReportIncidentScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { assignedResidents } = useShiftDashboard();

  const { data: rawResidents = [] } = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['facility-residents-all'],
    queryFn: async () => {
      const res = await makeMobileApiCall<
        { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>
      >(GET_RESIDENTS, undefined, { includeAll: true, all: true });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const residentOptions: ResidentOption[] = useMemo(() => {
      const map = new Map<string, ResidentOption>();

      for (const r of rawResidents) {
        const id = String(r.id || '');
        if (!id) continue;
        const bed = r.bed as Record<string, unknown> | undefined;
        const room = bed?.room as Record<string, unknown> | undefined;
          const rawRoom = String(r.roomNumber || room?.roomNumber || '').trim();
          const rawBed = String(r.bedNumber || bed?.bedLabel || bed?.number || '').trim();
          map.set(id, {
            id,
            fullName: String(r.fullName || 'Person Supported'),
  roomNumber: rawRoom
    ? rawRoom.toLowerCase().startsWith('room')
      ? rawRoom
      : `Room ${rawRoom}`
    : 'Room Unassigned',
    bedNumber: rawBed,
      });
    }

for (const r of assignedResidents) {
  if (!r.id || map.has(r.id)) continue;
  const rawRoom = (r.roomNumber || '').trim();
  map.set(r.id, {
    id: r.id,
    fullName: r.fullName,
    roomNumber: rawRoom
      ? rawRoom.toLowerCase().startsWith('room')
        ? rawRoom
        : `Room ${rawRoom}`
      : 'Room Unassigned',
    bedNumber: r.bedNumber || '',
  });
}

return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [rawResidents, assignedResidents]);

const [form, setForm] = useState<IncidentDetailsFormState>(() => {
  const incidentDate = getUkDateString(new Date(), true);
  const incidentTime = formatUkTime(new Date());
  return {
    incidentName: '',
    incidentDate,
    incidentTime,
    residentName: '',
    roomNumber: '',
    bedNumber: '',
    category: '',
    harmLevel: '',
    severity: '',
    escalationNotes: '',
  };
});

const handleFormChange = <K extends keyof IncidentDetailsFormState>(
  key: K,
  value: IncidentDetailsFormState[K]
) => {
  setForm((prev) => ({ ...prev, [key]: value }));
};

const handleSubmit = async (data: {
  actions: string[];
  notes: string;
  attachments: IncidentAttachment[];
}) => {
  const trimmedTitle = form.incidentName.trim();
  if (!trimmedTitle) {
    Alert.alert('Required Field', 'Please enter an incident name or title.');
    return;
  }
  if (!form.residentName) {
    Alert.alert('Required Field', 'Please select the affected person supported.');
    return;
  }
  if (!form.category) {
    Alert.alert('Required Field', 'Please select an incident category.');
    return;
  }

  const selectedResident = residentOptions.find((r) => r.fullName === form.residentName);
  const severityVal =
    form.severity === 'Critical' || form.severity === 'High'
      ? 'High'
      : form.severity === 'Low'
        ? 'Low'
        : 'Medium';

  const maxAllowedUkDate = getUkDateString(new Date(), true);
  const normalizedSelectedDate = normalizeToIsoDate(form.incidentDate);
  const finalIncidentDate =
    normalizedSelectedDate > maxAllowedUkDate ? maxAllowedUkDate : normalizedSelectedDate;

  const payload = {
    title: trimmedTitle,
    category: form.category,
    incidentDate: finalIncidentDate,
    incidentTime: form.incidentTime || formatUkTime(new Date()),
    residentId: selectedResident?.id || undefined,
    roomNumber: form.roomNumber || undefined,
    bedNumber: form.bedNumber || undefined,
    harmLevel: form.harmLevel || undefined,
    severity: severityVal,
    priority: severityVal,
    immediateActions: data.actions.length > 0 ? data.actions : undefined,
    notes: data.notes.trim() || undefined,
    attachments: [] as Array<Record<string, unknown>>,
  };

  try {
    setIsSubmitting(true);
    const createdIncident = await makeMobileApiCall<{ id: string }>(
      CREATE_INCIDENT,
      payload
    );

    if (createdIncident?.id && data.attachments.length > 0) {
      const uploadedAttachments = await Promise.all(
        data.attachments.map(async (att) => {
          const formData = new FormData();
          await appendFileToFormData(formData, 'file', att);
          const uploaded = await makeMobileApiCall<{
            id: string;
            name: string;
            type: 'image' | 'pdf';
            fileUrl: string;
            previewUrl?: string;
          }>(UPLOAD_INCIDENT_ATTACHMENT, formData, {}, { id: createdIncident.id });
          return {
            ...uploaded,
            timestamp: att.dateStr,
          };
        })
      );

      if (uploadedAttachments.length > 0) {
        await makeMobileApiCall(
          UPDATE_INCIDENT,
          { attachments: uploadedAttachments },
          {},
          { id: createdIncident.id }
        );
      }
    }

    Alert.alert(
      'Incident Logged',
      `Incident "${trimmedTitle}" for ${form.residentName} has been recorded and submitted to Duty Manager.`,
      [
        {
          text: 'Return to Dashboard',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/' as Href);
            }
          },
        },
      ]
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unable to submit incident report at this time';
    Alert.alert('Submission Error', msg);
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <ScreenWrapper scrollable>
    {/* Screen Title & Subtitle Header */}
    <View className="pt-2 pb-4">
      <View className="flex-row items-center gap-2 mb-0.5">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/' as Href))}
          activeOpacity={0.7}
          className="w-9 h-9 rounded-full bg-surface items-center justify-center -ml-1"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color="#141F1E" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Report Incident</Text>
      </View>
      <Text className="text-sm text-text-secondary ml-10">Report incidents to Manager</Text>
    </View>

    {/* 1. Incident Details Section Card */}
    <IncidentDetailsCard
      form={form}
      onChange={handleFormChange}
      residents={residentOptions}
    />

    {/* 2. Actions, Notes, Attachments, and Primary Button */}
    <IncidentActionsAndAttachments
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  </ScreenWrapper>
);
}
