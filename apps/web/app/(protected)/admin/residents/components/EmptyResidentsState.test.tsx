import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmptyResidentsState } from "./EmptyResidentsState";

// Mock next/link to render an anchor tag
vi.mock("next/link", () => {
  return {
    default: ({ href, children }: { href: string; children: React.ReactNode }) => {
      return <a href={href}>{children}</a>;
    },
  };
});

describe("EmptyResidentsState", () => {
  it("renders the empty state messaging", () => {
    render(<EmptyResidentsState />);
    
    expect(screen.getByText("No residents found")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your search or admit a new resident.")
    ).toBeInTheDocument();
  });

  it("renders the 'Admit Resident' link", () => {
    render(<EmptyResidentsState />);
    
    const link = screen.getByRole("link", { name: "Admit Resident" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/admin/residents/admit");
  });
});
