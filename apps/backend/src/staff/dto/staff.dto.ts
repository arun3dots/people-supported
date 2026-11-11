import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as Schema from '@repo/schema';

export class CreateStaffDto implements Schema.CreateStaffDTO {
  @ApiProperty({ example: 'John Doe' })
  fullName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '07123456789' })
  phone?: string | null;

  @ApiProperty({ example: 'role-uuid' })
  roleId!: string;

  @ApiProperty({ example: '1990-01-01' })
  dob!: string | Date;

  @ApiProperty({ example: 'AB123456C', required: false })
  niNumber?: string | null;

  @ApiProperty({ example: '123456789', required: false })
  dbsNumber?: string | null;

  @ApiProperty({ example: '2027-01-01', required: false })
  dbsExpiryDate?: string | Date | null;

  @ApiProperty({ example: '2024-04-01' })
  startDate!: string | Date;

  @ApiProperty({ example: '123 Main St', required: false })
  address?: string | null;

  @ApiProperty({ example: ['wing-uuid-1'], isArray: true, required: false })
  unitIds!: string[];

  @ApiPropertyOptional({ example: 'branch-uuid' })
  branchId?: string;

  @ApiPropertyOptional({ example: 'Care' })
  department?: string | null;

  @ApiPropertyOptional({ example: 'Full-time' })
  contractType?: string | null;

  @ApiPropertyOptional({ example: 37.5 })
  contractedHoursPerWeek?: number | null;

  @ApiPropertyOptional({ example: 'scheme-uuid' })
  schemeId?: string | null;

  @ApiPropertyOptional({ example: 'property-uuid' })
  propertyId?: string | null;

  @ApiProperty({ isArray: true, required: false })
  emergencyContacts?: Schema.EmergencyContactDTO[] | null;
}

export class UpdateStaffRoleDto implements Schema.UpdateStaffRoleDTO {
  @ApiProperty({ example: 'role-uuid' })
  roleId!: string;
}

export class UpdateStaffDto implements Schema.UpdateStaffDTO {
  @ApiProperty({ example: 'John Doe', required: false })
  fullName?: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'role-uuid', required: false })
  roleId?: string;

  @ApiProperty({ example: '07123456789', required: false })
  phone?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  dob?: string | Date;

  @ApiProperty({ example: 'AB123456C', required: false })
  niNumber?: string | null;

  @ApiProperty({ example: '123456789', required: false })
  dbsNumber?: string | null;

  @ApiProperty({ example: '2027-01-01', required: false })
  dbsExpiryDate?: string | Date | null;

  @ApiProperty({ example: '2024-04-01', required: false })
  startDate?: string | Date;

  @ApiProperty({ example: '123 Main St', required: false })
  address?: string;

  @ApiPropertyOptional({ example: 'Care' })
  department?: string | null;

  @ApiPropertyOptional({ example: 'Full-time' })
  contractType?: string | null;

  @ApiPropertyOptional({ example: 37.5 })
  contractedHoursPerWeek?: number | null;

  @ApiPropertyOptional({ example: 'scheme-uuid' })
  schemeId?: string | null;

  @ApiPropertyOptional({ example: 'property-uuid' })
  propertyId?: string | null;

  @ApiProperty({ isArray: true, required: false })
  emergencyContacts?: Schema.EmergencyContactDTO[] | null;
}

export class UpdateStaffStatusDto implements Schema.UpdateStaffStatusDTO {
  @ApiProperty({ example: 'Active', enum: ['Active', 'Inactive'] })
  status!: Schema.StaffStatus;
}

export class UpdateStaffAssignmentsDto
  implements Schema.UpdateStaffAssignmentsDTO
{
  @ApiProperty({ isArray: true, required: false })
  wingIds?: string[];

  @ApiProperty({ isArray: true, required: false })
  roomIds?: string[];

  @ApiProperty({ isArray: true, required: false })
  bedIds?: string[];

  @ApiProperty({ isArray: true, required: false })
  residentIds?: string[];
}

export class StaffListQueryDto implements Schema.StaffListQueryDTO {
  @ApiPropertyOptional({ example: 1, default: 1 })
  page!: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  limit!: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Bypass pagination and return every record',
  })
  all?: boolean;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Search name, email, DBS number or role name',
  })
  search?: string;

  @ApiPropertyOptional({
    example: 'role-uuid',
    description: 'Filter by role ID',
  })
  roleId?: string;

  @ApiPropertyOptional({
    enum: ['Active', 'Inactive'],
    description: 'Filter by status',
  })
  status?: Schema.StaffStatus;

  @ApiPropertyOptional({
    example: 'wing-uuid',
    description: 'Filter by wing ID',
  })
  wingId?: string;

  @ApiPropertyOptional({
    example: 'unit-uuid',
    description: 'Filter by unit ID',
  })
  unitId?: string;

  @ApiPropertyOptional({
    enum: ['fullName', 'createdAt', 'startDate'],
    default: 'createdAt',
  })
  sortBy!: 'fullName' | 'createdAt' | 'startDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  sortOrder!: 'asc' | 'desc';
}

export class PaginatedStaffResponseDto {
  @ApiProperty({ isArray: true })
  data!: unknown[];

  @ApiProperty({ example: 45 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}
