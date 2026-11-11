import {
  normalizePreAdmissionPartA,
  PRE_ADMISSION_PART_SCHEMAS,
  type PreAdmissionPartDataMap,
  type PreAdmissionPartKey,
  type PreAdmissionRecordDTO,
} from "@repo/schema";

export type PartsState = { [K in PreAdmissionPartKey]: PreAdmissionPartDataMap[K] };

export const emptyParts = (): PartsState => ({
  partA: PRE_ADMISSION_PART_SCHEMAS.partA.parse({}),
  partB: PRE_ADMISSION_PART_SCHEMAS.partB.parse({}),
  partC: PRE_ADMISSION_PART_SCHEMAS.partC.parse({}),
  partD: PRE_ADMISSION_PART_SCHEMAS.partD.parse({}),
  partE: PRE_ADMISSION_PART_SCHEMAS.partE.parse({}),
  partF: PRE_ADMISSION_PART_SCHEMAS.partF.parse({}),
  partG: PRE_ADMISSION_PART_SCHEMAS.partG.parse({}),
  roomAllocation: PRE_ADMISSION_PART_SCHEMAS.roomAllocation.parse({}),
});

/** Server record to form state; parts never saved fall back to schema defaults. */
export function hydrateParts(
  record: PreAdmissionRecordDTO,
  base: PartsState = emptyParts(),
): PartsState {
  const next = { ...base };
  (Object.keys(next) as PreAdmissionPartKey[]).forEach((key) => {
    const saved = record[key];
    if (saved) {
      (next as Record<string, unknown>)[key] =
        key === "partA"
          ? normalizePreAdmissionPartA(saved)
          : PRE_ADMISSION_PART_SCHEMAS[key].parse(saved);
    }
  });
  return next;
}
