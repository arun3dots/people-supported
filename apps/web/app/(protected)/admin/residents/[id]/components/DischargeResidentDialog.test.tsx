import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DischargeResidentDialog } from "./DischargeResidentDialog";

// Mock toast and UI components
vi.mock("@repo/ui/components/ui", async () => {
  const actual = await vi.importActual<any>("@repo/ui/components/ui");
  return {
    ...actual,
    toast: vi.fn(),
    Select: ({ children, onValueChange }: any) => (
      <div data-testid="select-mock">
        {children}
        <button data-testid="trigger-select" onClick={() => onValueChange("Home")}>
          Select Home
        </button>
      </div>
    ),
    SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
    SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
    SelectItem: ({ children }: any) => <div data-testid="select-item">{children}</div>,
    SelectValue: () => <div data-testid="select-value">Value</div>,
  };
});

// Mock mutation
const mockMutate = vi.fn((data, options) => {
  if (options?.onSuccess) options.onSuccess();
});
vi.mock("../../../../../../lib/queries/residents", () => ({
  useDischargeResidentMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

import { toast } from "@repo/ui/components/ui";

describe("DischargeResidentDialog", () => {
  const mockResident = { id: "res-1", fullName: "John Doe" };
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when open is false", () => {
    render(
      <DischargeResidentDialog
        resident={mockResident}
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    );
    expect(screen.queryByText(/Discharge Resident/i)).not.toBeInTheDocument();
  });

  it("renders when open is true", () => {
    render(
      <DischargeResidentDialog
        resident={mockResident}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );
    expect(screen.getByText(/Discharge Resident/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to discharge John Doe/i)).toBeInTheDocument();
  });

  it("shows an error toast if fields are missing", async () => {
    render(
      <DischargeResidentDialog
        resident={mockResident}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );
    
    // Click discharge without filling reason/type
    fireEvent.click(screen.getByText("Discharge"));
    
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Missing fields",
          variant: "destructive",
        })
      );
    });
    
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("requires a two-step confirmation process to discharge", async () => {
    render(
      <DischargeResidentDialog
        resident={mockResident}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    // Fill the required fields
    fireEvent.click(screen.getAllByTestId("trigger-select")[0] as HTMLElement);
    
    const reasonInput = screen.getByPlaceholderText(/Detailed reason.../i);
    fireEvent.change(reasonInput, { target: { value: "Going home" } });

    // Step 1: Click "Discharge"
    const dischargeButton = screen.getByRole("button", { name: "Discharge" });
    fireEvent.click(dischargeButton);

    // Expect confirmation text and button to change
    expect(screen.getByText(/Confirming will free the assigned bed/i)).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", { name: "Yes, Confirm Discharge" });
    expect(confirmButton).toBeInTheDocument();

    // Step 2: Click "Yes, Confirm Discharge"
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          dischargeType: "Home",
          reason: "Going home",
        }),
        expect.any(Object)
      );
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
