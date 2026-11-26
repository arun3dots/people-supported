import { Global, Module } from '@nestjs/common';
import { CognitoConfigModule } from '../../auth/cognito/cognito-config';
import { AccessClient } from './access-client';
import { AccessConsoleController } from './access-console.controller';

@Global()
@Module({
  imports: [CognitoConfigModule],
  controllers: [AccessConsoleController],
  providers: [AccessClient],
  exports: [AccessClient],
})
export class AccessIntegrationModule {}
