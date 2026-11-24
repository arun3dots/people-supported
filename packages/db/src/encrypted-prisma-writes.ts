import { encrypt } from "./crypto";
import { encryptPreAdmissionData } from "./pre-admission-crypto";

const textFields: Record<string, readonly string[]> = {
  Resident: ["nhsNumber", "dob"],
  User: ["dbsNumber", "niNumber", "mfaSecret"],
  UserProfile: ["phoneNumber", "addressLine1"],
  DbsCheck: ["certificateNumber"],
};

const nestedModels: Record<string, Record<string, string>> = {
  Tenant: {
    residents: "Resident",
    users: "User",
    residentPreAdmissions: "ResidentPreAdmission",
  },
  Branch: {
    residents: "Resident",
    residentPreAdmissions: "ResidentPreAdmission",
  },
  Resident: { preAdmissions: "ResidentPreAdmission" },
  ResidentPreAdmission: { resident: "Resident" },
  User: { profile: "UserProfile", dbsCheck: "DbsCheck" },
  UserProfile: { user: "User" },
  DbsCheck: { user: "User" },
};

const writesWithData = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function forEachInput(
  value: unknown,
  transform: (input: Record<string, unknown>) => void,
): void {
  for (const row of Array.isArray(value) ? value : [value]) {
    if (isRecord(row)) transform(row);
  }
}

function encryptNestedWrites(
  model: string,
  relation: Record<string, unknown>,
): void {
  encryptData(model, relation.create);
  forEachInput(relation.createMany, (input) => encryptData(model, input.data));
  forEachInput(relation.connectOrCreate, (input) =>
    encryptData(model, input.create),
  );
  for (const operation of ["update", "updateMany"] as const) {
    forEachInput(relation[operation], (input) =>
      encryptData(model, input.data ?? input),
    );
  }
  forEachInput(relation.upsert, (input) => {
    encryptData(model, input.create);
    encryptData(model, input.update);
  });
}

function encryptData(model: string, data: unknown): void {
  forEachInput(data, (input) => {
    for (const field of textFields[model] ?? []) {
      const value = input[field];
      if (typeof value === "string") input[field] = encrypt(value);
      else if (isRecord(value) && typeof value.set === "string")
        value.set = encrypt(value.set);
    }
    if (model === "ResidentPreAdmission")
      Object.assign(input, encryptPreAdmissionData(input));
    for (const [field, child] of Object.entries(nestedModels[model] ?? {})) {
      const relation = input[field];
      if (isRecord(relation)) encryptNestedWrites(child, relation);
    }
  });
}

export function encryptPrismaWrite(
  model: string,
  operation: string,
  args: unknown,
): void {
  if (
    !(Object.hasOwn(textFields, model) || Object.hasOwn(nestedModels, model)) ||
    !isRecord(args)
  )
    return;
  if (writesWithData.has(operation)) encryptData(model, args.data);
  if (operation === "upsert") {
    encryptData(model, args.create);
    encryptData(model, args.update);
  }
}
