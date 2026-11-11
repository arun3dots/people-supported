import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PreAdmissionPartEDTO } from "@repo/schema";
import { PartEForm } from "./PartEForm";

vi.mock("../../components/common/DocumentUploadField", () => ({
  DocumentUploadField: ({ label }: { label?: string }) => (
    <div>{label}</div>
  ),
}));

const samplePartE: PreAdmissionPartEDTO = {
  moveDecision: {
    hasCapacity: null,
    assessedAt: null,
    assessedByName: null,
    summary: null,
    bestInterests: null,
  },
  wishes: null,
  consents: [{ name: "Photography", given: false, dateSigned: null, document: null }],
  dolsScreen: null,
};

const renderForm = (value: PreAdmissionPartEDTO = samplePartE) =>
  render(<PartEForm value={value} onChange={vi.fn()} />);

describe("PartEForm validation feedback", () => {
  const renderWithErrors = (errors: Record<string, string>) =>
    render(<PartEForm value={samplePartE} onChange={vi.fn()} errors={errors} />);

  it("scrolls to the first invalid capacity field and focuses it", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderWithErrors({
      "moveDecision.hasCapacity": "Record the capacity decision about the move",
    });

    expect(scrollIntoView).toHaveBeenCalled();
    const anchor = document.querySelector(
      '[data-validation-field="moveDecision.hasCapacity"]',
    );
    expect(anchor).not.toBeNull();
  });

  it("prefers the earliest field in reading order when several errors exist", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const scrolled: Element[] = [];
    scrollIntoView.mockImplementation(function (this: Element) {
      scrolled.push(this);
    });

    renderWithErrors({
      "moveDecision.summary": "Capacity assessment summary is required",
      "moveDecision.assessedByName": "Capacity assessed by is required",
    });

    expect(
      scrolled.some(
        (el) =>
          el.getAttribute("data-validation-field") ===
          "moveDecision.assessedByName",
      ),
    ).toBe(true);
  });

  it("shows the Zod message below the field", () => {
    renderWithErrors({
      "moveDecision.assessedByName": "Capacity assessed by is required",
    });

    expect(
      screen.getByText("Capacity assessed by is required"),
    ).toBeInTheDocument();
  });

  it("hides the message as soon as the field has a value", () => {
    render(
      <PartEForm
        value={{
          ...samplePartE,
          moveDecision: {
            ...samplePartE.moveDecision,
            assessedByName: "Dr Patel",
          },
        }}
        onChange={vi.fn()}
        errors={{ "moveDecision.assessedByName": "Capacity assessed by is required" }}
      />,
    );

    expect(
      screen.queryByText("Capacity assessed by is required"),
    ).toBeNull();
  });
});

describe("PartEForm required indicators", () => {
  it("shows the standard asterisk on the capacity outcome field", () => {
    renderForm();

    const label = screen.getByText("Capacity for this decision").closest("label");
    expect(label).not.toBeNull();
    expect(label?.querySelector('[data-slot="required-indicator"]')).not.toBeNull();
  });

  it("shows the standard asterisk on the capacity record fields", () => {
    renderForm();

    for (const text of ["Assessed on", "Assessed by", "Summary"]) {
      const label = screen.getByText(text).closest("label");
      expect(
        label?.querySelector('[data-slot="required-indicator"]'),
        `${text} should be marked required`,
      ).not.toBeNull();
    }
  });

  it("shows the standard asterisk on the best-interests fields when capacity is lacking", () => {
    renderForm({
      ...samplePartE,
      moveDecision: { ...samplePartE.moveDecision, hasCapacity: false },
    });

    for (const text of ["Best-interests decision date", "Decision maker"]) {
      const label = screen.getByText(text).closest("label");
      expect(
        label?.querySelector('[data-slot="required-indicator"]'),
        `${text} should be marked required`,
      ).not.toBeNull();
    }

    // "Rationale" also labels the optional DoLS field, so at least one must be required.
    const rationaleLabels = screen
      .getAllByText("Rationale")
      .map((node) => node.closest("label"));
    expect(
      rationaleLabels.some((label) =>
        label?.querySelector('[data-slot="required-indicator"]'),
      ),
    ).toBe(true);
  });

  it("shows the standard asterisk on the required consent name field", () => {
    renderForm();

    const label = screen.getByText("Consent").closest("label");
    expect(label?.querySelector('[data-slot="required-indicator"]')).not.toBeNull();
  });

  it("does not mark optional narrative fields as required", () => {
    renderForm();

    for (const text of ["Their wishes", "Re-screen if"]) {
      const label = screen.getByText(text).closest("label");
      expect(label?.querySelector('[data-slot="required-indicator"]')).toBeNull();
    }
  });
});
