import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { type ShiftRequest } from "../../types/shifts";
import { formatUkDate } from "../../utils/uk-date-time";

interface RotaBottomCardsProps {
  weekHours: number;
  shiftCount: number;
  cycleHours: number;
  clockInStatus: string;
  requests: ShiftRequest[];
  onRequestLeave: () => void;
}

export function RotaBottomCards({
  weekHours,
  shiftCount,
  cycleHours,
  clockInStatus,
  requests,
  onRequestLeave,
}: RotaBottomCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-['Outfit',sans-serif]">
      {/* Hours Summary Card */}
      <Card variant="white" className="rounded-2xl border-slate-200/90 p-5 shadow-sm gap-0">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
            Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between sm:justify-start sm:gap-8 text-sm">
              <Text size="sm" variant="muted" className="sm:w-40 shrink-0">
                Scheduled this week
              </Text>
              <Text size="sm" weight="semibold" className="text-slate-900">
                {weekHours} h ({shiftCount} {shiftCount === 1 ? "shift" : "shifts"})
              </Text>
            </div>

            <div className="flex items-baseline justify-between sm:justify-start sm:gap-8 text-sm">
              <Text size="sm" variant="muted" className="sm:w-40 shrink-0">
                Two-week cycle
              </Text>
              <Text size="sm" weight="semibold" className="text-slate-900">
                {cycleHours} h vs 80.5 h contracted
              </Text>
            </div>

            <div className="flex items-baseline justify-between sm:justify-start sm:gap-8 text-sm">
              <Text size="sm" variant="muted" className="sm:w-40 shrink-0">
                Clock-in today
              </Text>
              <Text size="sm" weight="semibold" className="text-slate-900">
                {clockInStatus}
              </Text>
            </div>

            <div className="flex items-baseline justify-between sm:justify-start sm:gap-8 text-sm">
              <Text size="sm" variant="muted" className="sm:w-40 shrink-0">
                Working time
              </Text>
              <Text size="sm" weight="semibold" className="text-slate-900">
                Within 48 h average · rest periods compliant (checked on the Rota page)
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Requests Card */}
      <Card variant="white" className="rounded-2xl border-slate-200/90 p-5 shadow-sm flex flex-col justify-between gap-0">
        <div>
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
              My requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {requests.length === 0 ? (
              <Text size="sm" variant="muted" className="text-slate-500">
                No swap or leave requests.
              </Text>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {requests.slice(0, 4).map((req) => {
                  const state: "success" | "danger" | "warning" =
                    req.status === "Approved"
                      ? "success"
                      : req.status === "Rejected"
                        ? "danger"
                        : "warning";

                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-slate-50/80 border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <Text size="sm" weight="semibold" className="text-slate-800">
                          {req.type === "Leave" ? "Leave" : req.type === "Change" ? "Swap" : "Cover"}
                        </Text>
                        <Text size="sm" variant="muted" className="text-slate-500">
                          {formatUkDate(new Date(req.startTime), { day: "numeric", month: "short" })}
                        </Text>
                      </div>
                      <Badge
                        variant="outline"
                        state={state}
                        className="p-0 px-2.5 py-0.5 text-sm font-semibold rounded-md shadow-none"
                      >
                        {req.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestLeave}
          >
            Submit Request
          </Button>
        </div>
      </Card>
    </div>
  );
}
