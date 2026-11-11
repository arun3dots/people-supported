export * from "./types";
export { preadmissionTemplate } from "./preadmission.template";
export { dementiaTemplate } from "./dementia.template";
export { nursingTemplate } from "./nursing.template";
export { nutritionTemplate } from "./nutrition.template";
export { respiteTemplate } from "./respite.template";

import { preadmissionTemplate } from "./preadmission.template";
import { dementiaTemplate } from "./dementia.template";
import { nursingTemplate } from "./nursing.template";
import { nutritionTemplate } from "./nutrition.template";
import { respiteTemplate } from "./respite.template";
import type { TemplateDef } from "./types";

export const ALL_ASSESSMENT_TEMPLATES: TemplateDef[] = [
  preadmissionTemplate,
  dementiaTemplate,
  nursingTemplate,
  nutritionTemplate,
  respiteTemplate,
];
