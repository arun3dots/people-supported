import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

describe('FileValidationPipe (E-07 Magic-Byte & Size Validation)', () => {
  const pipe = new FileValidationPipe({
    maxSizeMb: 10,
    allowedTypes: ['pdf', 'image'],
  });

  it('accepts valid PDF files with %PDF- magic bytes', () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 sample content');
    const mockFile = {
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      originalname: 'care-plan.pdf',
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    expect(pipe.transform(mockFile)).toBe(mockFile);
  });

  it('accepts valid PNG files with PNG magic bytes', () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const mockFile = {
      buffer: pngBuffer,
      size: pngBuffer.length,
      originalname: 'wound-photo.png',
      mimetype: 'image/png',
    } as Express.Multer.File;

    expect(pipe.transform(mockFile)).toBe(mockFile);
  });

  it('rejects executable scripts or disguised HTML/SVG files', () => {
    const htmlBuffer = Buffer.from('<script>alert("xss")</script>');
    const mockFile = {
      buffer: htmlBuffer,
      size: htmlBuffer.length,
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    expect(() => pipe.transform(mockFile)).toThrow(BadRequestException);
  });

  it('rejects files exceeding the size limit', () => {
    const largeBuffer = Buffer.from('%PDF-1.4 large file content');
    const mockFile = {
      buffer: largeBuffer,
      size: 15 * 1024 * 1024, // 15 MB
      originalname: 'large.pdf',
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    expect(() => pipe.transform(mockFile)).toThrow(
      /exceeds the permitted limit/,
    );
  });
});
