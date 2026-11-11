import { Controller, Get } from '@nestjs/common';
import { PackagesService } from './packages.service';

/** Public, unauthenticated package listing for the onboarding page. */
@Controller('packages')
export class PackagesPublicController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  findPublic() {
    return this.packagesService.findPublic();
  }
}
