import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResidentHeroBanner } from "./ResidentHeroBanner";
import type { ResidentHeroData } from "./ResidentHeroBanner.utils";

const mockRiskAssessments = [
  {
    id: "ra-1",
    title: "Fall Risk",
    category: "Falls",
    status: "Active",
    inherentLevel: "High",
    residualLevel: "Extreme",
    template: null,
  },
  {
    id: "ra-2",
    title: "Pressure Ulcer Risk",
    category: "Skin",
    status: "Approved",
    inherentLevel: "Extreme",
    residualLevel: null,
    template: null,
  },
];

let currentPreAdmission: {
  roomAllocation: { roomNumber: string; roomType: string };
  partC?: {
    allergies?: Array<{ substance: string; reaction?: string | null }>;
    noKnownAllergies?: boolean;
  };
} = {
  roomAllocation: {
    roomNumber: "103",
    roomType: "Single",
  },
  partC: {
    allergies: [{ substance: "Penicillin", reaction: "rash" }],
    noKnownAllergies: false,
  },
};

const mockSchemes = [{ id: "scheme-1", name: "North Supported Living" }];
const mockProperties = [
  {
    id: "prop-1",
    name: "Oak House",
    schemeId: "scheme-1",
    scheme: { id: "scheme-1", name: "North Supported Living" },
  },
];
const mockRooms = [{ id: "room-103", roomNumber: "103", wingId: "prop-1" }];

let currentRooms = mockRooms;
let currentProperties = mockProperties;
let currentSchemes = mockSchemes;

vi.mock("../../../../../../lib/queries/risk", () => ({
  useGetRiskAssessmentsQuery: () => ({ data: mockRiskAssessments }),
}));

vi.mock("../../../../../../lib/queries/pre-admission", () => ({
  useGetPreAdmissionQuery: () => ({ data: currentPreAdmission }),
}));

vi.mock("../../../../../../lib/queries/facility", () => ({
  useGetSchemesQuery: () => ({ data: currentSchemes }),
  useGetPropertiesQuery: () => ({ data: currentProperties }),
  useGetRoomsQuery: () => ({ data: currentRooms }),
}));

vi.mock("./AdmissionProgressCard", () => ({
  AdmissionProgressCard: () => null,
}));

const baseResident: ResidentHeroData = {
  id: "res-1",
  fullName: "Luna Mars",
  status: "Active",
  nhsNumber: "7894561230",
  dob: "1961-01-15",
  dnacprStatus: "dnr",
  severity: "High",
  profile: {
    gender: "Female",
    maritalStatus: "Single",
  },
  keyworker: {
    fullName: "Joys jo",
  },
};

describe("ResidentHeroBanner", () => {
  beforeEach(() => {
    currentRooms = mockRooms;
    currentProperties = mockProperties;
    currentSchemes = mockSchemes;
    currentPreAdmission = {
      roomAllocation: { roomNumber: "103", roomType: "Single" },
      partC: {
        allergies: [{ substance: "Penicillin", reaction: "rash" }],
        noKnownAllergies: false,
      },
    };
  });

  it("displays Scheme and Property details instead of Room & Wing and Bed Number when available", () => {
    render(
      <ResidentHeroBanner
        resident={baseResident}
        activeTab="overview"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Luna Mars")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Female")).toBeInTheDocument();
    expect(screen.getByText("Single")).toBeInTheDocument();
    expect(screen.getByText("NHS-7894561230")).toBeInTheDocument();

    expect(screen.getByText("Property")).toBeInTheDocument();
    expect(screen.getByText("Oak House")).toBeInTheDocument();
    expect(screen.getByText("Room")).toBeInTheDocument();
    expect(screen.getByText("Room 103")).toBeInTheDocument();
    expect(screen.queryByText("Keyworker")).not.toBeInTheDocument();
    expect(screen.queryByText("Bed Number")).not.toBeInTheDocument();
    expect(screen.getByText("Severity: High")).toBeInTheDocument();
    expect(screen.getByText("DNACPR")).toBeInTheDocument();
    expect(screen.getByText("Allergy: Penicillin (rash)")).toBeInTheDocument();
    expect(screen.getByText("Fall Risk: Extreme")).toBeInTheDocument();
    expect(screen.getByText("Pressure Ulcer Risk: Extreme")).toBeInTheDocument();
  });

  it("shows No known allergies badge when confirmed and merges careProfile / summary allergies", () => {
    currentPreAdmission = {
      roomAllocation: { roomNumber: "103", roomType: "Single" },
      partC: { allergies: [], noKnownAllergies: true },
    };

    const { rerender } = render(
      <ResidentHeroBanner
        resident={{ ...baseResident, allergySummary: "No known allergies" }}
        activeTab="overview"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByText("No known allergies")).toBeInTheDocument();
    expect(screen.queryByText(/Allergy:/)).not.toBeInTheDocument();

    rerender(
      <ResidentHeroBanner
        resident={{
          ...baseResident,
          allergySummary: "Peanuts",
          careProfile: { foodAllergies: ["Shellfish"] },
        }}
        activeTab="overview"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Allergy: Peanuts")).toBeInTheDocument();
    expect(screen.getByText("Allergy: Shellfish")).toBeInTheDocument();
  });

  it("renders Property and Room & Wing cleanly when no Property matches", () => {
    currentRooms = [];
    currentProperties = [];
    currentSchemes = [];

    render(
      <ResidentHeroBanner
        resident={{
          ...baseResident,
          bed: {
            number: "Bed 3",
            room: { roomNumber: "3", wing: null },
          },
        }}
        activeTab="overview"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Property")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("Room")).toBeInTheDocument();
    expect(screen.getByText("Room 3")).toBeInTheDocument();
    expect(screen.queryByText("Bed Number")).not.toBeInTheDocument();
    expect(screen.queryByText("Keyworker")).not.toBeInTheDocument();
  });
});
