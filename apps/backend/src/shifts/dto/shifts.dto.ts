import { ApiProperty } from '@nestjs/swagger';
import * as Schema from '@repo/schema';

export class CreateShiftTypeDto implements Schema.CreateShiftTypeDTO {
  @ApiProperty({ example: 'branch-uuid', required: false })
  branchId?: string;

  @ApiProperty({ example: 'Early Shift' })
  name!: string;

  @ApiProperty({ example: '08:00' })
  startTime!: string;

  @ApiProperty({ example: '20:00' })
  endTime!: string;

  @ApiProperty({ example: '#4ade80', required: false })
  color?: string | null;
}

export class CreateShiftDto implements Schema.CreateShiftScheduleDTO {
  @ApiProperty({ example: 'branch-uuid', required: false })
  branchId?: string;

  @ApiProperty({ example: 'type-uuid', required: false })
  typeId?: string | null;

  @ApiProperty({ example: 'wing-uuid', required: false })
  wingId?: string | null;

  @ApiProperty({ example: 'unit-uuid', required: false })
  unitId?: string | null;

  @ApiProperty({ example: 'room-uuid', required: false })
  roomId?: string | null;

  @ApiProperty({ example: 'Shared Care (Core Support)', required: false })
  careType?: string | null;

  @ApiProperty({ example: '07:00 - 15:00', required: false })
  shiftWindow?: string | null;

  @ApiProperty({ example: 8.0, required: false })
  durationHours?: number | null;

  @ApiProperty({ example: '2024-05-01T08:00:00Z' })
  startTime!: string | Date;

  @ApiProperty({ example: '2024-05-01T20:00:00Z' })
  endTime!: string | Date;

  @ApiProperty({ example: 'Draft', enum: ['Draft', 'Published', 'Cancelled'] })
  status!: 'Draft' | 'Published' | 'Cancelled';

  @ApiProperty({ example: 'Resident hospitalised', required: false })
  cancellationReason?: string | null;

  @ApiProperty({ example: 'Need extra staff for this shift', required: false })
  notes?: string | null;

  @ApiProperty({ example: ['user-uuid-1', 'user-uuid-2'], required: false })
  userIds!: string[];

  @ApiProperty({ example: ['resident-uuid-1'], required: false })
  residentIds?: string[];

  @ApiProperty({ example: '2024-05-07T20:00:00Z', required: false })
  repeatUntil?: string | Date;

  @ApiProperty({ example: [1, 2, 3, 4, 5], required: false })
  repeatDays?: number[];
}

export class UpdateShiftDto extends CreateShiftDto {}

export class CreateShiftAssignmentDto
  implements Schema.CreateShiftAssignmentDTO
{
  @ApiProperty({ example: 'shift-uuid' })
  shiftId!: string;

  @ApiProperty({ example: 'user-uuid' })
  userId!: string;

  @ApiProperty({ example: 'Senior Carer' })
  role!: string;
}
