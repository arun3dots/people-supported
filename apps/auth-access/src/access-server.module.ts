import {
  Body,
  Controller,
  Header,
  HttpCode,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  accessActorSchema,
  accessCreateCommandSchema,
  accessMemberCommandSchema,
  accessSlugSchema,
  accessUpdateCommandSchema,
  completeAccessStaffSchema,
  reserveAccessStaffSchema,
  z,
  type AccessActor,
  type AccessCreateCommand,
  type AccessMemberCommand,
  type AccessUpdateCommand,
  type CompleteAccessStaff,
  type ReserveAccessStaff,
} from "@repo/schema";
import { ZodValidationPipe } from "./zod-validation.pipe";
import { AccessServiceAuthGuard } from "./access-service-auth.guard";
import { AccessStore } from "./access-store";

@Controller("internal/access/:product")
@UseGuards(AccessServiceAuthGuard)
class AccessServerController {
  constructor(private readonly access: AccessStore) {}

  @Post("staff/reserve")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  reserveStaff(
    @Param("product") product: string,
    @Body(new ZodValidationPipe(reserveAccessStaffSchema))
    input: ReserveAccessStaff,
  ) {
    return this.access.reserveStaff(product, input);
  }

  @Post("staff/complete")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  completeStaff(
    @Param("product") product: string,
    @Body(new ZodValidationPipe(completeAccessStaffSchema))
    input: CompleteAccessStaff,
  ) {
    return this.access.completeStaff(product, input);
  }

  @Post("check")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  check(
    @Param("product") product: string,
    @Body(new ZodValidationPipe(accessActorSchema)) actor: AccessActor,
  ) {
    return this.access.check(product, actor);
  }

  @Post("console")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  console(
    @Param("product") product: string,
    @Body(new ZodValidationPipe(accessActorSchema)) actor: AccessActor,
  ) {
    return this.access.console(product, actor);
  }

  @Post("roles")
  @Header("Cache-Control", "no-store")
  createRole(
    @Param("product") product: string,
    @Body(new ZodValidationPipe(accessCreateCommandSchema))
    command: AccessCreateCommand,
  ) {
    return this.access.createRole(product, command.actor, command.role);
  }

  @Post("roles/:key")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  updateRole(
    @Param("product") product: string,
    @Param("key", new ZodValidationPipe(accessSlugSchema)) key: string,
    @Body(new ZodValidationPipe(accessUpdateCommandSchema))
    command: AccessUpdateCommand,
  ) {
    return this.access.updateRole(product, command.actor, key, command.role);
  }

  @Post("members/:id")
  @Header("Cache-Control", "no-store")
  @HttpCode(200)
  updateMember(
    @Param("product") product: string,
    @Param("id", new ZodValidationPipe(z.string().uuid())) id: string,
    @Body(new ZodValidationPipe(accessMemberCommandSchema))
    command: AccessMemberCommand,
  ) {
    return this.access.updateMembership(
      product,
      command.actor,
      id,
      command.membership,
    );
  }
}

@Module({
  controllers: [AccessServerController],
  providers: [AccessStore, AccessServiceAuthGuard],
})
export class AccessServerModule {}
