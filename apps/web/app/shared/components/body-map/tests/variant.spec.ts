import { describe, it, expect } from "vitest";
import { getBodyMapVariant } from "../variant";

describe("Gender Variant Resolver (getBodyMapVariant)", () => {
  it("should return neutral for null or undefined resident", () => {
    expect(getBodyMapVariant(null)).toBe("neutral");
    expect(getBodyMapVariant(undefined)).toBe("neutral");
    expect(getBodyMapVariant({})).toBe("neutral");
  });

  it("should normalize male values across various casing and abbreviations", () => {
    expect(getBodyMapVariant({ gender: "male" })).toBe("male");
    expect(getBodyMapVariant({ gender: "Male" })).toBe("male");
    expect(getBodyMapVariant({ gender: "MALE" })).toBe("male");
    expect(getBodyMapVariant({ gender: "m" })).toBe("male");
    expect(getBodyMapVariant({ gender: "M" })).toBe("male");
    expect(getBodyMapVariant({ sex: "Male" })).toBe("male");
  });

  it("should normalize female values across various casing and abbreviations", () => {
    expect(getBodyMapVariant({ gender: "female" })).toBe("female");
    expect(getBodyMapVariant({ gender: "Female" })).toBe("female");
    expect(getBodyMapVariant({ gender: "FEMALE" })).toBe("female");
    expect(getBodyMapVariant({ gender: "f" })).toBe("female");
    expect(getBodyMapVariant({ gender: "F" })).toBe("female");
    expect(getBodyMapVariant({ sex: "Female" })).toBe("female");
  });

  it("should inspect nested demographic paths in order of precedence", () => {
    expect(getBodyMapVariant({ profile: { gender: "Female" } })).toBe("female");
    expect(getBodyMapVariant({ admission: { gender: "Male" } })).toBe("male");
    expect(
      getBodyMapVariant({
        admissionData: { step1: { gender: "Female" } },
      }),
    ).toBe("female");
    expect(
      getBodyMapVariant({
        personalDetails: { gender: "Male" },
      }),
    ).toBe("male");
  });

  it("should safely default non-binary or unrecorded gender to neutral", () => {
    expect(getBodyMapVariant({ gender: "Other" })).toBe("neutral");
    expect(getBodyMapVariant({ gender: "Non-Binary" })).toBe("neutral");
    expect(getBodyMapVariant({ gender: "Prefer not to say" })).toBe("neutral");
    expect(getBodyMapVariant({ gender: "" })).toBe("neutral");
  });

  it("should never mutate the resident object passed to it", () => {
    const original = Object.freeze({
      id: "res-123",
      gender: "Female",
      profile: Object.freeze({ gender: "Female" }),
    });

    const result = getBodyMapVariant(original as any);
    expect(result).toBe("female");
    expect(original.gender).toBe("Female");
  });
});
