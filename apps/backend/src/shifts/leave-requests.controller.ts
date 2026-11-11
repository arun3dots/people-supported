import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../common/pipes/zod.pipe";
import {
  CreateLeaveRequestSchema,
  CreateLeaveRequestDTO,
  UpdateLeaveRequestStatusSchema,
  UpdateLeaveRequestStatusDTO,
} from "@repo/schema";
import { LeaveRequestService } from "./services/leave-request.service";

@Controller("leave-requests")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestsController {
  constructor(private readonly leaveService: LeaveRequestService) {}

  @Get()
  @Roles("SuperAdmin", "Admin", "Manager", "Nurse", "Carer")
  async getAll(@Req() req: any) {
    return this.leaveService.getAll(req.user.tenantId);
  }

  @Post()
  @Roles("SuperAdmin", "Admin", "Manager", "Nurse", "Carer")
  async create(
    @Req() req: any,
    @Body(new ZodValidationPipe(CreateLeaveRequestSchema))
    dto: CreateLeaveRequestDTO,
  ) {
    return this.leaveService.create(req.user.tenantId, req.user.sub || req.user.userId, dto);
  }

  @Patch(":id/status")
  @Roles("SuperAdmin", "Admin", "Manager")
  async updateStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateLeaveRequestStatusSchema))
    dto: UpdateLeaveRequestStatusDTO,
  ) {
    return this.leaveService.updateStatus(
      req.user.tenantId,
      id,
      req.user.sub || req.user.userId,
      dto,
    );
  }
}
