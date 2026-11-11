import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResidentDirectoryClient } from "./ResidentDirectoryClient";
import type { Resident } from "../../../../../lib/types/resident";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/residents",
}));

// Mock next/link
vi.mock("next/link", () => {
  return {
    default: ({ href, children }: { href: string; children: React.ReactNode }) => {
      return <a href={href}>{children}</a>;
    },
  };
});

// Mock hooks
const mockUseGetPaginatedResidentsQuery = vi.fn();
const mockUseGetResidentMetricsQuery = vi.fn();

vi.mock("../../../../../lib/queries/residents", () => ({
  useGetResidentsQuery: () => ({ data: [], isLoading: false }),
  useGetPaginatedResidentsQuery: () => mockUseGetPaginatedResidentsQuery(),
  useGetResidentMetricsQuery: () => mockUseGetResidentMetricsQuery(),
  useGetResidentInsightsQuery: () => ({ data: null }),
}));

vi.mock("../../../../../lib/queries/facility", () => ({
  useGetWingsQuery: () => ({ data: [] }),
  useGetUnitsQuery: () => ({ data: [] }),
  useGetRoomsQuery: () => ({ data: [] }),
}));

const mockUseAuth = vi.fn();
vi.mock("../../../../../lib/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("ResidentDirectoryClient", () => {
  const mockResidents: Resident[] = [
    {
      id: "1",
      fullName: "Alice Smith",
      dob: "1950-01-01",
      nhsNumber: "123-456-7890",
      status: "Active",
      fundingType: "Residential",
      bed: {
        id: "b1",
        roomId: "r1",
        wingId: "w1",
        unitId: "u1",
        status: "Occupied",
        number: "B1",
        room: { id: "r1", roomNumber: "101" },
        unitName: "Maple Unit",
        wingName: "Oak Wing",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      tenantId: "t1",
      dnarStatus: false,
      admissionDate: "2024-01-01",
    } as unknown as Resident,
    {
      id: "2",
      fullName: "Bob Jones",
      dob: "1940-05-15",
      nhsNumber: "987-654-3210",
      status: "Active",
      fundingType: "Nursing",
      bed: {
        id: "b2",
        roomId: "r2",
        wingId: "w1",
        unitId: "u1",
        status: "Occupied",
        number: "B2",
        room: { id: "r2", roomNumber: "102" },
        unitName: "Maple Unit",
        wingName: "Oak Wing",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      tenantId: "t1",
      dnarStatus: false,
      admissionDate: "2024-01-01",
    } as unknown as Resident,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetResidentMetricsQuery.mockReturnValue({ data: null, isLoading: false });
    mockUseAuth.mockReturnValue({ user: { roleName: "Admin" } });
    mockUseGetPaginatedResidentsQuery.mockReturnValue({
      data: {
        data: mockResidents,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });
  });

  it("renders the empty state when there are no residents", () => {
    mockUseGetPaginatedResidentsQuery.mockReturnValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoading: false,
      isError: false,
    });

    render(<ResidentDirectoryClient />);
    expect(screen.getByText("No residents found")).toBeInTheDocument();
  });

  it("renders resident records when data is available", () => {
    mockUseGetPaginatedResidentsQuery.mockReturnValue({
      data: {
        data: mockResidents,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });

    render(<ResidentDirectoryClient />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("opens the resident profile when a directory row is clicked", () => {
    render(<ResidentDirectoryClient />);

    fireEvent.click(screen.getByRole("row", { name: /Alice Smith/ }));

    expect(pushMock).toHaveBeenCalledWith("/admin/residents/1");
  });

  it("shows the Admit Resident button for Admin role", () => {
    mockUseGetPaginatedResidentsQuery.mockReturnValue({
      data: {
        data: mockResidents,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });
    mockUseAuth.mockReturnValue({ user: { roleName: "Admin" } });

    render(<ResidentDirectoryClient />);
    expect(screen.getByText("Admit Resident")).toBeInTheDocument();
  });

  it("hides the Admit Resident button for Carer role", () => {
    mockUseGetPaginatedResidentsQuery.mockReturnValue({
      data: {
        data: mockResidents,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });
    mockUseAuth.mockReturnValue({ user: { roleName: "Carer" } });

    render(<ResidentDirectoryClient />);
    expect(screen.queryByText("Admit Resident")).not.toBeInTheDocument();
  });
});
