import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  Phone,
  Radio,
  Stethoscope,
  Shield,
  ArrowRight,
  Flame,
  Activity,
  Accessibility,
  Utensils,
  UserCheck,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import type { ResidentDetailData, ResidentTimelineItem } from '../../presentation/hooks/useResidentDetail';
import { ResidentActivitiesTimeline } from './ResidentActivitiesTimeline';
import { ResidentObservationsSection } from './ResidentObservationsSection';
import { ResidentFluidIntakeSection } from './ResidentFluidIntakeSection';
import { formatUkDate } from '../../lib/date';

interface Props {
  resident: ResidentDetailData;
  timeline: ResidentTimelineItem[];
  activityError?: string | null;
  onRetryActivities?: () => void;
}

function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'Not recorded';
  const formatted = formatUkDate(dateStr, { day: '2-digit', month: 'short', year: 'numeric' });
  return formatted || 'Not recorded';
}

export function ResidentDetailSections({
  resident,
  timeline,
  activityError,
  onRetryActivities,
}: Props) {
  // Parse emergency contacts from API
  const contacts: Array<{ name: string; phone?: string; relationship?: string }> = [];
  if (Array.isArray(resident.nextOfKin)) {
    resident.nextOfKin.forEach((k) => {
      if (k && typeof k === 'object' && 'name' in k) {
        contacts.push(k as { name: string; phone?: string; relationship?: string });
      }
    });
  } else if (resident.nextOfKin && typeof resident.nextOfKin === 'object' && 'name' in resident.nextOfKin) {
    contacts.push(resident.nextOfKin as { name: string; phone?: string; relationship?: string });
  }

  // Doctor/Physician from API
  const gpName = resident.gpDetails?.gpName || resident.careProfile?.hospitalConsultant || 'Not recorded';
  const gpPractice = resident.gpDetails?.practice || resident.careProfile?.hospitalName || 'Not recorded';
  const gpPhone = resident.gpDetails?.phone || resident.careProfile?.communityNursePhone || 'Not recorded';

  // Insurance details from API
  const insuranceName = resident.profile?.insuranceProvider || 'Not recorded';
  const coverage = resident.admission?.secondaryCoverage || 'Not recorded';
  const policyNo = resident.admission?.insurancePolicyNumber || 'Not recorded';
  const expiryDate = 'Not recorded';

  // Clinical Summary values from API
  const allergy = resident.careProfile?.allergies?.[0] || resident.careProfile?.medicationAllergies?.[0] || 'None recorded';
  const diagnosis = resident.careProfile?.primaryDiagnosis || 'None recorded';
  const mobility = resident.careProfile?.mobility || resident.careProfile?.mobilityAidsUsed?.[0] || 'Not recorded';
  const diet = resident.careProfile?.dietType || resident.careProfile?.dietaryRequirements?.[0] || 'Not recorded';

  // Resident Direct Contact & DOB
  const residentAny = resident as unknown as { phoneNumber?: string; email?: string; profile?: { phoneNumber?: string } };
  const phoneDisplay = residentAny.phoneNumber || residentAny.profile?.phoneNumber || 'Not recorded';
  const dobDisplay = formatDate(resident.dob);
  const emailDisplay = residentAny.email || 'Not recorded';

  return (
    <View className="mb-6">
      {/* 0. Resident Direct Contact & DOB Card */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-primary-light items-center justify-center">
            <UserCheck size={14} color="#4A706A" />
          </View>
          <Text className="text-lg font-bold text-foreground">Contact Details</Text>
        </View>

        <Card className="p-4">
          <View className="flex-row justify-between mb-3">
            <View className="flex-1 pr-2">
              <Text className="text-xs text-muted-foreground mb-0.5">Phone</Text>
              <Text className="text-sm font-bold text-foreground">{phoneDisplay}</Text>
            </View>
            <View className="flex-1 pl-2">
              <Text className="text-xs text-muted-foreground mb-0.5">Date of Birth</Text>
              <Text className="text-sm font-bold text-foreground">{dobDisplay}</Text>
            </View>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground mb-0.5">Email</Text>
            <Text className="text-sm font-bold text-foreground">{emailDisplay}</Text>
          </View>
        </Card>
      </View>

      {/* 1. Emergency Contacts Section */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-primary-light items-center justify-center">
            <Radio size={14} color="#4A706A" />
          </View>
          <Text className="text-lg font-bold text-foreground">Emergency Contacts</Text>
        </View>

        {contacts.length > 0 ? (
          <View className="flex-row gap-2.5">
            {contacts.slice(0, 2).map((contact, idx) => (
              <Card key={idx} className="flex-1 min-w-0 p-3.5">
                <Text className="font-bold text-sm text-foreground mb-1" numberOfLines={1}>
                  {contact.name}
                </Text>
                <View className="flex-row items-center gap-1.5 mb-1 flex-1 min-w-0">
                  <Phone size={12} color="#4A706A" />
                  <Text className="text-xs font-semibold text-foreground flex-1" numberOfLines={1}>
                    {contact.phone || 'Not recorded'}
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {contact.relationship || 'Emergency Contact'}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="p-4">
            <Text className="text-xs text-muted-foreground">No emergency contacts registered on profile.</Text>
          </Card>
        )}
      </View>

      {/* 2. Primary Physician Section */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-primary-light items-center justify-center">
            <Stethoscope size={14} color="#4A706A" />
          </View>
          <Text className="text-lg font-bold text-foreground">Primary Physician</Text>
        </View>

        <Card className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-12 h-12 rounded-full bg-white items-center justify-center">
              <Stethoscope size={20} color="#4A706A" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-md text-foreground leading-tight" numberOfLines={1}>
                {gpName}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                {gpPractice}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-1.5">
                <Phone size={12} color="#4A706A" />
                <Text className="text-xs font-bold text-foreground">{gpPhone}</Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* 3. Insurance Provider Section */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-primary-light items-center justify-center">
            <Shield size={14} color="#4A706A" />
          </View>
          <Text className="text-lg font-bold text-foreground">Insurance Provider</Text>
        </View>

        <Card className="p-4">
          <View className="flex-row justify-between mb-2.5">
            <View className="w-1/2 pr-2">
              <Text className="text-xs text-muted-foreground mb-0.5">Insurance</Text>
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{insuranceName}</Text>
            </View>
            <View className="w-1/2 pl-2">
              <Text className="text-xs text-muted-foreground mb-0.5">Coverage</Text>
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{coverage}</Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View className="w-1/2 pr-2">
              <Text className="text-xs text-muted-foreground mb-0.5">Policy No</Text>
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{policyNo}</Text>
            </View>
            <View className="w-1/2 pl-2">
              <Text className="text-xs text-muted-foreground mb-0.5">Expiry Date</Text>
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{expiryDate}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* 4. Clinical Summary Section */}
      {/* <View className="mb-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-foreground">Clinical Summary</Text>
        </View>

        <View className="flex-row gap-2.5 mb-2.5">
          <View className="flex-1 p-3.5 rounded-2xl bg-clinical-criticalBg items-start">
            <View className="w-7 h-7 rounded-full bg-clinical-critical items-center justify-center mb-1.5">
              <Flame size={14} color="#FFFFFF" />
            </View>
            <Text className="font-bold text-sm text-foreground">Allergies</Text>
            <View className="flex-row items-center justify-between w-full mt-1">
              <Text className="text-xs text-clinical-critical font-medium flex-1 mr-1" numberOfLines={1}>{allergy}</Text>
              <ArrowRight size={12} color="#FF3B2F" />
            </View>
          </View>

          <View className="flex-1 p-3.5 rounded-2xl bg-clinical-infoBg items-start">
            <View className="w-7 h-7 rounded-full bg-clinical-info items-center justify-center mb-1.5">
              <Activity size={14} color="#FFFFFF" />
            </View>
            <Text className="font-bold text-sm text-foreground">Diagnoses</Text>
            <View className="flex-row items-center justify-between w-full mt-1">
              <Text className="text-xs text-clinical-info font-medium flex-1 mr-1" numberOfLines={1}>{diagnosis}</Text>
              <ArrowRight size={12} color="#007AFF" />
            </View>
          </View>
        </View>

        <View className="flex-row gap-2.5">
          <View className="flex-1 p-3.5 rounded-2xl bg-clinical-warningBg items-start">
            <View className="w-7 h-7 rounded-full bg-clinical-warning items-center justify-center mb-1.5">
              <Accessibility size={14} color="#FFFFFF" />
            </View>
            <Text className="font-bold text-sm text-foreground">Mobility</Text>
            <View className="flex-row items-center justify-between w-full mt-1">
              <Text className="text-xs text-clinical-warning font-medium flex-1 mr-1" numberOfLines={1}>{mobility}</Text>
              <ArrowRight size={12} color="#C38C0B" />
            </View>
          </View>

          <View className="flex-1 p-3.5 rounded-2xl bg-clinical-safeBg items-start">
            <View className="w-7 h-7 rounded-full bg-clinical-safe items-center justify-center mb-1.5">
              <Utensils size={14} color="#FFFFFF" />
            </View>
            <Text className="font-bold text-sm text-foreground">Diet</Text>
            <View className="flex-row items-center justify-between w-full mt-1">
              <Text className="text-xs text-clinical-safe font-medium flex-1 mr-1" numberOfLines={1}>{diet}</Text>
              <ArrowRight size={12} color="#1D5E2E" />
            </View>
          </View>
        </View>
      </View> */}

      {/* 5. Clinical Observations (NEWS2 Standard) */}
      {/* <View className="mb-5">
        <ResidentObservationsSection resident={resident} />
      </View> */}

      {/* 6. Fluid & Nutrition Monitoring (CQC Reg 14 & NICE CG32) */}
      {/* <View className="mb-5">
        <ResidentFluidIntakeSection resident={resident} />
      </View> */}

      {/* 7. Activities Timeline */}
      <ResidentActivitiesTimeline
        resident={resident}
        timeline={timeline}
        activityError={activityError}
        onRetry={onRetryActivities}
      />
    </View>
  );
}
