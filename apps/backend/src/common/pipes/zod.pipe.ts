import { PipeTransform, BadRequestException } from '@nestjs/common';
import { z } from '@repo/schema';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value) as unknown;
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      throw error;
    }
  }
}
