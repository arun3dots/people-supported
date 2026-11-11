"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, Copy, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Spinner,
  Text,
} from "@repo/ui/components/ui";
import {
  useGetRiskTemplatesQuery,
  useDeleteRiskTemplateMutation,
  type RiskTemplateResponse,
} from "../../../../../lib/queries/risk";
import { useAuth } from "../../../../../lib/context/AuthContext";
import { RiskTemplateForm } from "./components/RiskTemplateForm";

export default function RiskTemplatesPage() {
  const { user } = useAuth();
  const userRole = user?.roleName?.toUpperCase();
  const canManage =
    userRole === "ADMIN" ||
    userRole === "SUPERADMIN" ||
    userRole === "MANAGER" ||
    !!user?.permissions?.riskAssessments?.manageTemplates;

  const { data: templates, isLoading } = useGetRiskTemplatesQuery();
  const remove = useDeleteRiskTemplateMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RiskTemplateResponse | null>(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const list = templates ?? [];

  const handleEdit = (t: RiskTemplateResponse) => {
    setEditing(t);
    setIsDuplicateMode(false);
    setFormOpen(true);
  };

  const handleDuplicate = (t: RiskTemplateResponse) => {
    setEditing(t);
    setIsDuplicateMode(true);
    setFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditing(null);
    setIsDuplicateMode(false);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <Text size={'xl'} weight={'bold'}>
            Risk Assessment Templates
          </Text>
          <Text size={'xs'} weight={'regular'} className="text-slate-500">
            Reusable risk and hazard templates that clinical and care staff can select when conducting resident risk assessments.
          </Text>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={handleCreateNew}
            className="rounded-xl h-10 px-4 text-md font-semibold flex items-center gap-2 shrink-0"
          >
            <Plus className="size-4" />
            <span>New Template</span>
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center">
            <AlertTriangle className="size-8 mx-auto text-slate-400 mb-2" />
            <Text size="sm" weight="semibold" className="text-slate-700">
              No risk templates found
            </Text>
            <Text size="sm" weight="regular" className="text-slate-400 mt-1">
              Create a custom template or contact support to seed default templates.
            </Text>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((t) => (
            <Card
              key={t.id}
              className="rounded-2xl border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <CardTitle className="text-md font-bold text-slate-900 truncate">
                        {t.name}
                      </CardTitle>
                      {t.isSystem ? (
                        <Badge variant="secondary" state="inactive" className="gap-1 px-2.5 py-0.5 shadow-none">
                          <ShieldCheck className="size-3 text-emerald-600" /> System
                        </Badge>
                      ) : (
                        <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <Text size="sm" weight="medium" className="text-slate-500">
                      {t.category === "Behavioral" ? "Behavioural" : t.category} · {t.tool ?? "General Assessment"} · Risk: L{t.defaultLikelihood} × S{t.defaultSeverity}
                    </Text>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0 flex-1 flex flex-col justify-between">
                <Text size="sm" weight="regular" className="text-slate-600 line-clamp-3 leading-relaxed">
                  {t.hazardDescription}
                </Text>

                {t.defaultControls && t.defaultControls.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1">
                    <Text size="sm" weight="semibold" className="text-slate-700">
                      Standard Controls ({t.defaultControls.length}):
                    </Text>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {t.defaultControls.slice(0, 3).map((c, i) => (
                        <li key={i} className="truncate">
                          <Text size="sm" weight="regular" className="text-slate-500">
                            {c}
                          </Text>
                        </li>
                      ))}
                      {t.defaultControls.length > 3 && (
                        <li className="list-none pt-0.5">
                          <Text size="sm" weight="regular" className="text-slate-400">
                            +{t.defaultControls.length - 3} more controls…
                          </Text>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Card Actions */}
                {canManage && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-auto">
                    {t.isSystem ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(t)}
                        className="h-8 text-md text-slate-700 hover:text-slate-900 rounded-lg gap-1.5"
                      >
                        <Copy className="size-3.5" />
                        <span>Duplicate & Customise</span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(t)}
                          className="h-8 text-md text-slate-700 hover:text-slate-900 rounded-lg gap-1.5"
                        >
                          <Pencil className="size-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Delete risk template "${t.name}"?`)) {
                              remove.mutate(t.id);
                            }
                          }}
                          className="h-8 text-md text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg gap-1.5"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RiskTemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        isDuplicate={isDuplicateMode}
      />
    </div>
  );
}
