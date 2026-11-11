import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { getTenantId, requireBranchId } from '../common/utils/scope.util';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WingService } from './services/wing.service';
import { RoomService } from './services/room.service';
import { BedService } from './services/bed.service';
import { SchemeService, type SchemeWithMetrics } from './services/scheme.service';
import {
  PropertyService,
  type PropertyWithDetails,
} from './services/property.service';
import {
  CreateWingDto,
  UpdateWingDto,
  CreateRoomDto,
  UpdateRoomDto,
  CreateBedDto,
  UpdateBedDto,
} from './dto/facility.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Wing, Room, Bed, Scheme } from '@repo/db';
import {
  wingListQuerySchema,
  roomListQuerySchema,
  bedListQuerySchema,
  schemeListQuerySchema,
  createWingSchema,
  updateWingSchema,
  createRoomSchema,
  updateRoomSchema,
  createBedSchema,
  updateBedSchema,
  createSchemeSchema,
  updateSchemeSchema,
  createPropertyWithRoomsSchema,
  updatePropertySchema,
  type WingListQueryDTO,
  type RoomListQueryDTO,
  type BedListQueryDTO,
  type SchemeListQueryDTO,
  type CreateSchemeDTO,
  type UpdateSchemeDTO,
  type CreatePropertyWithRoomsDTO,
  type UpdatePropertyDTO,
  type PaginatedResponse,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';

@ApiTags('Facilities')
@ApiBearerAuth()
@Controller('facility')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacilityController {
  constructor(
    private readonly wingService: WingService,
    private readonly roomService: RoomService,
    private readonly bedService: BedService,
    private readonly schemeService: SchemeService,
    private readonly propertyService: PropertyService,
  ) {}

  // --- Schemes ---
  @Post('schemes')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a new supported living scheme' })
  async createScheme(
    @Body(new ZodValidationPipe(createSchemeSchema)) dto: CreateSchemeDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<Scheme> {
    return this.schemeService.createScheme(
      dto,
      getTenantId(req),
      requireBranchId(req, dto.branchId),
      req.user.userId,
    );
  }

  @Get('schemes')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get all supported living schemes' })
  async findAllSchemes(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(schemeListQuerySchema))
    query?: SchemeListQueryDTO,
  ): Promise<PaginatedResponse<SchemeWithMetrics>> {
    return this.schemeService.findAllSchemes(
      requireBranchId(req, query?.branchId),
      query,
    );
  }

  @Patch('schemes/:id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update a supported living scheme' })
  async updateScheme(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchemeSchema)) dto: UpdateSchemeDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<Scheme> {
    return this.schemeService.updateScheme(
      id,
      dto,
      getTenantId(req),
      req.user.userId,
    );
  }

  @Delete('schemes/:id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Delete a supported living scheme' })
  async deleteScheme(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.schemeService.deleteScheme(
      id,
      getTenantId(req),
      req.user.userId,
    );
  }

  // --- Properties (Wings + Rooms + Beds) ---
  @Post('properties')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a property with rooms and beds' })
  async createProperty(
    @Body(new ZodValidationPipe(createPropertyWithRoomsSchema))
    dto: CreatePropertyWithRoomsDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<Wing> {
    return this.propertyService.createPropertyWithRooms(
      dto,
      getTenantId(req),
      requireBranchId(req, dto.branchId),
      req.user.userId,
    );
  }

  @Get('properties')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get all properties with occupancy and tenancies' })
  async findAllProperties(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(wingListQuerySchema))
    query?: WingListQueryDTO,
  ): Promise<PaginatedResponse<PropertyWithDetails>> {
    return this.propertyService.findAllProperties(
      requireBranchId(req, query?.branchId),
      query,
    );
  }

  @Patch('properties/:id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update a property' })
  async updateProperty(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePropertySchema)) dto: UpdatePropertyDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<Wing> {
    return this.propertyService.updateProperty(
      id,
      dto,
      getTenantId(req),
      req.user.userId,
    );
  }

  // --- Wings ---
  @Post('wings')
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new wing' })
  async createWing(
    @Body(new ZodValidationPipe(createWingSchema)) dto: CreateWingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Wing> {
    return this.wingService.createWing(
      dto,
      getTenantId(req),
      requireBranchId(req, dto.branchId),
      req.user.userId,
    );
  }

  @Get('wings')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get all wings' })
  async findAllWings(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(wingListQuerySchema))
    query?: WingListQueryDTO,
  ): Promise<PaginatedResponse<Wing>> {
    return this.wingService.findAllWings(
      requireBranchId(req, query?.branchId),
      query,
    );
  }

  @Patch('wings/:id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update a wing' })
  async updateWing(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWingSchema)) dto: UpdateWingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Wing> {
    return this.wingService.updateWing(
      id,
      dto,
      getTenantId(req),
      req.user.userId,
    );
  }

  @Delete('wings/:id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a wing' })
  async deleteWing(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.wingService.deleteWing(id, getTenantId(req), req.user.userId);
  }

  // --- Rooms ---
  @Post('rooms')
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new room' })
  async createRoom(
    @Body(new ZodValidationPipe(createRoomSchema)) dto: CreateRoomDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Room> {
    return this.roomService.createRoom(dto, getTenantId(req), req.user.userId);
  }

  @Get('rooms')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get all rooms' })
  async findAllRooms(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(roomListQuerySchema))
    query?: RoomListQueryDTO,
  ): Promise<PaginatedResponse<Room>> {
    return this.roomService.findAllRooms(
      requireBranchId(req, query?.branchId),
      query,
    );
  }

  @Patch('rooms/:id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update a room' })
  async updateRoom(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRoomSchema)) dto: UpdateRoomDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Room> {
    return this.roomService.updateRoom(
      id,
      dto,
      getTenantId(req),
      req.user.userId,
    );
  }

  @Delete('rooms/:id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a room' })
  async deleteRoom(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.roomService.deleteRoom(id, getTenantId(req), req.user.userId);
  }

  // --- Beds ---
  @Post('beds')
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new bed' })
  async createBed(
    @Body(new ZodValidationPipe(createBedSchema)) dto: CreateBedDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    return this.bedService.createBed(dto, getTenantId(req), req.user.userId);
  }

  @Get('beds')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get all beds' })
  async findAllBeds(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(bedListQuerySchema))
    query?: BedListQueryDTO,
  ): Promise<PaginatedResponse<Bed>> {
    return this.bedService.findAllBeds(
      requireBranchId(req, query?.branchId),
      query,
    );
  }

  @Patch('beds/:id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update a bed' })
  async updateBed(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBedSchema)) dto: UpdateBedDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Bed> {
    return this.bedService.updateBed(
      id,
      dto,
      getTenantId(req),
      req.user.userId,
    );
  }

  @Delete('beds/:id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a bed' })
  async deleteBed(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.bedService.deleteBed(id, getTenantId(req), req.user.userId);
  }
}
