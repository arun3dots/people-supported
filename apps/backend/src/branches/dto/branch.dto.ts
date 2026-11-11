import { ApiProperty } from '@nestjs/swagger';
import * as Schema from '@repo/schema';

export class CreateBranchDto implements Schema.CreateBranchDTO {
  @ApiProperty({ example: 'Riverside Care Home' })
  name!: string;

  @ApiProperty({ example: 'BR-001', required: false })
  code?: string;

  @ApiProperty({ example: '12 Riverside Way', required: false })
  addressLine1?: string;

  @ApiProperty({ example: 'Unit 4', required: false })
  addressLine2?: string;

  @ApiProperty({ example: 'Manchester', required: false })
  city?: string;

  @ApiProperty({ example: 'M1 2AB', required: false })
  postcode?: string;

  @ApiProperty({
    example: 'Active',
    enum: ['Active', 'Inactive'],
    required: false,
  })
  status?: string;
}

export class UpdateBranchDto implements Schema.UpdateBranchDTO {
  @ApiProperty({ example: 'Riverside Care Home North', required: false })
  name?: string;

  @ApiProperty({ example: 'BR-001A', required: false })
  code?: string;

  @ApiProperty({ example: '12 Riverside Way', required: false })
  addressLine1?: string;

  @ApiProperty({ example: 'Unit 4', required: false })
  addressLine2?: string;

  @ApiProperty({ example: 'Manchester', required: false })
  city?: string;

  @ApiProperty({ example: 'M1 2AB', required: false })
  postcode?: string;

  @ApiProperty({
    example: 'Inactive',
    enum: ['Active', 'Inactive'],
    required: false,
  })
  status?: string;
}
