import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { PreAdmissionPartBDTO } from "@repo/schema";
import { PartBForm } from "./PartBForm";

const samplePartB: PreAdmissionPartBDTO = {
  nextOfKin: [
    {
      name: "Jane Pendelton",
      relationship: "Daughter",
      phone: "07700900123",
      email: "jane@example.com",
      availabilityNote: "Call any time",
    },
  ],
  lpa: [
    {
      type: "Health & Welfare",
      holderName: "Robert Pendelton",
      holderPhone: "07700900456",
      registeredYear: 2022,
      copySeen: true,
      document: null,
    },
  ],
  otherLegalAuthority: [],
  socialWorker: {
    name: "Sarah Miller",
    organisation: "Bristol Council",
    phone: "0117 900 1122",
  },
  gp: {
    name: "Dr. Evans",
    practice: "Central Health Surgery",
    phone: "0117 999 8877",
  },
  otherProviders: [],
};

describe("PartBForm Cards View", () => {
  it("renders existing next of kin as a card with name and relationship badge", () => {
    const onChange = vi.fn();
    render(<PartBForm value={samplePartB} onChange={onChange} />);

    expect(screen.getByText("Jane Pendelton")).toBeInTheDocument();
    expect(screen.getByText("Daughter")).toBeInTheDocument();
    expect(screen.getByText("07700900123")).toBeInTheDocument();
    expect(screen.getByText("Call any time")).toBeInTheDocument();

    // Verify Edit and Delete buttons exist for the card
    expect(screen.getByTitle("Edit contact")).toBeInTheDocument();
    expect(screen.getByTitle("Delete contact")).toBeInTheDocument();
  });

  it("renders existing LPA as a card with type and copy seen badge", () => {
    const onChange = vi.fn();
    render(<PartBForm value={samplePartB} onChange={onChange} />);

    expect(screen.getByText("Robert Pendelton")).toBeInTheDocument();
    expect(screen.getByText("Health & Welfare")).toBeInTheDocument();
    expect(screen.getByText("Copy seen")).toBeInTheDocument();
    expect(screen.getByText("Registered 2022")).toBeInTheDocument();
  });

  it("allows entering edit mode on a contact card and saving changes", () => {
    const onChange = vi.fn();
    render(<PartBForm value={samplePartB} onChange={onChange} />);

    const editBtn = screen.getByTitle("Edit contact");
    fireEvent.click(editBtn);

    // Form inputs should now be visible
    const nameInput = screen.getByDisplayValue("Jane Pendelton");
    expect(nameInput).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "Jane Pendelton Updated" } });
    const saveBtn = screen.getByRole("button", { name: "Save changes" });
    fireEvent.click(saveBtn);

    expect(onChange).toHaveBeenCalledWith({
      nextOfKin: [
        expect.objectContaining({
          name: "Jane Pendelton Updated",
        }),
      ],
    });
  });

  it("allows deleting a contact card", () => {
    const onChange = vi.fn();
    render(<PartBForm value={samplePartB} onChange={onChange} />);

    const deleteBtn = screen.getByTitle("Delete contact");
    fireEvent.click(deleteBtn);

    expect(onChange).toHaveBeenCalledWith({ nextOfKin: [] });
  });

  it("renders empty state when no items are present and opens add form on button click", () => {
    const emptyValue: PreAdmissionPartBDTO = {
      ...samplePartB,
      nextOfKin: [],
    };
    const onChange = vi.fn();
    render(<PartBForm value={emptyValue} onChange={onChange} />);

    expect(screen.getByText("No next of kin recorded")).toBeInTheDocument();
    const addBtn = screen.getAllByRole("button", { name: /Add next of kin/i })[0];
    expect(addBtn).toBeDefined();
    if (addBtn) fireEvent.click(addBtn);

    expect(screen.getByPlaceholderText("e.g. Daughter")).toBeInTheDocument();
  });
});
