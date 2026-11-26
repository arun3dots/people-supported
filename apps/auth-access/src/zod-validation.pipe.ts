import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { z } from "@repo/schema";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: result.error.issues,
      });
    }
    return result.data;
  }
}
