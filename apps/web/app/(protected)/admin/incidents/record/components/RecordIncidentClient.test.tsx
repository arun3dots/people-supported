import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecordIncidentClient } from "./RecordIncidentClient";
import type { Resident } from "../../../../../../lib/types/resident";

const mockPush = vi.fn();
const mockMutateAsync = vi.fn();
const mockToast = vi.fn();
const mockUseGetResidentsQuery = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@repo/ui/components/ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    toast: (...args: unknown[]) => mockToast(...args),
  };
});

vi.mock("../../../../../../lib/queries/residents", () => ({
  useGetResidentsQuery: (filters?: Record<string, unknown>) =>
    mockUseGetResidentsQuery(filters),
}));

vi.mock("../../../../../../lib/queries/incidents", () => ({
  useCreateIncidentMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("../../../../../shared/components/body-map/ImagePreviewModal", () => ({
  ImagePreviewModal: () => null,
}));

const activeTenantA: Resident = {
  id: "tenant-1",
  fullName: "Alice Active",
  status: "Active",
  isDraft: false,
  bed: {
    id: "bed-1",
    number: "B1",
    room: { id: "room-1", roomNumber: "104" },
  },
} as Resident;

const activeTenantB: Resident = {
  id: "tenant-2",
  fullName: "Bob Active",
  status: "Active",
  isDraft: true,
} as Resident;

const inactiveResidents: Resident[] = [
  { id: "draft-1", fullName: "Draft Person", status: "Draft", isDraft: true } as Resident,
  { id: "discharged-1", fullName: "Discharged Person", status: "Discharged", isDraft: false } as Resident,
  { id: "deceased-1", fullName: "Deceased Person", status: "Deceased", isDraft: false } as Resident,
  { id: "hospital-1", fullName: "Hospitalized Person", status: "Hospitalized", isDraft: false } as Resident,
  { id: "transferred-1", fullName: "Transferred Person", status: "Transferred", isDraft: false } as Resident,
];

describe("RecordIncidentClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetResidentsQuery.mockImplementation(
      (filters?: Record<string, unknown>) => {
        if (filters?.assignedOnly) {
          return { data: [activeTenantA] };
        }
        return {
          data: [activeTenantA, activeTenantB, ...inactiveResidents],
        };
      },
    );
    mockMutateAsync.mockResolvedValue({ id: "inc-123" });
  });

  it("uses Tenant copy, removes Bed Number, and queries strictly active residents", () => {
    render(<RecordIncidentClient />);

    expect(screen.getByText(/Tenant Name/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bed Number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Resident Name/i)).not.toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        "Record the tenant's initial condition and assessment...",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Provide detailed clinical and operational notes on what occurred, tenant demeanor, and subsequent steps taken...",
      ),
    ).toBeInTheDocument();

    expect(mockUseGetResidentsQuery).toHaveBeenCalledWith({
      assignedOnly: true,
      status: "Active",
    });
    expect(mockUseGetResidentsQuery).toHaveBeenCalledWith({
      all: true,
      includeAll: true,
      status: "Active",
    });
  });

  it("loads only active tenants in Tenant Name dropdown and excludes non-active statuses", () => {
    render(<RecordIncidentClient />);

    const [tenantSelect] = screen.getAllByRole("combobox");
    expect(tenantSelect).toBeDefined();
    // Combobox 0 = Tenant Name
    fireEvent.click(tenantSelect!);

    expect(screen.getByRole("option", { name: "Alice Active" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bob Active" })).toBeInTheDocument();

    expect(
      screen.queryByRole("option", { name: "Draft Person" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Discharged Person" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Deceased Person" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Hospitalized Person" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Transferred Person" }),
    ).not.toBeInTheDocument();
  });

  it("requires Tenant Name before submitting and saves complete incident without bedNumber", async () => {
    render(<RecordIncidentClient />);

    fireEvent.change(screen.getByLabelText(/Incident Name/i), {
      target: { value: "Fall in Lounge" },
    });

    // Try submitting before selecting Tenant Name
    fireEvent.click(screen.getByRole("button", { name: /Save Incident/i }));
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        description: "Please select a Tenant Name",
      }),
    );

    // Select active tenant Alice Active (auto-populates Room 104)
    const [tenantSelect, roomSelect, categorySelect, harmSelect, severitySelect] =
      screen.getAllByRole("combobox");
    expect(tenantSelect).toBeDefined();
    expect(roomSelect).toBeDefined();
    expect(categorySelect).toBeDefined();
    expect(harmSelect).toBeDefined();
    expect(severitySelect).toBeDefined();

    fireEvent.click(tenantSelect!);
    fireEvent.click(screen.getByRole("option", { name: "Alice Active" }));
    expect(roomSelect!).toHaveTextContent("Room 104");

    // Select Category, Harm Level, Severity
    fireEvent.click(categorySelect!);
    fireEvent.click(screen.getByRole("option", { name: "Fall" }));

    fireEvent.click(harmSelect!);
    fireEvent.click(
      screen.getByRole("option", { name: "Level 2 (Low Harm)" }),
    );

    fireEvent.click(severitySelect!);
    fireEvent.click(screen.getByRole("option", { name: "Medium" }));

    fireEvent.click(screen.getByRole("button", { name: /Save Incident/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    const firstCall = mockMutateAsync.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const submittedPayload = firstCall![0] as Record<string, unknown>;
    expect(submittedPayload).toMatchObject({
      title: "Fall in Lounge",
      residentId: "tenant-1",
      roomNumber: "104",
      category: "Fall",
      harmLevel: "Level 2",
      severity: "Medium",
      priority: "Medium",
    });
    expect(submittedPayload).not.toHaveProperty("bedNumber");

    expect(mockPush).toHaveBeenCalledWith("/admin/incidents");
  });
});
