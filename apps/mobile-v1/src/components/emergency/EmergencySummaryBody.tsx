import React from 'react';
import { View } from 'react-native';
import { AlertTriangle, HeartPulse } from 'lucide-react-native';
import type { EmergencyResidentSummaryDTO } from '@repo/schema';
import { Avatar, Card, Text } from '../../presentation/components/common';
import { formatUkDate, formatUkDateTime } from '../../lib/date';
import { CallRow, SummaryField, SummarySection, TagList } from './EmergencySummaryParts';

interface Props {
  summary: EmergencyResidentSummaryDTO;
}

function vital(label: string, value: number | null, unit = ''): string | null {
  return value === null ? null : `${label} ${value}${unit}`;
}

export function EmergencySummaryBody({ summary }: Props) {
  const location = [
    summary.roomNumber ? `Room ${summary.roomNumber}` : null,
    summary.bedLabel,
    summary.wingName,
  ]
    .filter(Boolean)
    .join(' • ');
  const hasAnyAllergy =
    summary.allergies.medication.length +
      summary.allergies.food.length +
      summary.allergies.other.length >
    0;
  const obs = summary.latestObservation;
  const vitals = obs
    ? [
        vital('Temp', obs.temp, '°C'),
        vital('Pulse', obs.pulse, ' bpm'),
        obs.bpSystolic !== null && obs.bpDiastolic !== null
          ? `BP ${obs.bpSystolic}/${obs.bpDiastolic}`
          : null,
        vital('Resp', obs.respiration, '/min'),
        vital('SpO2', obs.spo2, '%'),
        obs.consciousness ? `ACVPU ${obs.consciousness}` : null,
      ].filter((v): v is string => v !== null)
    : [];

  return (
    <View>
      <Card className="mb-3">
        <View className="flex-row items-center">
          <View className="mr-3">
            <Avatar name={summary.fullName} imageUrl={summary.photoUrl} size="xl" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">{summary.fullName}</Text>
            {summary.preferredName ? (
              <Text className="text-sm text-slate-500">Prefers: {summary.preferredName}</Text>
            ) : null}
            <Text className="text-sm text-slate-600 mt-0.5">
              {[summary.gender, summary.age !== null ? `${summary.age} yrs` : null]
                .filter(Boolean)
                .join(' • ') || 'Demographics not recorded'}
            </Text>
            {location ? <Text className="text-sm text-slate-600">{location}</Text> : null}
          </View>
        </View>
        <View className="flex-row gap-4 mt-3">
          <View className="flex-1">
            <SummaryField label="Date of birth" value={formatUkDate(summary.dob)} />
          </View>
          <View className="flex-1">
            <SummaryField label="NHS number" value={summary.nhsNumber} />
          </View>
        </View>
      </Card>

      <View
        className={`flex-row items-center gap-2 rounded-md border p-3 mb-3 ${
          summary.dnacpr ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-100'
        }`}
      >
        <HeartPulse size={20} color={summary.dnacpr ? '#7E22CE' : '#64748B'} />
        <Text
          className={`text-base font-bold ${summary.dnacpr ? 'text-purple-800' : 'text-slate-700'}`}
        >
          {summary.dnacpr ? 'DNACPR / ReSPECT in place' : 'Full resuscitation (no DNACPR recorded)'}
        </Text>
      </View>

      <SummarySection title="Allergies" tone={hasAnyAllergy ? 'danger' : 'default'}>
        {hasAnyAllergy ? (
          <View className="gap-2">
            <View className="flex-row items-center gap-1.5">
              <AlertTriangle size={16} color="#BE123C" />
              <Text className="text-sm font-bold text-rose-700">Check before any treatment</Text>
            </View>
            <Text className="text-xs font-semibold text-slate-500">Drug</Text>
            <TagList items={summary.allergies.medication} emptyText="None recorded" tone="danger" />
            <Text className="text-xs font-semibold text-slate-500">Food</Text>
            <TagList items={summary.allergies.food} emptyText="None recorded" tone="danger" />
            <Text className="text-xs font-semibold text-slate-500">Other</Text>
            <TagList items={summary.allergies.other} emptyText="None recorded" tone="danger" />
          </View>
        ) : (
          <Text className="text-base text-slate-700">No known allergies recorded</Text>
        )}
      </SummarySection>

      <SummarySection title="Conditions">
        <SummaryField label="Primary diagnosis" value={summary.primaryDiagnosis} />
        <Text className="text-xs font-semibold text-slate-500 mb-1">Secondary diagnoses</Text>
        <TagList items={summary.secondaryDiagnoses} emptyText="None recorded" />
        <Text className="text-xs font-semibold text-slate-500 mt-2 mb-1">Chronic conditions</Text>
        <TagList items={summary.chronicConditions} emptyText="None recorded" />
      </SummarySection>

      <SummarySection title="Current medications (view only)">
        {summary.medications.length === 0 ? (
          <Text className="text-sm text-slate-500">No active medications recorded</Text>
        ) : (
          summary.medications.map((med) => (
            <View
              key={`${med.drugName}-${med.dose}-${med.form}`}
              className="py-2 border-b border-slate-100"
            >
              <Text className="text-base font-semibold text-slate-900">{med.drugName}</Text>
              <Text className="text-sm text-slate-600">
                {[med.dose, med.form, med.times.length ? med.times.join(', ') : null]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
              {med.instructions ? (
                <Text className="text-sm text-slate-500 mt-0.5">{med.instructions}</Text>
              ) : null}
            </View>
          ))
        )}
      </SummarySection>

      <SummarySection title="Latest observations">
        {obs ? (
          <View>
            <Text className="text-3xl font-bold text-slate-900">
              NEWS2 {obs.news2Score ?? '—'}
            </Text>
            <Text className="text-sm text-slate-500 mb-2">
              Recorded {formatUkDateTime(obs.timestamp)}
            </Text>
            <Text className="text-base text-slate-800">
              {vitals.length ? vitals.join('  •  ') : 'No vital signs recorded'}
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-slate-500">No observations recorded</Text>
        )}
      </SummarySection>

      <SummarySection title="Emergency contacts">
        {summary.emergencyContacts.length === 0 ? (
          <Text className="text-sm text-slate-500">No contacts recorded</Text>
        ) : (
          summary.emergencyContacts.map((contact) => (
            <CallRow
              key={`${contact.name}-${contact.phone ?? ''}`}
              name={contact.name}
              detail={[contact.relationship, contact.isPrimary ? 'Primary contact' : null]
                .filter(Boolean)
                .join(' • ')}
              phone={contact.phone}
            />
          ))
        )}
      </SummarySection>

      <SummarySection title="GP & care providers">
        {summary.gp ? (
          <CallRow
            name={summary.gp.name ?? 'GP'}
            detail={summary.gp.practice ?? 'General practitioner'}
            phone={summary.gp.phone}
          />
        ) : (
          <Text className="text-sm text-slate-500">No GP recorded</Text>
        )}
        {summary.careProviders.map((provider) => (
          <CallRow
            key={provider.role}
            name={provider.name ?? provider.role}
            detail={provider.name ? provider.role : null}
            phone={provider.phone}
          />
        ))}
      </SummarySection>

      <SummarySection title="Mobility, diet & communication">
        <SummaryField label="Mobility" value={summary.mobility.summary} />
        <Text className="text-xs font-semibold text-slate-500 mb-1">Mobility aids</Text>
        <TagList items={summary.mobility.aids} emptyText="None recorded" />
        <View className="mt-2">
          <SummaryField label="Falls risk" value={summary.mobility.fallRisk} />
          <SummaryField label="Diet" value={summary.diet.dietType} />
          <SummaryField label="Texture modification" value={summary.diet.textureModification} />
        </View>
        <Text className="text-xs font-semibold text-slate-500 mb-1">Dietary requirements</Text>
        <TagList items={summary.diet.requirements} emptyText="None recorded" />
        <View className="mt-2">
          <SummaryField label="Communication" value={summary.communication.ability} />
          <SummaryField
            label="Language"
            value={
              summary.communication.preferredLanguage
                ? `${summary.communication.preferredLanguage}${
                    summary.communication.interpreterRequired ? ' (interpreter required)' : ''
                  }`
                : null
            }
          />
        </View>
        <Text className="text-xs font-semibold text-slate-500 mb-1">Sensory aids</Text>
        <TagList items={summary.communication.sensoryAids} emptyText="None recorded" />
      </SummarySection>
    </View>
  );
}
