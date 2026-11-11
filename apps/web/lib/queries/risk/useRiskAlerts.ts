import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_RISK_ALERTS_UNREAD,
  MARK_RISK_ALERT_READ,
  GET_RISK_OVERVIEW,
} from "@repo/endpoints";
import { riskKeys } from "./keys";
import type { RiskAlertResponse, RiskOverviewResponse } from "./types";

const ALERT_POLL_MS = 30_000;

export function useGetRiskAlertsUnreadQuery(enabled = true) {
  return useQuery<RiskAlertResponse[]>({
    queryKey: riskKeys.alertsUnread(),
    queryFn: () => makeAPICall<RiskAlertResponse[]>(GET_RISK_ALERTS_UNREAD),
    refetchInterval: enabled ? ALERT_POLL_MS : false,
    enabled,
  });
}

export function useMarkRiskAlertReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      makeAPICall<RiskAlertResponse>(MARK_RISK_ALERT_READ, {}, {}, { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: riskKeys.alertsUnread() });
    },
  });
}

export function useGetRiskOverviewQuery() {
  return useQuery<RiskOverviewResponse>({
    queryKey: riskKeys.overview(),
    queryFn: () => makeAPICall<RiskOverviewResponse>(GET_RISK_OVERVIEW),
  });
}
