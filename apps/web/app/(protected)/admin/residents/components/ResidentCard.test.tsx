import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResidentCard } from "./ResidentCard";
import type { Resident } from "../../../../../lib/types/resident";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock Auth Context
const mockUseAuth = vi.fn();
vi.mock("../../../../../lib/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockResident: Resident = {
  id: "res-1",
  tenantId: "tenant-1",
  fullName: "John Doe",
  status: "Active",
  dnarStatus: false,
  fundingType: "Private",
  admissionDate: "2024-01-01",
  bed: {
    id: "bed-1",
    roomId: "room-1",
    wingId: "wing-1",
    branchId: "branch-1",
    status: "Occupied",
    number: "B1",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    room: {
      id: "room-1",
      roomNumber: "101",
    },
    branchName: "Maple Branch",
    wingName: "Oak Wing",
  },
  keyworker: {
    id: "kw-1",
    fullName: "Jane Smith",
  },
  dob: "1945-05-12",
  nhsNumber: "123-456-7890",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

describe("ResidentCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { roleName: "Admin" } });
  });

  it("renders resident information correctly", () => {
    render(<ResidentCard resident={mockResident} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/Room 101/)).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText("DNAR")).not.toBeInTheDocument();
    expect(screen.queryByText("High Risk")).not.toBeInTheDocument();
  });

  it("navigates to the resident profile from the card and name link", () => {
    const { container } = render(<ResidentCard resident={mockResident} />);

    expect(screen.getByRole("link", { name: "John Doe" })).toHaveAttribute(
      "href",
      "/admin/residents/res-1",
    );

    const card = container.querySelector('[data-slot="card"]');
    expect(card).not.toBeNull();
    if (card) fireEvent.click(card);
    expect(pushMock).toHaveBeenCalledWith("/admin/residents/res-1");
  });

  it("handles empty optional fields like room or keyworker gracefully", () => {
    const incompleteResident: Resident = {
      ...mockResident,
      bed: undefined,
      keyworker: undefined,
    };
    render(<ResidentCard resident={incompleteResident} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/Unassigned \(N\/A\)/)).toBeInTheDocument();
  });

  it("displays DNAR and High Risk badges when set", () => {
    const highRiskResident: Resident = {
      ...mockResident,
      dnarStatus: true,
    };
    render(<ResidentCard resident={highRiskResident} hasActiveHighRisk />);

    expect(screen.getByText("DNAR")).toBeInTheDocument();
    expect(screen.getByText("High Risk")).toBeInTheDocument();
  });
});
