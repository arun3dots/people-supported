import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { PreAdmissionPartCDTO } from "@repo/schema";
import { PartCForm } from "./PartCForm";

const samplePartC: PreAdmissionPartCDTO = {
  primaryDiagnosis: "Alzheimer’s disease",
  secondaryDiagnoses: ["Type 2 diabetes", "Hypertension"],
  medicalHistory: "Past history of stroke in 2018. Well recovered.",
  diagnoses: ["Alzheimer’s disease", "Type 2 diabetes", "Hypertension"],
  allergies: [
    { substance: "Penicillin", reaction: "Skin rash", severity: "Moderate" },
  ],
  noKnownAllergies: false,
  medicines: [
    {
      name: "Donepezil",
      dose: "10mg",
      frequency: "Once daily",
      route: "Oral",
      timing: "Night",
      prn: false,
      prnMaxPerDay: null,
      prescriber: "Dr. Evans",
    },
  ],
  pain: {
    summary: "Right hip pain on exertion",
    tool: "Abbey Pain Scale",
    score: 4,
  },
  heightCm: 172,
  weightKg: 68,
  baselineVitals: { bp: "120/80", pulse: "72", temp: "36.8", spO2: "98" },
  recentHospitalisations: "None in past 12 months",
  surgeries: "Hip replacement 2015",
  immunisations: "Flu and COVID vaccine up to date",
};

describe("PartCForm Diagnoses & Medical History", () => {
  it("renders primary diagnosis, secondary diagnoses, and medical history fields", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    expect(screen.getByText("Primary diagnosis")).toBeInTheDocument();
    expect(screen.getByText("Secondary diagnoses")).toBeInTheDocument();
    expect(screen.getByText("Medical history")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(/e\.g\. Alzheimer’s disease/i),
    ).toHaveValue("Alzheimer’s disease");
    expect(
      screen.getByPlaceholderText(/Type 2 diabetes, Hypertension/i),
    ).toHaveValue("Type 2 diabetes, Hypertension");
    expect(
      screen.getByPlaceholderText(/Details of past medical conditions/i),
    ).toHaveValue("Past history of stroke in 2018. Well recovered.");
  });

  it("updates primaryDiagnosis and synchronizes with diagnoses array on change", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    const primaryInput = screen.getByPlaceholderText(
      /e\.g\. Alzheimer’s disease/i,
    );
    fireEvent.change(primaryInput, { target: { value: "Vascular Dementia" } });

    expect(onChange).toHaveBeenCalledWith({
      primaryDiagnosis: "Vascular Dementia",
      diagnoses: ["Vascular Dementia", "Type 2 diabetes", "Hypertension"],
    });
  });

  it("updates secondaryDiagnoses and synchronizes with diagnoses array on change", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    const secondaryInput = screen.getByPlaceholderText(
      /Type 2 diabetes, Hypertension/i,
    );
    fireEvent.change(secondaryInput, {
      target: { value: "Osteoarthritis, Asthma" },
    });

    expect(onChange).toHaveBeenCalledWith({
      secondaryDiagnoses: ["Osteoarthritis", "Asthma"],
      diagnoses: ["Alzheimer’s disease", "Osteoarthritis", "Asthma"],
    });
  });

  it("updates medicalHistory on change", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    const historyInput = screen.getByPlaceholderText(
      /Details of past medical conditions/i,
    );
    fireEvent.change(historyInput, {
      target: { value: "New cardiac stent in 2021" },
    });

    expect(onChange).toHaveBeenCalledWith({
      medicalHistory: "New cardiac stent in 2021",
    });
  });

  it("renders clinical health units and calculates BMI accurately", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    expect(screen.getByText("Height (cm)")).toBeInTheDocument();
    expect(screen.getByText("Weight (kg)")).toBeInTheDocument();
    expect(screen.getByText("BMI (kg/m²)")).toBeInTheDocument();
    expect(screen.getByText("Blood pressure (mmHg)")).toBeInTheDocument();
    expect(screen.getByText("Pulse / Heart rate (bpm)")).toBeInTheDocument();
    expect(screen.getByText("Temperature (°C)")).toBeInTheDocument();
    expect(
      screen.getByText("Respiratory rate (breaths/min)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Oxygen saturation (SpO2 %)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pain score (0–10)")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(/Calculated automatically/i),
    ).toHaveValue("23.0 kg/m²");
  });

  it("updates pain score when entered", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    const painScoreInput = screen.getByPlaceholderText("e.g. 3");
    fireEvent.change(painScoreInput, { target: { value: "6" } });

    expect(onChange).toHaveBeenCalledWith({
      pain: {
        summary: "Right hip pain on exertion",
        tool: "Abbey Pain Scale",
        score: 6,
      },
    });
  });

  it("renders allergies in a cards view with severity badge, reaction, and edit/delete actions", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    expect(screen.getByText("Penicillin")).toBeInTheDocument();
    expect(screen.getByText("Moderate")).toBeInTheDocument();
    expect(screen.getByText("Skin rash")).toBeInTheDocument();
    expect(screen.getByTitle("Edit allergy")).toBeInTheDocument();
    expect(screen.getByTitle("Delete allergy")).toBeInTheDocument();
  });

  it("renders medicines in a cards view with details, badges, and edit/delete actions", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    expect(screen.getByText("Donepezil")).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();
    expect(screen.getByText("Oral")).toBeInTheDocument();
    expect(screen.getByText("10mg · Once daily")).toBeInTheDocument();
    expect(screen.getByText("Night")).toBeInTheDocument();
    expect(screen.getByText("Dr. Evans")).toBeInTheDocument();
    expect(screen.getByTitle("Edit medicine")).toBeInTheDocument();
    expect(screen.getByTitle("Delete medicine")).toBeInTheDocument();
  });

  it("saves the medication schedule details to the pre-admission record", () => {
    const onChange = vi.fn();
    const { container } = render(
      <PartCForm
        value={{ ...samplePartC, medicines: [] }}
        onChange={onChange}
      />,
    );

    fireEvent.click(
      within(container).getAllByRole("button", { name: "Add medicine" })[0]!,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(
      within(dialog).getByPlaceholderText("e.g. Paracetamol, Amlodipine"),
      { target: { value: "Aspirin" } },
    );
    fireEvent.change(
      within(dialog).getByPlaceholderText("e.g. 500mg, 10ml, 1 Tablet"),
      { target: { value: "75 mg" } },
    );
    fireEvent.click(within(dialog).getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Tablet" }));
    fireEvent.change(
      within(dialog).getByPlaceholderText(
        "e.g. Take with a full glass of water after food. Do not crush or chew.",
      ),
      { target: { value: "Take after food" } },
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add medicine" }),
    );

    expect(onChange).toHaveBeenCalledWith({
      medicines: [
        expect.objectContaining({
          name: "Aspirin",
          dose: "75 mg",
          form: "Tablet",
          route: "Tablet",
          instructions: "Take after food",
          scheduleType: "recurring",
          startDate: expect.any(String),
          endDate: expect.any(String),
          times: ["08:00"],
          allowLateAdministration: true,
          mandatoryObservations: [],
          imageUrls: [],
        }),
      ],
    });
  });

  it("opens existing medicine details in the dialog and leaves them unchanged when canceled", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit medicine" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByPlaceholderText("e.g. Paracetamol, Amlodipine"),
    ).toHaveValue("Donepezil");
    expect(
      within(dialog).getByPlaceholderText("e.g. 500mg, 10ml, 1 Tablet"),
    ).toHaveValue("10mg");

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("saves edits to an existing medicine from the dialog", () => {
    const onChange = vi.fn();
    render(<PartCForm value={samplePartC} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit medicine" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(
      within(dialog).getByPlaceholderText("e.g. 500mg, 10ml, 1 Tablet"),
      { target: { value: "5 mg" } },
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    expect(onChange).toHaveBeenCalledWith({
      medicines: [{ ...samplePartC.medicines[0], dose: "5 mg" }],
    });
  });
});
