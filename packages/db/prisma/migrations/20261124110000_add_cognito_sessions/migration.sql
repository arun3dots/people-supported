BEGIN;

CREATE TABLE "CognitoLoginAttempt" (
    "stateHash" TEXT PRIMARY KEY,
    "bindingHash" TEXT NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "sealedVerifier" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL
);

CREATE TABLE "CognitoSession" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "issuer" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "authenticatedAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "activeBranchId" TEXT,
    "refreshHash" TEXT NOT NULL,
    "previousRefreshHash" TEXT,
    "previousValidUntil" TIMESTAMPTZ(3),
    "sealedCredentials" TEXT,
    CONSTRAINT "CognitoSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CognitoRevocation" (
    "issuer" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "revokedBefore" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "CognitoRevocation_pkey" PRIMARY KEY ("issuer", "subject")
);

CREATE INDEX "CognitoLoginAttempt_expiresAt_idx" ON "CognitoLoginAttempt"("expiresAt");
CREATE INDEX "CognitoSession_issuer_subject_authenticatedAt_idx" ON "CognitoSession"("issuer", "subject", "authenticatedAt");
CREATE INDEX "CognitoSession_userId_idx" ON "CognitoSession"("userId");
CREATE INDEX "CognitoSession_expiresAt_idx" ON "CognitoSession"("expiresAt");

COMMIT;
