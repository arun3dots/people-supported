import { ApiProperty } from '@nestjs/swagger';
import * as Schema from '@repo/schema';

export class CreateShiftRequestDto implements Schema.CreateShiftRequestDTO {
  @ApiProperty({ example: 'Leave', enum: ['Leave', 'Change', 'Cover'] })
  type!: 'Leave' | 'Change' | 'Cover';

  @ApiProperty({ example: '2024-05-01T08:00:00Z' })
  startTime!: string | Date;

  @ApiProperty({ example: '2024-05-01T20:00:00Z', required: false })
  endTime?: string | Date | null;

  @ApiProperty({ example: 'Family event', required: false })
  reason?: string | null;

  @ApiProperty({ example: 'Some notes', required: false })
  notes?: string | null;

  @ApiProperty({ example: 'uuid', required: false })
  shiftId?: string | null;
}

export class UpdateShiftRequestStatusDto {
  @ApiProperty({
    example: 'Approved',
    enum: ['Pending', 'Approved', 'Rejected'],
  })
  status!: 'Pending' | 'Approved' | 'Rejected';

  @ApiProperty({ example: 'Approved by manager', required: false })
  adminNotes?: string | null;
}
