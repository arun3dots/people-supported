import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { accessServiceTokenSchema, accessSlugSchema, z } from "@repo/schema";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

const digest = (token: string) => createHash("sha256").update(token).digest();

@Injectable()
export class AccessServiceAuthGuard implements CanActivate {
  private readonly tokens = loadServiceTokens(
    process.env.AUTH_ACCESS_SERVICE_TOKENS_JSON,
  );

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const product = request.params.product;
    const token = request
      .get("authorization")
      ?.match(/^Bearer ([A-Za-z0-9_-]{43,128})$/)?.[1];
    const expected =
      typeof product === "string" ? this.tokens.get(product) : undefined;
    if (!expected || !token || !timingSafeEqual(expected, digest(token))) {
      throw new UnauthorizedException("Service credential required.");
    }
    return true;
  }
}

function loadServiceTokens(raw?: string) {
  try {
    const tokens = Object.entries(
      z
        .record(accessSlugSchema, accessServiceTokenSchema)
        .parse(JSON.parse(raw ?? "{}")),
    );
    if (
      !tokens.length ||
      new Set(tokens.map(([, token]) => token)).size !== tokens.length
    ) {
      throw new Error();
    }
    return new Map(tokens.map(([product, token]) => [product, digest(token)]));
  } catch {
    throw new Error(
      "AUTH_ACCESS_SERVICE_TOKENS_JSON requires a unique service secret per product.",
    );
  }
}
