import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResidentRecordCarePlans } from "./ResidentRecordCarePlans";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("../../../../../../../lib/queries/care-journey", () => ({
  useListNeedCarePlansQuery: () => ({ data: [], isLoading: false }),
  useListCareTaskDefinitionsQuery: () => ({ data: [] }),
}));

describe("ResidentRecordCarePlans", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("navigates to the assessment when no care plans exist yet", () => {
    render(<ResidentRecordCarePlans residentId="res-1" />);

    fireEvent.click(screen.getByRole("button", { name: /go to the assessment/i }));

    expect(push).toHaveBeenCalledWith(
      "/admin/residents/admit?id=res-1&step=6",
    );
  });
});
