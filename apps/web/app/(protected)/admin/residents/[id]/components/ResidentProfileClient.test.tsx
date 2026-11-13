import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResidentProfileClient } from "./ResidentProfileClient";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/admin/residents/res-1",
}));

vi.mock("../../../../../../lib/queries/data-rights/useDataRights", () => ({
  useExportResidentSarMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../../../shared/components/risk-assessment", () => ({
  RiskAssessmentTab: () => <div data-testid="assessment-tab" />,
}));

vi.mock("../../../../../../lib/queries/care-journey", () => ({
  useListNeedCarePlansQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock("../../../../../../lib/context/AuthContext", () => ({
  useAuth: () => ({ user: { roleName: "Admin" } }),
}));

// Mock the query hook
const mockUseGetResidentQuery = vi.fn();
vi.mock("../../../../../../lib/queries/residents", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGetResidentQuery: (id: string) => mockUseGetResidentQuery(id),
    useUpdateResidentOverviewMutation: () => ({
      updateStep1: { mutate: vi.fn(), isPending: false },
      updateStep2: { mutate: vi.fn(), isPending: false },
      updateStep3: { mutate: vi.fn(), isPending: false },
    }),
  };
});

// Mock subcomponents
vi.mock("./ResidentHeroBanner", () => ({
  ResidentHeroBanner: ({ resident }: { resident: { fullName: string } }) => (
    <div data-testid="hero-banner">{resident.fullName}</div>
  ),
}));

vi.mock("./ResidentPageHeader", () => ({
  ResidentPageHeader: ({
    resident,
    onDischargeClick,
  }: {
    resident: { fullName: string };
    onDischargeClick?: () => void;
  }) => (
    <div data-testid="page-header">
      <span>{resident.fullName}</span>
      {onDischargeClick && <button onClick={onDischargeClick}>Discharge</button>}
    </div>
  ),
}));

vi.mock("./record", () => ({
  ResidentRecordOverview: () => <div data-testid="overview-tab">Overview Tab</div>,
  ResidentRecordCarePlans: () => <div data-testid="care-plans-tab" />,
  ResidentRecordTasks: () => <div data-testid="tasks-tab" />,
  ResidentRecordAssessment: () => <div data-testid="assessment-tab" />,
}));

vi.mock("./DischargeResidentDialog", () => ({
  DischargeResidentDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="discharge-dialog">
        Dialog
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

describe("ResidentProfileClient", () => {
  const residentId = "res-1";
  const mockResident = { id: residentId, fullName: "Jane Doe" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders a loading state when query is loading", () => {
    mockUseGetResidentQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(<ResidentProfileClient residentId={residentId} />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders 'Record not found' if query returns null", () => {
    mockUseGetResidentQuery.mockReturnValue({ data: null, isLoading: false });

    render(<ResidentProfileClient residentId={residentId} />);
    expect(screen.getByText("Record not found")).toBeInTheDocument();
  });

  it("renders the hero banner, page header, and overview tab when resident data is present", () => {
    mockUseGetResidentQuery.mockReturnValue({ data: mockResident, isLoading: false });

    render(<ResidentProfileClient residentId={residentId} />);

    expect(screen.getByTestId("hero-banner")).toHaveTextContent("Jane Doe");
    expect(screen.getByTestId("page-header")).toHaveTextContent("Jane Doe");
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
  });

  it("renders ResidentRecordCarePlans for the Support Plan (careplan) tab", () => {
    mockSearchParams = new URLSearchParams("tab=careplan");
    mockUseGetResidentQuery.mockReturnValue({ data: mockResident, isLoading: false });

    render(<ResidentProfileClient residentId={residentId} />);

    expect(screen.getByTestId("care-plans-tab")).toBeInTheDocument();
  });

  it("navigates to the discharge route when the discharge button in header is clicked", () => {
    mockUseGetResidentQuery.mockReturnValue({ data: mockResident, isLoading: false });

    render(<ResidentProfileClient residentId={residentId} />);

    // Click discharge button in header
    fireEvent.click(screen.getByText("Discharge"));

    expect(mockPush).toHaveBeenCalledWith(`/admin/residents/${residentId}/discharge`);
  });
});
