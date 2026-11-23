import { devNull } from "node:os";

export interface AwsClientConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

const value = (key: string): string =>
  (process.env[key] ?? "").trim().replace(/^['"]|['"]$/g, "");

const alternativeCredentialSources = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_SESSION_TOKEN",
  "AWS_PROFILE",
  "AWS_DEFAULT_PROFILE",
  "AWS_ROLE_ARN",
  "AWS_WEB_IDENTITY_TOKEN_FILE",
  "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
  "AWS_CONTAINER_CREDENTIALS_FULL_URI",
] as const;

export function getAwsClientConfig(): AwsClientConfig {
  const region = value("AWS_REGION") || "eu-north-1";
  const mode = value("AWS_CREDENTIALS_MODE") || "default";
  if (mode === "instance-role") {
    const conflicts = alternativeCredentialSources.filter(
      (key) => process.env[key],
    );
    if (conflicts.length) {
      throw new Error(
        `AWS_CREDENTIALS_MODE=instance-role conflicts with ${conflicts.join(", ")}.`,
      );
    }
    if (
      process.env.AWS_CONFIG_FILE !== devNull ||
      process.env.AWS_SHARED_CREDENTIALS_FILE !== devNull
    ) {
      throw new Error(
        `AWS_CREDENTIALS_MODE=instance-role requires AWS_CONFIG_FILE and AWS_SHARED_CREDENTIALS_FILE to point to ${devNull}.`,
      );
    }
    const metadataDisabled = process.env.AWS_EC2_METADATA_DISABLED;
    if (metadataDisabled && metadataDisabled !== "false") {
      throw new Error(
        "AWS_CREDENTIALS_MODE=instance-role requires EC2 instance metadata access.",
      );
    }
    if (
      process.env.NODE_ENV === "production" &&
      process.env.AWS_EC2_METADATA_SERVICE_ENDPOINT
    ) {
      throw new Error(
        "AWS_CREDENTIALS_MODE=instance-role requires the default EC2 metadata endpoint in production.",
      );
    }
    return { region };
  }
  if (mode !== "default") {
    throw new Error("AWS_CREDENTIALS_MODE must be default or instance-role.");
  }

  const accessKeyId = value("AWS_ACCESS_KEY_ID");
  const secretAccessKey = value("AWS_SECRET_ACCESS_KEY");
  const sessionToken = value("AWS_SESSION_TOKEN");
  return {
    region,
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken ? { sessionToken } : {}),
          }
        : undefined,
  };
}
