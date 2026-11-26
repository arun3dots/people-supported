import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { z } from "@repo/schema";
import { AccessServerModule } from "./access-server.module";

async function bootstrap() {
  const port = z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .parse(process.env.AUTH_ACCESS_PORT ?? "4410");
  const app = await NestFactory.create(AccessServerModule, {
    abortOnError: false,
  });
  app.enableShutdownHooks();
  await app.listen(port, "127.0.0.1");
}

void bootstrap().catch(() => {
  console.error(
    "Auth & Access could not start. Check the service configuration and database.",
  );
  process.exitCode = 1;
});
