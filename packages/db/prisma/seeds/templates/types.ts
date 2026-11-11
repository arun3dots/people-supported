export interface QuestionDef {
  id: string;
  section: string;
  questionText: string;
  type: "text" | "radio" | "checkbox" | "select";
  options?: string[];
  answer?: string | string[] | boolean;
}

export interface SectionDef {
  id: string;
  title: string;
  goal?: string;
  questions: QuestionDef[];
}

export interface TemplateDef {
  id: string;
  name: string;
  category: string;
  description: string;
  isDefault: boolean;
  sections: SectionDef[];
}
