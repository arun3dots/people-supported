import { z } from "zod";
export { z };

export * from "./common/pagination";
export * from "./auth";
export * from "./tenant";
export * from "./billing";
export * from "./staff";
export * from "./profile";
export * from "./facility";
export * from "./role";
export * from "./resident";
export * from "./resident-list";
export * from "./resident-emergency";
export * from "./pre-admission";
export * from "./assessment";
export * from "./need-care-plan";
export * from "./care-task";
export * from "./observation";
export * from "./care-plan";
export * from "./care-plan-review";
export * from "./care-plan-domains";
export * from "./mca-dols";
export * from "./transfer-pack";
export * from "./medication";
export * from "./shifts";
export * from "./leave-requests";
export * from "./risk";
export * from "./compliance";
export * from "./department";
export * from "./finance";
export * from "./enquiry";
export * from "./incident";
export * from "./body-map";
export * from "./notification";
export * from "./dashboard";
export * from "./audit";
export * from "./escalations";
export * from "./food-fluid";
export * from "./data-rights";
export * from "./nhs-number";
export * from "./break-glass";
export * from "./visitor-log";
export * from "./peep";
export * from "./equipment-maintenance";
export * from "./staff-supervision";
export * from "./audit-schedule";
export * from "./cqc-notification";
export * from "./compliance-review";
export * from "./reports";
export * from "./utils";

export const helloSchema = z.object({
  message: z.string().min(1),
});

export type HelloDTO = z.infer<typeof helloSchema>;
