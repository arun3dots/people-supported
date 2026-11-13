import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ShiftResidentTable } from "./ShiftResidentTable";

const bedlessResident = {
  id: "res-no-bed",
  name: "Alex Supported",
  roomBed: "",
  dependency: "Medium",
  conditions: ["Care Plan"],
  status: "Active",
  assignedStaffId: null,
  assignedStaffName: null,
};

function renderTable(onToggleResident = vi.fn(), onSetResidentIds = vi.fn()) {
  render(
    <ShiftResidentTable
      allResidents={[bedlessResident]}
      selectedResidentIds={[]}
      onToggleResident={onToggleResident}
      onClearResidents={vi.fn()}
      onSetResidentIds={onSetResidentIds}
      units={[]}
      wings={[]}
      rooms={[]}
      onUnitChange={vi.fn()}
      onWingChange={vi.fn()}
      onRoomChange={vi.fn()}
    />,
  );
  return { onToggleResident, onSetResidentIds };
}

describe("ShiftResidentTable (supported living, no bed allocation)", () => {
  it("lets a person with no room or bed be selected for a shift", () => {
    const { onToggleResident } = renderTable();

    expect(screen.getByText("Alex Supported")).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    const rowCheckbox = checkboxes[checkboxes.length - 1]!;
    expect(rowCheckbox).not.toBeDisabled();

    fireEvent.click(rowCheckbox);
    expect(onToggleResident).toHaveBeenCalledWith("res-no-bed");
  });

  it("includes people with no bed when selecting all", () => {
    const { onSetResidentIds } = renderTable();

    const selectAll = screen.getAllByRole("checkbox")[0]!;
    expect(selectAll).not.toBeDisabled();
    fireEvent.click(selectAll);
    expect(onSetResidentIds).toHaveBeenCalledWith(["res-no-bed"]);
  });
});
