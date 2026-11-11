import { ApiProperty } from '@nestjs/swagger';
import * as Schema from '@repo/schema';

export class CreateWingDto implements Schema.CreateWingDTO {
  @ApiProperty({
    example: 'branch-uuid',
    required: false,
    description:
      'Only required for tenant-wide callers with no active branch on their session; branch-assigned users get this from their JWT.',
  })
  branchId?: string;

  @ApiProperty({ example: 'Ground Floor East' })
  name!: string;

  @ApiProperty({ example: 'WG-001', required: false })
  code?: string;

  @ApiProperty({ example: 'Description of this wing', required: false })
  description?: string;

  @ApiProperty({ example: 'Wing Lead', required: false })
  primaryContact?: string;

  @ApiProperty({ example: 'Notes about the wing', required: false })
  notes?: string;

  @ApiProperty({
    example: 'Active',
    enum: ['Active', 'Inactive', 'Maintenance'],
    required: false,
  })
  status?: string;
}

export class UpdateWingDto implements Schema.UpdateWingDTO {
  @ApiProperty({ example: 'branch-uuid', required: false })
  branchId?: string;

  @ApiProperty({ example: 'Ground Floor West', required: false })
  name?: string;

  @ApiProperty({ example: 'WG-001B', required: false })
  code?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  description?: string;

  @ApiProperty({ example: 'Wing Lead', required: false })
  primaryContact?: string;

  @ApiProperty({ example: 'Updated notes', required: false })
  notes?: string;
}

export class CreateRoomDto implements Schema.CreateRoomDTO {
  @ApiProperty({ example: 'wing-uuid' })
  wingId!: string;

  @ApiProperty({ example: '101' })
  roomNumber!: string;

  @ApiProperty({ example: 'Single', enum: ['Single', 'Double', 'Ensuite'] })
  type!: string;

  @ApiProperty({ example: 'R-101', required: false })
  code?: string;

  @ApiProperty({ example: 'Main Hall 1', required: false })
  name?: string;

  @ApiProperty({ example: 'Description of this room', required: false })
  description?: string;

  @ApiProperty({ example: 'Room Lead Nurse', required: false })
  primaryContact?: string;

  @ApiProperty({ example: 'Notes about the room', required: false })
  notes?: string;

  @ApiProperty({
    example: 'Active',
    enum: ['Active', 'Inactive', 'Maintenance'],
    required: false,
  })
  status?: string;
}

export class UpdateRoomDto implements Schema.UpdateRoomDTO {
  @ApiProperty({ example: 'wing-uuid', required: false })
  wingId?: string;

  @ApiProperty({ example: '101A', required: false })
  roomNumber?: string;

  @ApiProperty({ example: 'Double', required: false })
  type?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  description?: string;

  @ApiProperty({ example: 'Room Lead Nurse', required: false })
  primaryContact?: string;

  @ApiProperty({ example: 'Updated notes', required: false })
  notes?: string;
}

export class CreateBedDto implements Schema.CreateBedDTO {
  @ApiProperty({ example: 'room-uuid' })
  roomId!: string;

  @ApiProperty({ example: 'B-01' })
  bedNumber!: string;

  @ApiProperty({ example: 'BED-1234' })
  bedCode!: string;

  @ApiProperty({
    example: 'Available',
    enum: ['Available', 'Occupied', 'Maintenance', 'Reserved'],
  })
  status!: Schema.BedStatus;

  @ApiProperty({ example: 1, default: 1, required: false })
  quantity?: number;

  @ApiProperty({ example: 'By Window', required: false })
  bedLabel?: string;

  @ApiProperty({ example: 'Standard Bed', required: false })
  bedType?: string;

  @ApiProperty({ example: 200, required: false })
  bedLength?: number;

  @ApiProperty({ example: 90, required: false })
  bedWidth?: number;

  @ApiProperty({ example: 250, required: false })
  safeWorkingLoad?: number;

  @ApiProperty({ example: 'Yes', required: false })
  heightAdjustment?: string;

  @ApiProperty({ example: 'Yes', required: false })
  sideRails?: string;

  @ApiProperty({ example: 'No', required: false })
  pressureMattress?: string;

  @ApiProperty({
    example: ['Overbed Table', 'Call Bell / Nurse Call'],
    required: false,
  })
  equipment?: string[];

  @ApiProperty({ example: 'Any specification notes', required: false })
  specificationNotes?: string;

  @ApiProperty({ example: '2026-06-30', required: false })
  availableFrom?: string;

  @ApiProperty({ example: 'Available', required: false })
  plannedStatus?: string;

  @ApiProperty({ example: 'Immediate', required: false })
  occupancyAvailableFrom?: string;

  @ApiProperty({ example: '2026-07-15', required: false })
  expectedDischargeDate?: string;

  @ApiProperty({ example: 'Any availability notes', required: false })
  availabilityNotes?: string;

  @ApiProperty({ example: 'resident-uuid', required: false })
  residentId?: string;
}

export class UpdateBedDto implements Schema.UpdateBedDTO {
  @ApiProperty({
    example: 'Maintenance',
    enum: ['Available', 'Occupied', 'Maintenance', 'Reserved'],
  })
  status?: Schema.BedStatus;

  @ApiProperty({ example: 'B-01', required: false })
  bedNumber?: string;

  @ApiProperty({ example: 'BED-1234', required: false })
  bedCode?: string;

  @ApiProperty({ example: 'room-uuid', required: false })
  roomId?: string;

  @ApiProperty({ example: 'By Window', required: false })
  bedLabel?: string;

  @ApiProperty({ example: 'Standard Bed', required: false })
  bedType?: string;

  @ApiProperty({ example: 200, required: false })
  bedLength?: number;

  @ApiProperty({ example: 90, required: false })
  bedWidth?: number;

  @ApiProperty({ example: 250, required: false })
  safeWorkingLoad?: number;

  @ApiProperty({ example: 'Yes', required: false })
  heightAdjustment?: string;

  @ApiProperty({ example: 'Yes', required: false })
  sideRails?: string;

  @ApiProperty({ example: 'No', required: false })
  pressureMattress?: string;

  @ApiProperty({
    example: ['Overbed Table', 'Call Bell / Nurse Call'],
    required: false,
  })
  equipment?: string[];

  @ApiProperty({ example: 'Any specification notes', required: false })
  specificationNotes?: string;

  @ApiProperty({ example: '2026-06-30', required: false })
  availableFrom?: string;

  @ApiProperty({ example: 'Available', required: false })
  plannedStatus?: string;

  @ApiProperty({ example: 'Immediate', required: false })
  occupancyAvailableFrom?: string;

  @ApiProperty({ example: '2026-07-15', required: false })
  expectedDischargeDate?: string;

  @ApiProperty({ example: 'Any availability notes', required: false })
  availabilityNotes?: string;

  @ApiProperty({ example: 'resident-uuid', required: false })
  residentId?: string;
}
