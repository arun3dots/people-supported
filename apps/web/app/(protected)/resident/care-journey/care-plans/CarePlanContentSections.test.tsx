import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CarePlanContentSections } from "./CarePlanContentSections";

describe("CarePlanContentSections", () => {
  it("disables all plan fields and support-step controls for agreed plans", () => {
    const { container, getByRole, getByText } = render(
      <CarePlanContentSections
        level="1"
        onLevelChange={vi.fn()}
        reviewDate="2026-12-02"
        onReviewDateChange={vi.fn()}
        content={{
          source: null,
          found: null,
          needs: "Needs support",
          prefs: null,
          strengths: null,
          outcome: "Remain comfortable",
          steps: ["Check comfort"],
          monitor: null,
          escalation: null,
          consent: null,
          restrictions: null,
        }}
        readOnly
        onContentFieldChange={vi.fn()}
      />,
    );

    expect(
      Array.from(container.querySelectorAll("input, textarea")).every(
        (field) => (field as HTMLInputElement).disabled,
      ),
    ).toBe(true);
    expect(getByRole("combobox")).toHaveAttribute("data-disabled");
    expect(getByText("Add step").closest("button")).toBeDisabled();
    expect(getByRole("button", { name: "Remove step 1" })).toBeDisabled();
  });
});
