import { Prisma } from '@repo/db';

/**
 * Converts a Prisma model object (or any serializable value) into a Prisma-compatible
 * InputJsonValue. This eliminates the need for `as any` when writing to JSON columns.
 *
 * Handles Dates and avoids circular reference issues by skipping common relation fields.
 */
export function toJsonValue(obj: any): Prisma.InputJsonValue {
  if (obj === null || obj === undefined)
    return null as unknown as Prisma.InputJsonValue;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj))
    return obj.map(toJsonValue) as unknown as Prisma.InputJsonValue;
  if (typeof obj === 'object') {
    const json: any = {};
    for (const key in obj) {
      // Skip relations that might cause circularity or unnecessary bloat in audit logs
      if (
        [
          'shift',
          'user',
          'createdBy',
          'updatedBy',
          'tenant',
          'assignments',
          'shiftAssignments',
        ].includes(key)
      )
        continue;
      json[key] = toJsonValue(obj[key]);
    }
    return json as Prisma.InputJsonValue;
  }
  return obj as unknown as Prisma.InputJsonValue;
}
