export interface RiskCategoryConfigItem {
  title: string;
  templateName: string;
  buttonLabel: string;
  tool: string;
  review: string;
}

export const RISK_CATEGORIES_CONFIG: RiskCategoryConfigItem[] = [
  {
    title: "Pressure Ulcer Risk",
    templateName: "Pressure Ulcer Risk",
    buttonLabel: "Record Ulcer",
    tool: "Waterlow",
    review: "Quarterly",
  },
  {
    title: "Fall Risk",
    templateName: "Falls Risk",
    buttonLabel: "Record Fall",
    tool: "Morse Fall Scale",
    review: "Monthly",
  },
  {
    title: "Nutrition / Hydration Risk",
    templateName: "Nutrition / Hydration Risk",
    buttonLabel: "Record Nutrition",
    tool: "MUST",
    review: "Quarterly",
  },
  {
    title: "Behaviour / Cognitive Risk",
    templateName: "Behaviour / Cognitive Risk",
    buttonLabel: "Record Behaviour",
    tool: "CMAI",
    review: "Monthly",
  },
  {
    title: "Medication Risk",
    templateName: "Medication Risk",
    buttonLabel: "Record Medication",
    tool: "MAR Audit",
    review: "Monthly",
  },
  {
    title: "Fire Safety",
    templateName: "Fire Safety",
    buttonLabel: "Record Fire Safety",
    tool: "PEEP",
    review: "Annually",
  },
  {
    title: "Choking & Dysphagia",
    templateName: "Choking & dysphagia",
    buttonLabel: "Record Choking",
    tool: "IDDSI; Reg 12 & 14",
    review: "Quarterly",
  },
  {
    title: "Bed Rails",
    templateName: "Bed rails",
    buttonLabel: "Record Bed Rails",
    tool: "MHRA guidance; Reg 12",
    review: "Monthly",
  },
  {
    title: "Positive Risk-Taking Agreement",
    templateName: "Positive risk-taking agreement",
    buttonLabel: "Record Agreement",
    tool: "MCA 2005 s1(4); Care Act",
    review: "Annually",
  },
  {
    title: "Legionella & Water Safety",
    templateName: "Legionella & water safety",
    buttonLabel: "Record Water Safety",
    tool: "HSE ACOP L8",
    review: "Annually",
  },
  {
    title: "Staffing Levels & Skill Mix",
    templateName: "Staffing levels & skill mix",
    buttonLabel: "Record Staffing",
    tool: "Reg 18 — Staffing",
    review: "Monthly",
  },
  {
    title: "Infection Outbreak",
    templateName: "Infection outbreak",
    buttonLabel: "Record Infection",
    tool: "IPC code of practice",
    review: "Quarterly",
  },
  {
    title: "Hazardous Substances (COSHH)",
    templateName: "Hazardous substances (COSHH)",
    buttonLabel: "Record COSHH",
    tool: "COSHH Regulations 2002",
    review: "Annually",
  },
  {
    title: "General Risk",
    templateName: "General risk",
    buttonLabel: "Record General Risk",
    tool: "HSCA 2008 Regs 2014",
    review: "Annually",
  },
];

