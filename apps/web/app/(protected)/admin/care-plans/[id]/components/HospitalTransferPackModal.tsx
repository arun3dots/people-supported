"use client";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { useGetHospitalTransferPackQuery } from "../../../../../../lib/queries/care-plan";
import { Printer, AlertCircle, Heart, Phone, Building2, User, Pill, Activity, ShieldCheck } from "lucide-react";

interface HospitalTransferPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string;
}

export function HospitalTransferPackModal({
  isOpen,
  onClose,
  residentId,
}: HospitalTransferPackModalProps) {
  const { data: pack, isLoading, isError } = useGetHospitalTransferPackQuery(residentId, isOpen);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Printable Transfer Pack Container */}
        <div className="p-6 space-y-5 print:p-0 print:m-0 bg-white" id="hospital-transfer-pack">
          {/* Header Banner - Emergency RedBag Standard */}
          <div className="bg-red-700 text-white p-4 rounded-xl flex items-center justify-between print:rounded-none">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-white text-white" />
                <h1 className="text-base font-bold tracking-tight uppercase">
                  NHS Hospital Transfer Pack (e-RedBag)
                </h1>
              </div>
              <p className="text-md text-red-100">
                Statutory Care Home Transfer Document • NICE & CQC Reg 12 Compliant
              </p>
            </div>
            <div className="text-right text-md">
              <span className="block font-mono font-semibold">
                {pack?.generatedAt ? new Date(pack.generatedAt).toLocaleDateString("en-GB") : ""}
              </span>
              <span className="text-red-200 text-md">Emergency Transfer</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500 text-md">
              Compiling transfer pack data from electronic records...
            </div>
          ) : isError || !pack ? (
            <div className="text-center py-8 text-red-600 text-md">
              Failed to load transfer pack data.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top Details: Resident & Care Home */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resident Box with NHS Number */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-md">{pack.resident.fullName}</span>
                    {pack.resident.preferredName && (
                      <span className="text-slate-500">Known as: &quot;{pack.resident.preferredName}&quot;</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-slate-700">
                    <span>DOB: <strong>{pack.resident.dateOfBirth ? String(pack.resident.dateOfBirth).split("T")[0] : "Not recorded"}</strong></span>
                    <span>Gender: <strong>{pack.resident.gender || "Not recorded"}</strong></span>
                    <span className="col-span-2">
                      Room: <strong>{pack.resident.roomNumber || "Not allocated"}</strong>
                    </span>
                  </div>
                  {/* NHS Number Box */}
                  <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-center mt-1">
                    <span className="text-md text-indigo-700 block uppercase tracking-wider font-semibold">
                      NHS Number
                    </span>
                    <span className="font-mono text-md font-bold text-indigo-950 tracking-wider">
                      {pack.resident.nhsNumber || "NOT RECORDED"}
                    </span>
                  </div>
                </div>

                {/* Care Home Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-md">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{pack.careHome.name}</span>
                  </div>
                  <p className="text-slate-600">{pack.careHome.address}</p>
                  <div className="pt-1 space-y-0.5 text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Phone: <strong>{pack.careHome.phone}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Manager: <strong>{pack.careHome.registeredManager}</strong></span>
                    </div>
                  </div>
                  {pack.emergencyContacts.length > 0 && (
                    <div className="pt-1 text-md text-slate-600 border-t border-slate-200 mt-1">
                      <strong>Next of Kin:</strong> {pack.emergencyContacts[0]?.name} ({pack.emergencyContacts[0]?.relationship}) — {pack.emergencyContacts[0]?.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Legal & Directives Banner (Critical for Paramedics & ED) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-md">
                {/* DNACPR Status */}
                <div
                  className={`p-3 rounded-xl border ${pack.legalDirectives.dnacprInPlace
                    ? "bg-red-50 border-red-300 text-red-900"
                    : "bg-emerald-50 border-emerald-300 text-emerald-900"
                    }`}
                >
                  <span className="font-bold text-md uppercase block">Resuscitation Status</span>
                  <span className="text-md font-extrabold block mt-0.5">
                    {pack.legalDirectives.dnacprInPlace ? "DNACPR IN PLACE" : "FOR FULL RESUSCITATION"}
                  </span>
                  <span className="text-md block mt-1">
                    {pack.legalDirectives.dnacprLocation || "Physical form in care file"}
                  </span>
                </div>

                {/* Mental Capacity */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                  <span className="font-bold text-md uppercase block">Mental Capacity (MCA)</span>
                  <span className="text-md font-semibold block mt-0.5">
                    {pack.legalDirectives.hasCapacity ? "Has Capacity" : "Lacks Capacity (Best Interests)"}
                  </span>
                  <span className="text-md text-slate-500 block mt-1">
                    {pack.legalDirectives.lpaHealthAndWelfareName
                      ? `LPA: ${pack.legalDirectives.lpaHealthAndWelfareName}`
                      : "No registered LPA"}
                  </span>
                </div>

                {/* DoLS Status */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                  <span className="font-bold text-md uppercase block">DoLS Safeguard</span>
                  <span className="text-md font-semibold block mt-0.5">
                    {pack.legalDirectives.dolsInPlace ? "DoLS Authorised" : "No Active DoLS"}
                  </span>
                  <span className="text-md text-slate-500 block mt-1">
                    {pack.legalDirectives.dolsSupervisoryBody || "None"}
                  </span>
                </div>
              </div>

              {/* Latest Vitals / NEWS2 Snapshot */}
              {pack.latestVitals && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      <span>Latest Recorded Vitals & NEWS2</span>
                    </div>
                    {pack.latestVitals.news2Score !== null && (
                      <Badge className="bg-indigo-600 text-white text-md">
                        NEWS2 Score: {pack.latestVitals.news2Score}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-slate-700">
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-md text-slate-400 block">Consciousness</span>
                      <strong className="text-md">{pack.latestVitals.consciousness || "Alert"}</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-md text-slate-400 block">Blood Pressure</span>
                      <strong className="text-md">{pack.latestVitals.bloodPressure || "--"}</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-md text-slate-400 block">Pulse Rate</span>
                      <strong className="text-md">{pack.latestVitals.pulse ? `${pack.latestVitals.pulse} bpm` : "--"}</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-md text-slate-400 block">SpO2</span>
                      <strong className="text-md">{pack.latestVitals.spo2 ? `${pack.latestVitals.spo2}%` : "--"}</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-md text-slate-400 block">Temperature</span>
                      <strong className="text-md">{pack.latestVitals.temperature ? `${pack.latestVitals.temperature}°C` : "--"}</strong>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-md text-slate-400 block">Respiration</span>
                      <strong className="text-md">{pack.latestVitals.respirationRate ? `${pack.latestVitals.respirationRate}/min` : "--"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Baseline Care Profile */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-md text-slate-700">
                <span className="font-bold text-slate-900 block text-md">
                  Baseline Care & Communication Profile
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-md">
                  <div><strong>Mobility:</strong> {pack.baselineCare.mobility}</div>
                  <div><strong>Transfers:</strong> {pack.baselineCare.transferAssistance}</div>
                  <div><strong>Diet:</strong> {pack.baselineCare.nutrition} ({pack.baselineCare.iddsiFood})</div>
                  <div><strong>Fluids:</strong> {pack.baselineCare.iddsiFluid}</div>
                  <div><strong>Continence:</strong> {pack.baselineCare.continence}</div>
                  <div><strong>Skin Integrity:</strong> {pack.baselineCare.skinIntegrity}</div>
                  <div><strong>Communication:</strong> {pack.baselineCare.communicationNeeds}</div>
                  <div><strong>Sensory:</strong> {pack.baselineCare.sensoryImpairments}</div>
                </div>
              </div>

              {/* Active Medications (eMAR Snapshot) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-md">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Pill className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Current Active Medications ({pack.activeMedications.length})</span>
                </div>
                {pack.activeMedications.length === 0 ? (
                  <span className="text-slate-500 text-md">No active regular medications charted.</span>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-md text-left">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="p-1.5 font-semibold">Medication</th>
                          <th className="p-1.5 font-semibold">Dose</th>
                          <th className="p-1.5 font-semibold">Frequency</th>
                          <th className="p-1.5 font-semibold">Route</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {pack.activeMedications.map((m, i) => (
                          <tr key={i} className="text-slate-800">
                            <td className="p-1.5 font-medium">{m.drugName}</td>
                            <td className="p-1.5">{m.dose}</td>
                            <td className="p-1.5">{m.frequency}</td>
                            <td className="p-1.5">{m.route || "Oral"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="text-md">
            Close
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={!pack}
            className="bg-red-700 hover:bg-red-800 text-white text-md gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
