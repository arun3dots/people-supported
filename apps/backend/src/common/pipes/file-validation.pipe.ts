import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSizeMb?: number;
  allowedTypes?: ('pdf' | 'image')[];
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = {}) {}

  transform(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const maxSizeMb = this.options.maxSizeMb ?? 10;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size exceeds the permitted limit of ${maxSizeMb} MB.`,
      );
    }

    if (!file.buffer || file.buffer.length < 4) {
      throw new BadRequestException('Invalid or empty file buffer.');
    }

    const detectedType = this.detectMagicBytes(file.buffer);
    if (!detectedType) {
      throw new BadRequestException(
        'Invalid file format. Only PDF, PNG, JPEG, and WebP files are permitted.',
      );
    }

    const allowed = this.options.allowedTypes ?? ['pdf', 'image'];
    if (detectedType === 'pdf' && !allowed.includes('pdf')) {
      throw new BadRequestException(
        'PDF documents are not allowed for this upload.',
      );
    }
    if (detectedType !== 'pdf' && !allowed.includes('image')) {
      throw new BadRequestException('Images are not allowed for this upload.');
    }

    return file;
  }

  private detectMagicBytes(
    buffer: Buffer,
  ): 'pdf' | 'jpeg' | 'png' | 'webp' | null {
    // PDF: %PDF- (0x25 0x50 0x44 0x46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return 'pdf';
    }

    // JPEG: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'jpeg';
    }

    // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'png';
    }

    // WebP: RIFF ... WEBP
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && // R
      buffer[1] === 0x49 && // I
      buffer[2] === 0x46 && // F
      buffer[3] === 0x46 && // F
      buffer[8] === 0x57 && // W
      buffer[9] === 0x45 && // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50 // P
    ) {
      return 'webp';
    }

    return null;
  }
}
