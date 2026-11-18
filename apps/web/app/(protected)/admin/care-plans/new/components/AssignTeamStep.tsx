"use client";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Text,
  Input,
  Checkbox,
} from "@repo/ui/components/ui";

interface AssignTeamStepProps {
  primaryDoctorId: string;
  setPrimaryDoctorId: (val: string) => void;
  secondaryDoctorId: string;
  setSecondaryDoctorId: (val: string) => void;
  authorRole?: string;
  setAuthorRole?: (val: string) => void;
  managerApproverId?: string;
  setManagerApproverId?: (val: string) => void;
  clinicalApproverId?: string;
  setClinicalApproverId?: (val: string) => void;
  residentAgreed?: boolean;
  setResidentAgreed?: (val: boolean) => void;
  legalConsentBasis?: string;
  setLegalConsentBasis?: (val: string) => void;
  representativeName?: string;
  setRepresentativeName?: (val: string) => void;
  staffList: Array<{ id: string; fullName: string }>;
}

export function AssignTeamStep({
  primaryDoctorId,
  setPrimaryDoctorId,
  secondaryDoctorId,
  setSecondaryDoctorId,
  authorRole = "SeniorCarer",
  setAuthorRole,
  managerApproverId = "",
  setManagerApproverId,
  clinicalApproverId = "",
  setClinicalApproverId,
  residentAgreed = true,
  setResidentAgreed,
  legalConsentBasis = "ResidentSelf",
  setLegalConsentBasis,
  representativeName = "",
  setRepresentativeName,
  staffList,
}: AssignTeamStepProps) {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <Text as="h2" size="lg" weight="semibold" className="text-slate-900 tracking-tight">
          Supported Worker Governance &amp; Statutory Consent
        </Text>
        <Text size="md" weight="regular" className="text-slate-500 mt-1">
          Assign the author, Registered Manager approver, and document tenant consultation in accordance with CQC Regulations 9 &amp; 11.
        </Text>
      </div>

      <div className="space-y-5">
        {/* Author Role */}
        {setAuthorRole && (
          <div className="space-y-1.5">
            <Label required>Care Plan Author Role</Label>
            <Select value={authorRole} onValueChange={setAuthorRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SeniorCarer">Senior Carer / Keyworker</SelectItem>
                <SelectItem value="RegisteredNurse">Registered Staff Nurse</SelectItem>
                <SelectItem value="DeputyManager">Deputy Home Manager</SelectItem>
                <SelectItem value="RegisteredManager">Registered Home Manager</SelectItem>
                <SelectItem value="Other">Other Care Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Registered Manager Approver */}
          {setManagerApproverId ? (
            <div className="space-y-1.5">
              <Label required>Sign-off Approver (Registered Manager)</Label>
              <Select value={managerApproverId} onValueChange={setManagerApproverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label required>Lead Approver</Label>
              <Select value={primaryDoctorId} onValueChange={setPrimaryDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clinical Lead / Nurse Sign-off (Optional) */}
          {setClinicalApproverId ? (
            <div className="space-y-1.5">
              <Label>Clinical Lead / Staff Nurse (Optional)</Label>
              <Select value={clinicalApproverId} onValueChange={setClinicalApproverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Secondary Reviewer (Optional)</Label>
              <Select value={secondaryDoctorId} onValueChange={setSecondaryDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Visiting GP / Doctor (Optional in UK Care Homes) */}
        <div className="space-y-1.5">
          <Label>Visiting General Practitioner (GP) / Specialist (Optional)</Label>
          <Select value={primaryDoctorId} onValueChange={setPrimaryDoctorId}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Not Assigned / External GP Practice --</SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statutory Consent & Consultation (CQC Reg 9 & 11) */}
        {setResidentAgreed && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="residentAgreed"
                checked={residentAgreed}
                onCheckedChange={(checked) => setResidentAgreed(!!checked)}
              />
              <Label htmlFor="residentAgreed" className="text-md font-semibold cursor-pointer">
                Tenant was consulted and agreed to this care and support plan (CQC Reg 9)
              </Label>
            </div>

            {!residentAgreed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {setLegalConsentBasis && (
                  <div className="space-y-1">
                    <Label>Legal Consent Basis</Label>
                    <Select value={legalConsentBasis} onValueChange={setLegalConsentBasis}>
                      <SelectTrigger className="h-9 text-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LPA_HealthAndWelfare">LPA (Health &amp; Welfare)</SelectItem>
                        <SelectItem value="CourtOfProtection">Court of Protection Deputy</SelectItem>
                        <SelectItem value="BestInterests_Section4">MCA Section 4 Best Interests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {setRepresentativeName && (
                  <div className="space-y-1">
                    <Label>
                      Representative / Advocate Name
                    </Label>
                    <Input
                      placeholder="e.g. Mary Smith (Daughter / LPA)"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                      className="h-9 text-md"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
