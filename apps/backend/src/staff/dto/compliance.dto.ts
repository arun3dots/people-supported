import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';

// ────────────────────────────────────────────────────────
// RTW DTOs
// ────────────────────────────────────────────────────────

export class CreateRtwDto {
  @ApiProperty({
    enum: ['Manual', 'ShareCode', 'IDVT'],
    example: 'Manual',
  })
  verificationType!: string;

  @ApiPropertyOptional({ example: 'British Passport' })
  documentType?: string;

  @ApiPropertyOptional({ example: 'GBR-123456' })
  documentNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  issueDate?: string | Date;

  @ApiPropertyOptional({ example: 'ABC123DEF' })
  shareCode?: string;

  @ApiPropertyOptional({ example: 'Yoti' })
  idvtProvider?: string;

  @ApiPropertyOptional({ example: 'TXN-789' })
  transactionRef?: string;

  @ApiProperty({
    enum: ['Pending', 'Verified', 'Expired', 'Requires Follow-up'],
    default: 'Pending',
  })
  rtwStatus!: string;

  @ApiPropertyOptional({ example: '2024-06-01' })
  verificationDate?: string | Date;

  @ApiPropertyOptional({ example: 'Jane Admin' })
  verifierName?: string;

  @ApiPropertyOptional({ example: '2027-06-01' })
  expiryDate?: string | Date | null;

  @ApiPropertyOptional({ example: 'Max 20 hours per week' })
  workRestrictions?: string | null;

  @ApiPropertyOptional({ example: 'https://s3.example.com/doc.pdf' })
  documentUrl?: string | null;
}

export class UpdateRtwDto extends CreateRtwDto {}

// ────────────────────────────────────────────────────────
// DBS DTOs
// ────────────────────────────────────────────────────────

export class CreateDbsCheckDto {
  @ApiProperty({ example: '001234567890' })
  certificateNumber!: string;

  @ApiProperty({
    enum: ['Standard', 'Enhanced', 'Enhanced with Barred List'],
    example: 'Enhanced',
  })
  type!: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  issueDate?: string | Date;

  @ApiPropertyOptional({ example: '2027-01-01' })
  expiryDate?: string | Date | null;

  @ApiProperty({ default: false })
  updateService!: boolean;

  @ApiProperty({
    enum: ['Pending', 'Clear', 'Action Required'],
    default: 'Pending',
  })
  status!: string;

  @ApiPropertyOptional({ example: 'https://s3.example.com/dbs.pdf' })
  documentUrl?: string | null;
}

export class UpdateDbsCheckDto extends CreateDbsCheckDto {}

// ────────────────────────────────────────────────────────
// Certification DTOs
// ────────────────────────────────────────────────────────

export class CreateCertificationDto {
  @ApiProperty({ example: 'Safeguarding Adults (Level 2)' })
  name!: string;

  @ApiPropertyOptional({ example: ['First Aid', 'CPR'] })
  skills?: string[];

  @ApiProperty({ example: '2024-01-01' })
  issueDate!: string | Date;

  @ApiProperty({ example: '2025-01-01' })
  expiryDate!: string | Date;

  @ApiProperty({
    enum: ['Valid', 'Expiring Soon', 'Expired'],
    default: 'Valid',
  })
  status!: string;

  @ApiPropertyOptional({ example: 'https://s3.example.com/cert.pdf' })
  certificateUrl?: string | null;
}

export class UpdateCertificationDto extends CreateCertificationDto {}

// ────────────────────────────────────────────────────────
// Health Clearance DTOs
// ────────────────────────────────────────────────────────

export class CreateHealthClearanceDto {
  @ApiPropertyOptional({ example: '2024-03-15' })
  clearanceDate?: string | Date;

  @ApiProperty({
    enum: ['Cleared', 'Pending', 'Restricted'],
    default: 'Pending',
  })
  status!: string;

  @ApiPropertyOptional({ example: 'Fit for all duties' })
  notes?: string | null;

  @ApiPropertyOptional({ example: 'https://s3.example.com/health.pdf' })
  documentUrl?: string | null;
}

export class UpdateHealthClearanceDto extends CreateHealthClearanceDto {}

// ────────────────────────────────────────────────────────
// Immunisation DTOs
// ────────────────────────────────────────────────────────

export class CreateImmunisationDto {
  @ApiProperty({ example: 'Hepatitis B' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsNotEmpty()
  @IsDateString()
  dateAdministered!: string;

  @ApiProperty({
    enum: ['Up to date', 'Requires Booster'],
    default: 'Up to date',
  })
  @IsString()
  @IsOptional()
  status!: string;
}

export class UpdateImmunisationDto extends CreateImmunisationDto {}
