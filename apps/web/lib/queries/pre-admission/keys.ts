export const preAdmissionKeys = {
  all: ["pre-admission"] as const,
  detail: (residentId: string) =>
    [...preAdmissionKeys.all, "detail", residentId] as const,
  versions: (residentId: string) =>
    [...preAdmissionKeys.all, "versions", residentId] as const,
};
