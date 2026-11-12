import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RoomBedAllocationCard } from "./RoomBedAllocationCard";
import { DEFAULT_ADMISSION_FORM_DATA } from "../../data/admissionFormFields";
import type {
  SchemeItem,
  PropertyItem,
  Room,
} from "../../../../../../lib/types/facility";

const sampleSchemes: SchemeItem[] = [
  { id: "scheme-1", name: "Scheme 1" } as SchemeItem,
];

const sampleProperties: PropertyItem[] = [
  {
    id: "prop-north",
    name: "Oak House",
    schemeId: "scheme-1",
    scheme: {
      id: "scheme-1",
      name: "Scheme 1",
      referenceId: null,
      housingPartner: null,
      commissioningLa: null,
    },
    roomTenancies: [],
  } as unknown as PropertyItem,
  {
    id: "prop-south",
    name: "Maple Cottage",
    schemeId: null,
    scheme: null,
    parsedPropertyDetails: {
      landlordDetails: { name: "Northern Supported Housing" },
    },
    roomTenancies: [],
  } as unknown as PropertyItem,
];

const sampleRooms: Room[] = [
  {
    id: "room-103",
    roomNumber: "103",
    type: "Single",
    wingId: "prop-north",
    totalBeds: 1,
    occupiedBeds: 0,
  } as Room,
  {
    id: "room-201",
    roomNumber: "201",
    type: "Single Ensuite",
    wingId: "prop-south",
    totalBeds: 1,
    occupiedBeds: 0,
  } as Room,
];

vi.mock("../../../../../../lib/queries/facility", () => ({
  useGetSchemesQuery: () => ({ data: sampleSchemes, isLoading: false }),
  useGetPropertiesQuery: () => ({ data: sampleProperties, isLoading: false }),
  useGetRoomsQuery: () => ({ data: sampleRooms, isLoading: false }),
}));

describe("RoomBedAllocationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes Bed Allocation and cascades Scheme -> Property -> Room selection", () => {
    const updateFormData = vi.fn();
    render(
      <RoomBedAllocationCard
        formData={{ ...DEFAULT_ADMISSION_FORM_DATA }}
        updateFormData={updateFormData}
      />,
    );

    expect(screen.getByText(/^Scheme$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Property/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bed Allocation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Wing \/ Floor/i)).not.toBeInTheDocument();

    const [schemeSelect, propertySelect, roomSelect] =
      screen.getAllByRole("combobox");
    expect(schemeSelect).toBeDefined();
    expect(propertySelect).toBeDefined();
    expect(roomSelect).toBeDefined();

    fireEvent.click(schemeSelect!);
    fireEvent.click(screen.getByRole("option", { name: "Scheme 1" }));

    fireEvent.click(propertySelect!);
    expect(screen.getByRole("option", { name: "Oak House" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Maple Cottage/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Oak House" }));

    fireEvent.click(roomSelect!);
    expect(
      screen.getByRole("option", { name: /Room 103/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Room 201/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /Room 103/ }));
    expect(updateFormData).toHaveBeenCalledWith({
      roomNumber: "103",
      roomType: "Single",
      assignedBedId: "",
    });
  });

  it("allows picking unassigned properties under All Schemes and hydrates saved roomNumber", () => {
    const updateFormData = vi.fn();
    render(
      <RoomBedAllocationCard
        formData={{
          ...DEFAULT_ADMISSION_FORM_DATA,
          roomNumber: "201",
          roomType: "Single Ensuite",
        }}
        updateFormData={updateFormData}
      />,
    );

    const [schemeSelect, propertySelect, roomSelect] =
      screen.getAllByRole("combobox");

    expect(schemeSelect).toHaveTextContent("All Schemes");
    expect(propertySelect).toHaveTextContent("Maple Cottage");
    expect(roomSelect).toHaveTextContent("Room 201");
    expect(
      screen.getByText(/Maple Cottage • Room 201 • Single Ensuite/),
    ).toBeInTheDocument();
  });

  it("auto-populates landlord from the selected property and supports manual landlord edits", () => {
    const updateFormData = vi.fn();
    render(
      <RoomBedAllocationCard
        formData={{ ...DEFAULT_ADMISSION_FORM_DATA }}
        updateFormData={updateFormData}
      />,
    );

    const [, propertySelect] = screen.getAllByRole("combobox");
    fireEvent.click(propertySelect!);
    fireEvent.click(screen.getByRole("option", { name: "Maple Cottage" }));

    expect(updateFormData).toHaveBeenCalledWith({
      roomNumber: "",
      assignedBedId: "",
      landlord: "Northern Supported Housing",
    });

    const landlordInput = screen.getByLabelText(/Landlord \/ Housing Provider/i);
    fireEvent.change(landlordInput, { target: { value: "Custom Housing Trust" } });
    expect(updateFormData).toHaveBeenCalledWith({ landlord: "Custom Housing Trust" });
  });
});
