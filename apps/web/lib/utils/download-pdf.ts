export async function downloadCarePlanPdf(
  carePlanId: string,
  residentName?: string,
): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";
  const cleanBase = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
  const url = `${cleanBase}/care-plan/${carePlanId}/pdf`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: "Failed to generate PDF" }));
    throw new Error(errorBody.message || "Failed to download Care Plan PDF");
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const sanitizedName = residentName
    ? residentName.replace(/[^a-zA-Z0-9_-]/g, "_")
    : "Resident";

  anchor.href = blobUrl;
  anchor.download = `Person_Centred_Care_Plan_${sanitizedName}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);
}
