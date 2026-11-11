-- CreateTable
CREATE TABLE "SubscriptionPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" DOUBLE PRECISION NOT NULL,
    "residentLimit" INTEGER NOT NULL,
    "staffLimit" INTEGER NOT NULL,
    "featureFlags" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "SubscriptionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "cqcNumber" TEXT,
    "cqcProviderId" TEXT,
    "cqcLocationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "packageId" TEXT,
    "trialExpiresAt" TIMESTAMP(3),
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "subscriptionActivatedAt" TIMESTAMP(3),
    "nextRenewalAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "primaryContactEmail" TEXT,
    "primaryContactName" TEXT,
    "primaryContactPhone" TEXT,
    "logoUrl" TEXT,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranch" (
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBranch_pkey" PRIMARY KEY ("userId","branchId")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packageId" TEXT,
    "provider" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "isRenewal" BOOLEAN NOT NULL DEFAULT false,
    "failureReason" TEXT,
    "providerLinkId" TEXT,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "shortUrl" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wing" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "primaryContact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Wing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "wingId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "name" TEXT,
    "description" TEXT,
    "primaryContact" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "residentId" TEXT,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "number" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "bedLabel" TEXT,
    "bedType" TEXT,
    "bedLength" INTEGER,
    "bedWidth" INTEGER,
    "safeWorkingLoad" INTEGER,
    "heightAdjustment" TEXT,
    "sideRails" TEXT,
    "pressureMattress" TEXT,
    "equipment" TEXT[],
    "specificationNotes" TEXT,
    "availableFrom" TIMESTAMP(3),
    "plannedStatus" TEXT,
    "occupancyAvailableFrom" TEXT,
    "expectedDischargeDate" TIMESTAMP(3),
    "availabilityNotes" TEXT,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "roleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mfaSecret" TEXT,
    "dbsNumber" TEXT,
    "dbsExpiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "dob" TIMESTAMP(3),
    "niNumber" TEXT,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedById" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "activeBranchId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "resetToken" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaResetRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "phoneNumber" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "startDate" TIMESTAMP(3),
    "department" TEXT,
    "qualifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTraining" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "StaffTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "StaffExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightToWorkCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationType" TEXT NOT NULL,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "shareCode" TEXT,
    "idvtProvider" TEXT,
    "transactionRef" TEXT,
    "rtwStatus" TEXT NOT NULL DEFAULT 'Pending',
    "verificationDate" TIMESTAMP(3),
    "verifierName" TEXT,
    "expiryDate" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "workRestrictions" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RightToWorkCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbsCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificateNumber" TEXT,
    "type" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "updateService" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DbsCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffCertification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthClearance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clearanceDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Immunisation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateAdministered" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Immunisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "nhsNumber" TEXT,
    "dnarStatus" BOOLEAN NOT NULL DEFAULT false,
    "fundingType" TEXT NOT NULL DEFAULT 'Local Authority',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "keyworkerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "councilDetails" JSONB,
    "doNotAssignIds" TEXT[],
    "gpDetails" JSONB,
    "nextOfKin" JSONB,
    "photoUrl" TEXT,
    "preferredCarerIds" TEXT[],
    "requiredCertifications" TEXT[],
    "admissionStep" INTEGER NOT NULL DEFAULT 1,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentProfile" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "title" TEXT,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "preferredName" TEXT,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "preferredCommunication" TEXT,
    "preferredLanguage" TEXT,
    "languagesSpoken" TEXT[],
    "interpreterRequired" BOOLEAN NOT NULL DEFAULT false,
    "nationalId" TEXT,
    "nationalIdType" TEXT,
    "formerOccupation" TEXT,
    "hobbies" TEXT,
    "religion" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "insuranceProvider" TEXT,
    "niNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentAdmission" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "admissionType" TEXT,
    "admissionSource" TEXT,
    "admittedFrom" TEXT,
    "referringFacilityName" TEXT,
    "admissionReason" TEXT,
    "referralDate" TIMESTAMP(3),
    "expectedAdmissionDate" TIMESTAMP(3),
    "assignedManagerId" TEXT,
    "isSelfFunder" BOOLEAN NOT NULL DEFAULT false,
    "localAuthority" TEXT,
    "commissioningContact" JSONB,
    "roomTypePreference" TEXT,
    "floorPreference" TEXT,
    "specialRequirements" TEXT,
    "weeklyFundingAmount" DOUBLE PRECISION,
    "topUpAmount" DOUBLE PRECISION,
    "payer" TEXT,
    "primaryPaymentMethod" TEXT,
    "secondaryCoverage" TEXT,
    "insurancePolicyNumber" TEXT,
    "benefitId" TEXT,
    "billingResponsibleParty" JSONB,
    "agreedRoomRate" DOUBLE PRECISION,
    "agreedRoomRatePeriod" TEXT DEFAULT 'Month',
    "depositAmount" DOUBLE PRECISION,
    "depositDate" TIMESTAMP(3),
    "paymentFrequency" TEXT,
    "paymentSchedule" TEXT,
    "directDebitDetails" TEXT,
    "assignedBedId" TEXT,
    "roommateId" TEXT,
    "moveInDateTime" TIMESTAMP(3),
    "liabilityWaiverSigned" BOOLEAN NOT NULL DEFAULT false,
    "assistiveDevices" TEXT[],
    "valuablesInSafe" BOOLEAN NOT NULL DEFAULT false,
    "valuablesDescription" TEXT,
    "billingCycle" TEXT,
    "expectedDischargeDate" TIMESTAMP(3),
    "stayType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentAdmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentCareProfile" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "careCategory" TEXT,
    "primaryCareNeed" TEXT,
    "careComplexity" TEXT,
    "primaryDiagnosis" TEXT,
    "secondaryDiagnoses" TEXT[],
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "baselineVitals" JSONB,
    "allergies" TEXT[],
    "medicationAllergies" TEXT[],
    "foodAllergies" TEXT[],
    "environmentalAllergies" TEXT[],
    "currentMedications" JSONB,
    "chronicConditions" TEXT[],
    "skinConditionPressureAreas" TEXT,
    "continenceStatus" TEXT,
    "continence" TEXT,
    "sensoryAids" TEXT[],
    "dentalStatus" TEXT,
    "substanceUseHistory" TEXT,
    "recentHospitalizations" TEXT,
    "adlKatzMatrix" JSONB,
    "adlScore" INTEGER,
    "mobility" TEXT,
    "mobilityAidsUsed" TEXT[],
    "fallRiskScore" TEXT,
    "fallsLast6Months" TEXT,
    "ambulationDistance" TEXT,
    "cognitiveScore" TEXT,
    "orientation" TEXT,
    "communicationAbility" TEXT,
    "behavioralConcerns" TEXT,
    "sleepPattern" TEXT,
    "dietType" TEXT,
    "textureModification" TEXT,
    "feedingAssistance" TEXT,
    "feedingAssistanceNeed" TEXT,
    "supportRequired" TEXT[],
    "medicalConditions" TEXT[],
    "dietaryRequirements" TEXT[],
    "sensoryImpairment" TEXT[],
    "familyInvolvement" TEXT,
    "routinePreferences" TEXT,
    "communityNursePhone" TEXT,
    "socialWorkerEmail" TEXT,
    "mentalHealthTeam" TEXT,
    "dentist" TEXT,
    "optician" TEXT,
    "localAuthorityContact" TEXT,
    "hospitalConsultant" TEXT,
    "hospitalName" TEXT,
    "lastHospitalVisitDate" TIMESTAMP(3),
    "lastGpVisitDate" TIMESTAMP(3),
    "postSurgeries" TEXT,
    "immunisationStatus" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentCareProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentConsent" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "consentSignedBy" TEXT,
    "consentRelationship" TEXT,
    "consentDate" TIMESTAMP(3),
    "confirmGenuine" BOOLEAN NOT NULL DEFAULT false,
    "confirmGdpr" BOOLEAN NOT NULL DEFAULT false,
    "generalConsent" JSONB,
    "consentChecklist" JSONB,
    "advanceDirectives" JSONB,
    "poaDocumentUrl" TEXT,
    "guardianshipOrderUrl" TEXT,
    "insuranceAssignmentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentBelonging" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "description" TEXT,
    "conditionPhotoUrl" TEXT,
    "estValue" DOUBLE PRECISION,
    "storedInSafe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentBelonging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "branchId" TEXT,
    "residentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "status" TEXT NOT NULL DEFAULT 'Uploaded',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Statutory',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "TenantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "templateId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hazardDescription" TEXT NOT NULL,
    "tool" TEXT,
    "likelihood" INTEGER NOT NULL,
    "severity" INTEGER NOT NULL,
    "inherentScore" INTEGER NOT NULL,
    "inherentLevel" TEXT NOT NULL,
    "residualLikelihood" INTEGER,
    "residualSeverity" INTEGER,
    "residualScore" INTEGER,
    "residualLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "reviewFrequency" TEXT NOT NULL DEFAULT 'Quarterly',
    "nextReviewDate" TIMESTAMP(3) NOT NULL,
    "factors" JSONB,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hazardDescription" TEXT NOT NULL,
    "tool" TEXT,
    "defaultLikelihood" INTEGER NOT NULL,
    "defaultSeverity" INTEGER NOT NULL,
    "defaultControls" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "RiskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskControl" (
    "id" TEXT NOT NULL,
    "riskAssessmentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isExisting" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "carePlanTaskId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "RiskControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAlert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "riskAssessmentId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "parentVersionId" TEXT,
    "renewalReason" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "description" TEXT,
    "authorId" TEXT,
    "primaryDoctorId" TEXT,
    "secondaryDoctorId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "secondaryApprovedById" TEXT,
    "secondaryApprovedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "departments" TEXT[],
    "doctorsInvolved" TEXT[],
    "authorRole" TEXT DEFAULT 'SeniorCarer',
    "clinicalApproverId" TEXT,
    "managerApproverId" TEXT,
    "residentAgreed" BOOLEAN NOT NULL DEFAULT true,
    "residentAgreementNotes" TEXT,
    "representativeName" TEXT,
    "representativeRelationship" TEXT,
    "legalConsentBasis" TEXT DEFAULT 'ResidentSelf',
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextScheduledReview" TIMESTAMP(3),
    "decision" TEXT NOT NULL DEFAULT 'MaintainedNoChanges',
    "summaryNotes" TEXT NOT NULL,
    "residentFeedback" TEXT,
    "familyFeedback" TEXT,
    "domainsEvaluated" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlanReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentalCapacityAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "carePlanId" TEXT,
    "decisionType" TEXT NOT NULL,
    "specificDecision" TEXT NOT NULL,
    "hasImpairmentOrDisturbance" BOOLEAN NOT NULL,
    "impairmentDetails" TEXT NOT NULL,
    "canUnderstandInfo" BOOLEAN NOT NULL,
    "canRetainInfo" BOOLEAN NOT NULL,
    "canWeighOrUseInfo" BOOLEAN NOT NULL,
    "canCommunicateDecision" BOOLEAN NOT NULL,
    "hasCapacity" BOOLEAN NOT NULL,
    "bestInterestsRequired" BOOLEAN NOT NULL DEFAULT false,
    "consultedPersons" JSONB,
    "leastRestrictiveOptionConsidered" TEXT,
    "notes" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentalCapacityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DolsAuthorization" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "supervisoryBody" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UrgentApplied',
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorizedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relevantPersonsRepresentative" TEXT,
    "rprContact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DolsAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanGoal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "originGoalId" TEXT,
    "title" TEXT NOT NULL,
    "targetDescription" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reviewFrequency" TEXT NOT NULL DEFAULT 'Weekly',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "retirementReason" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlanGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'Pending',
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlanApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanMedication" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "instructions" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeOfDay" TEXT[],
    "allowLateAdministration" BOOLEAN NOT NULL DEFAULT false,
    "mandatoryObservations" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CarePlanMedication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanSection" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "CarePlanSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareTimeline" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "carerId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "CareTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "temp" DOUBLE PRECISION,
    "pulse" INTEGER,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "respiration" INTEGER,
    "bloodSugar" DOUBLE PRECISION,
    "spo2" DOUBLE PRECISION,
    "spo2Scale" INTEGER NOT NULL DEFAULT 1,
    "airOrOxygen" TEXT,
    "consciousness" TEXT NOT NULL DEFAULT 'Alert',
    "news2Score" INTEGER,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "notifyGP" BOOLEAN NOT NULL DEFAULT false,
    "increaseMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodFluidLog" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "dailyTotal" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "FoodFluidLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "harmLevel" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentTime" TEXT,
    "residentId" TEXT,
    "roomNumber" TEXT,
    "bedNumber" TEXT,
    "immediateActions" JSONB,
    "location" TEXT,
    "initialAssessment" TEXT,
    "investigationDetails" JSONB,
    "tasks" JSONB,
    "attachments" JSONB,
    "complianceItems" JSONB,
    "managerNotes" TEXT,
    "notes" TEXT,
    "reportedById" TEXT,
    "assignedToId" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationRound" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "instructions" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "allowLateAdministration" BOOLEAN NOT NULL DEFAULT false,
    "mandatoryObservations" TEXT[],
    "isAdhoc" BOOLEAN NOT NULL DEFAULT false,
    "carePlanMedicationId" TEXT,

    CONSTRAINT "MedicationRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedAdministration" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "carerId" TEXT NOT NULL,
    "administeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "observationId" TEXT,

    CONSTRAINT "MedAdministration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "ShiftType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "typeId" TEXT,
    "wingId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "assignedResidentIds" TEXT[],
    "assignedRoomIds" TEXT[],
    "overrideReason" TEXT,
    "flagCompliance" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Handover" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "missedTasks" INTEGER NOT NULL DEFAULT 0,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Handover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL DEFAULT 'Residential Fees',
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Unpaid',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidDate" TIMESTAMP(3),
    "councilPoId" TEXT,
    "items" JSONB,
    "notes" TEXT,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "branchId" TEXT,
    "invoiceId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "expenseNo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Paid',
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilPO" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "councilName" TEXT NOT NULL,
    "amountWeek" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "CouncilPO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "shiftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanTask" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "goalId" TEXT,
    "originTaskId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "precautions" TEXT,
    "category" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "timeOfDay" TEXT[],
    "targetTime" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "assignedGroupId" TEXT,
    "assignedStaffId" TEXT,
    "requirePhotoOrNote" BOOLEAN NOT NULL DEFAULT false,
    "escalateIfSkipped" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTask" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "carePlanTaskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "precautions" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT,
    "targetTime" TEXT,
    "assignedStaffId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "skipReason" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "branchId" TEXT,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "category" TEXT NOT NULL,
    "channels" TEXT[],
    "actionUrl" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "webEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "enquirerName" TEXT NOT NULL,
    "enquirerRelationship" TEXT NOT NULL,
    "enquirerPhone" TEXT NOT NULL,
    "enquirerEmail" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "currentLocation" TEXT NOT NULL,
    "careCategory" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Enquiry',
    "medicalNeeds" TEXT,
    "dependencyLevel" TEXT,
    "mobilityNeeds" TEXT,
    "dietaryRequirements" TEXT,
    "riskNotes" TEXT,
    "assessmentCompletedAt" TIMESTAMP(3),
    "assessmentData" JSONB,
    "targetAdmissionDate" TIMESTAMP(3),
    "preferredRoomType" TEXT,
    "notes" TEXT,
    "convertedResidentId" TEXT,
    "admittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Pre-Admission',
    "description" TEXT,
    "sections" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffShiftLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actualStartTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualEndTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Started',
    "handoverNotes" TEXT,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffShiftLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StaffRooms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffRooms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StaffBeds" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffBeds_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StaffWings" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffWings_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StaffResidents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffResidents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_cqcNumber_key" ON "Tenant"("cqcNumber");

-- CreateIndex
CREATE INDEX "Branch_tenantId_idx" ON "Branch"("tenantId");

-- CreateIndex
CREATE INDEX "UserBranch_branchId_idx" ON "UserBranch"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_token_key" ON "Payment"("token");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE INDEX "Payment_providerLinkId_idx" ON "Payment"("providerLinkId");

-- CreateIndex
CREATE INDEX "Payment_providerPaymentId_idx" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Wing_tenantId_idx" ON "Wing"("tenantId");

-- CreateIndex
CREATE INDEX "Wing_branchId_idx" ON "Wing"("branchId");

-- CreateIndex
CREATE INDEX "Room_branchId_idx" ON "Room"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_residentId_key" ON "Bed"("residentId");

-- CreateIndex
CREATE INDEX "Bed_branchId_idx" ON "Bed"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_family_idx" ON "RefreshToken"("family");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_resetToken_key" ON "PasswordReset"("resetToken");

-- CreateIndex
CREATE INDEX "PasswordReset_email_idx" ON "PasswordReset"("email");

-- CreateIndex
CREATE INDEX "MfaResetRequest_userId_idx" ON "MfaResetRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RightToWorkCheck_userId_key" ON "RightToWorkCheck"("userId");

-- CreateIndex
CREATE INDEX "RightToWorkCheck_rtwStatus_idx" ON "RightToWorkCheck"("rtwStatus");

-- CreateIndex
CREATE INDEX "RightToWorkCheck_expiryDate_idx" ON "RightToWorkCheck"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DbsCheck_userId_key" ON "DbsCheck"("userId");

-- CreateIndex
CREATE INDEX "DbsCheck_status_idx" ON "DbsCheck"("status");

-- CreateIndex
CREATE INDEX "DbsCheck_expiryDate_idx" ON "DbsCheck"("expiryDate");

-- CreateIndex
CREATE INDEX "StaffCertification_userId_idx" ON "StaffCertification"("userId");

-- CreateIndex
CREATE INDEX "StaffCertification_status_idx" ON "StaffCertification"("status");

-- CreateIndex
CREATE INDEX "StaffCertification_expiryDate_idx" ON "StaffCertification"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "HealthClearance_userId_key" ON "HealthClearance"("userId");

-- CreateIndex
CREATE INDEX "Immunisation_userId_idx" ON "Immunisation"("userId");

-- CreateIndex
CREATE INDEX "Resident_tenantId_idx" ON "Resident"("tenantId");

-- CreateIndex
CREATE INDEX "Resident_branchId_idx" ON "Resident"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentProfile_residentId_key" ON "ResidentProfile"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentAdmission_residentId_key" ON "ResidentAdmission"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentCareProfile_residentId_key" ON "ResidentCareProfile"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentConsent_residentId_key" ON "ResidentConsent"("residentId");

-- CreateIndex
CREATE INDEX "ResidentBelonging_residentId_idx" ON "ResidentBelonging"("residentId");

-- CreateIndex
CREATE INDEX "Document_branchId_idx" ON "Document"("branchId");

-- CreateIndex
CREATE INDEX "TenantDocument_tenantId_idx" ON "TenantDocument"("tenantId");

-- CreateIndex
CREATE INDEX "RiskAssessment_tenantId_idx" ON "RiskAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "RiskAssessment_branchId_idx" ON "RiskAssessment"("branchId");

-- CreateIndex
CREATE INDEX "RiskAssessment_residentId_idx" ON "RiskAssessment"("residentId");

-- CreateIndex
CREATE INDEX "RiskAssessment_status_idx" ON "RiskAssessment"("status");

-- CreateIndex
CREATE INDEX "RiskAssessment_nextReviewDate_idx" ON "RiskAssessment"("nextReviewDate");

-- CreateIndex
CREATE INDEX "RiskTemplate_tenantId_idx" ON "RiskTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "RiskTemplate_category_idx" ON "RiskTemplate"("category");

-- CreateIndex
CREATE INDEX "RiskControl_riskAssessmentId_idx" ON "RiskControl"("riskAssessmentId");

-- CreateIndex
CREATE INDEX "RiskControl_assignedToId_idx" ON "RiskControl"("assignedToId");

-- CreateIndex
CREATE INDEX "RiskControl_status_idx" ON "RiskControl"("status");

-- CreateIndex
CREATE INDEX "RiskAlert_tenantId_idx" ON "RiskAlert"("tenantId");

-- CreateIndex
CREATE INDEX "RiskAlert_branchId_idx" ON "RiskAlert"("branchId");

-- CreateIndex
CREATE INDEX "RiskAlert_recipientId_isRead_idx" ON "RiskAlert"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "CarePlan_residentId_idx" ON "CarePlan"("residentId");

-- CreateIndex
CREATE INDEX "CarePlan_tenantId_idx" ON "CarePlan"("tenantId");

-- CreateIndex
CREATE INDEX "CarePlan_branchId_idx" ON "CarePlan"("branchId");

-- CreateIndex
CREATE INDEX "CarePlan_status_idx" ON "CarePlan"("status");

-- CreateIndex
CREATE INDEX "CarePlanReview_tenantId_idx" ON "CarePlanReview"("tenantId");

-- CreateIndex
CREATE INDEX "CarePlanReview_carePlanId_idx" ON "CarePlanReview"("carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanReview_residentId_idx" ON "CarePlanReview"("residentId");

-- CreateIndex
CREATE INDEX "CarePlanReview_reviewedAt_idx" ON "CarePlanReview"("reviewedAt");

-- CreateIndex
CREATE INDEX "MentalCapacityAssessment_tenantId_idx" ON "MentalCapacityAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "MentalCapacityAssessment_residentId_idx" ON "MentalCapacityAssessment"("residentId");

-- CreateIndex
CREATE INDEX "MentalCapacityAssessment_assessorId_idx" ON "MentalCapacityAssessment"("assessorId");

-- CreateIndex
CREATE INDEX "MentalCapacityAssessment_assessedAt_idx" ON "MentalCapacityAssessment"("assessedAt");

-- CreateIndex
CREATE INDEX "DolsAuthorization_tenantId_idx" ON "DolsAuthorization"("tenantId");

-- CreateIndex
CREATE INDEX "DolsAuthorization_residentId_idx" ON "DolsAuthorization"("residentId");

-- CreateIndex
CREATE INDEX "DolsAuthorization_status_idx" ON "DolsAuthorization"("status");

-- CreateIndex
CREATE INDEX "DolsAuthorization_expiryDate_idx" ON "DolsAuthorization"("expiryDate");

-- CreateIndex
CREATE INDEX "CarePlanGoal_tenantId_idx" ON "CarePlanGoal"("tenantId");

-- CreateIndex
CREATE INDEX "CarePlanGoal_branchId_idx" ON "CarePlanGoal"("branchId");

-- CreateIndex
CREATE INDEX "CarePlanGoal_carePlanId_idx" ON "CarePlanGoal"("carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanGoal_status_idx" ON "CarePlanGoal"("status");

-- CreateIndex
CREATE INDEX "CarePlanApproval_tenantId_idx" ON "CarePlanApproval"("tenantId");

-- CreateIndex
CREATE INDEX "CarePlanApproval_branchId_idx" ON "CarePlanApproval"("branchId");

-- CreateIndex
CREATE INDEX "CarePlanApproval_carePlanId_idx" ON "CarePlanApproval"("carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanApproval_approverId_idx" ON "CarePlanApproval"("approverId");

-- CreateIndex
CREATE INDEX "CarePlanMedication_carePlanId_idx" ON "CarePlanMedication"("carePlanId");

-- CreateIndex
CREATE INDEX "Incident_tenantId_idx" ON "Incident"("tenantId");

-- CreateIndex
CREATE INDEX "Incident_branchId_idx" ON "Incident"("branchId");

-- CreateIndex
CREATE INDEX "Incident_residentId_idx" ON "Incident"("residentId");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_incidentDate_idx" ON "Incident"("incidentDate");

-- CreateIndex
CREATE INDEX "ShiftType_tenantId_idx" ON "ShiftType"("tenantId");

-- CreateIndex
CREATE INDEX "ShiftType_branchId_idx" ON "ShiftType"("branchId");

-- CreateIndex
CREATE INDEX "Shift_tenantId_idx" ON "Shift"("tenantId");

-- CreateIndex
CREATE INDEX "Shift_branchId_idx" ON "Shift"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Handover_shiftId_key" ON "Handover"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- CreateIndex
CREATE INDEX "Invoice_branchId_idx" ON "Invoice"("branchId");

-- CreateIndex
CREATE INDEX "Invoice_residentId_idx" ON "Invoice"("residentId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "PaymentHistory_invoiceId_idx" ON "PaymentHistory"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentHistory_tenantId_idx" ON "PaymentHistory"("tenantId");

-- CreateIndex
CREATE INDEX "PaymentHistory_branchId_idx" ON "PaymentHistory"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_expenseNo_key" ON "Expense"("expenseNo");

-- CreateIndex
CREATE INDEX "Expense_tenantId_idx" ON "Expense"("tenantId");

-- CreateIndex
CREATE INDEX "Expense_branchId_idx" ON "Expense"("branchId");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CouncilPO_poNumber_key" ON "CouncilPO"("poNumber");

-- CreateIndex
CREATE INDEX "CouncilPO_tenantId_idx" ON "CouncilPO"("tenantId");

-- CreateIndex
CREATE INDEX "CouncilPO_branchId_idx" ON "CouncilPO"("branchId");

-- CreateIndex
CREATE INDEX "ShiftRequest_userId_idx" ON "ShiftRequest"("userId");

-- CreateIndex
CREATE INDEX "ShiftRequest_tenantId_idx" ON "ShiftRequest"("tenantId");

-- CreateIndex
CREATE INDEX "ShiftRequest_branchId_idx" ON "ShiftRequest"("branchId");

-- CreateIndex
CREATE INDEX "CarePlanTask_residentId_idx" ON "CarePlanTask"("residentId");

-- CreateIndex
CREATE INDEX "CarePlanTask_tenantId_idx" ON "CarePlanTask"("tenantId");

-- CreateIndex
CREATE INDEX "CarePlanTask_branchId_idx" ON "CarePlanTask"("branchId");

-- CreateIndex
CREATE INDEX "CarePlanTask_carePlanId_idx" ON "CarePlanTask"("carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanTask_goalId_idx" ON "CarePlanTask"("goalId");

-- CreateIndex
CREATE INDEX "CarePlanTask_assignedStaffId_idx" ON "CarePlanTask"("assignedStaffId");

-- CreateIndex
CREATE INDEX "DailyTask_residentId_idx" ON "DailyTask"("residentId");

-- CreateIndex
CREATE INDEX "DailyTask_carePlanTaskId_idx" ON "DailyTask"("carePlanTaskId");

-- CreateIndex
CREATE INDEX "DailyTask_scheduledDate_idx" ON "DailyTask"("scheduledDate");

-- CreateIndex
CREATE INDEX "DailyTask_status_idx" ON "DailyTask"("status");

-- CreateIndex
CREATE INDEX "DailyTask_assignedStaffId_idx" ON "DailyTask"("assignedStaffId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_branchId_idx" ON "Notification"("branchId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Department_tenantId_idx" ON "Department"("tenantId");

-- CreateIndex
CREATE INDEX "Department_branchId_idx" ON "Department"("branchId");

-- CreateIndex
CREATE INDEX "Enquiry_tenantId_idx" ON "Enquiry"("tenantId");

-- CreateIndex
CREATE INDEX "Enquiry_branchId_idx" ON "Enquiry"("branchId");

-- CreateIndex
CREATE INDEX "Enquiry_status_idx" ON "Enquiry"("status");

-- CreateIndex
CREATE INDEX "Enquiry_convertedResidentId_idx" ON "Enquiry"("convertedResidentId");

-- CreateIndex
CREATE INDEX "AssessmentTemplate_tenantId_idx" ON "AssessmentTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "StaffShiftLog_tenantId_userId_idx" ON "StaffShiftLog"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "StaffShiftLog_branchId_idx" ON "StaffShiftLog"("branchId");

-- CreateIndex
CREATE INDEX "StaffShiftLog_shiftId_idx" ON "StaffShiftLog"("shiftId");

-- CreateIndex
CREATE INDEX "_StaffRooms_B_index" ON "_StaffRooms"("B");

-- CreateIndex
CREATE INDEX "_StaffBeds_B_index" ON "_StaffBeds"("B");

-- CreateIndex
CREATE INDEX "_StaffWings_B_index" ON "_StaffWings"("B");

-- CreateIndex
CREATE INDEX "_StaffResidents_B_index" ON "_StaffResidents"("B");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubscriptionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubscriptionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wing" ADD CONSTRAINT "Wing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wing" ADD CONSTRAINT "Wing_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_wingId_fkey" FOREIGN KEY ("wingId") REFERENCES "Wing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaResetRequest" ADD CONSTRAINT "MfaResetRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTraining" ADD CONSTRAINT "StaffTraining_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffExpense" ADD CONSTRAINT "StaffExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightToWorkCheck" ADD CONSTRAINT "RightToWorkCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DbsCheck" ADD CONSTRAINT "DbsCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCertification" ADD CONSTRAINT "StaffCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthClearance" ADD CONSTRAINT "HealthClearance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Immunisation" ADD CONSTRAINT "Immunisation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_keyworkerId_fkey" FOREIGN KEY ("keyworkerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentProfile" ADD CONSTRAINT "ResidentProfile_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentAdmission" ADD CONSTRAINT "ResidentAdmission_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCareProfile" ADD CONSTRAINT "ResidentCareProfile_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentConsent" ADD CONSTRAINT "ResidentConsent_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentBelonging" ADD CONSTRAINT "ResidentBelonging_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RiskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskTemplate" ADD CONSTRAINT "RiskTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "RiskAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAlert" ADD CONSTRAINT "RiskAlert_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAlert" ADD CONSTRAINT "RiskAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAlert" ADD CONSTRAINT "RiskAlert_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAlert" ADD CONSTRAINT "RiskAlert_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "RiskAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "CarePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanReview" ADD CONSTRAINT "CarePlanReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanReview" ADD CONSTRAINT "CarePlanReview_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanReview" ADD CONSTRAINT "CarePlanReview_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanReview" ADD CONSTRAINT "CarePlanReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentalCapacityAssessment" ADD CONSTRAINT "MentalCapacityAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentalCapacityAssessment" ADD CONSTRAINT "MentalCapacityAssessment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentalCapacityAssessment" ADD CONSTRAINT "MentalCapacityAssessment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentalCapacityAssessment" ADD CONSTRAINT "MentalCapacityAssessment_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DolsAuthorization" ADD CONSTRAINT "DolsAuthorization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DolsAuthorization" ADD CONSTRAINT "DolsAuthorization_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanGoal" ADD CONSTRAINT "CarePlanGoal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanGoal" ADD CONSTRAINT "CarePlanGoal_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanGoal" ADD CONSTRAINT "CarePlanGoal_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanGoal" ADD CONSTRAINT "CarePlanGoal_originGoalId_fkey" FOREIGN KEY ("originGoalId") REFERENCES "CarePlanGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanApproval" ADD CONSTRAINT "CarePlanApproval_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanApproval" ADD CONSTRAINT "CarePlanApproval_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanApproval" ADD CONSTRAINT "CarePlanApproval_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanApproval" ADD CONSTRAINT "CarePlanApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanMedication" ADD CONSTRAINT "CarePlanMedication_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanSection" ADD CONSTRAINT "CarePlanSection_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareTimeline" ADD CONSTRAINT "CareTimeline_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareTimeline" ADD CONSTRAINT "CareTimeline_carerId_fkey" FOREIGN KEY ("carerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodFluidLog" ADD CONSTRAINT "FoodFluidLog_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationRound" ADD CONSTRAINT "MedicationRound_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationRound" ADD CONSTRAINT "MedicationRound_carePlanMedicationId_fkey" FOREIGN KEY ("carePlanMedicationId") REFERENCES "CarePlanMedication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedAdministration" ADD CONSTRAINT "MedAdministration_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "MedicationRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedAdministration" ADD CONSTRAINT "MedAdministration_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftType" ADD CONSTRAINT "ShiftType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftType" ADD CONSTRAINT "ShiftType_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ShiftType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_wingId_fkey" FOREIGN KEY ("wingId") REFERENCES "Wing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_councilPoId_fkey" FOREIGN KEY ("councilPoId") REFERENCES "CouncilPO"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilPO" ADD CONSTRAINT "CouncilPO_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilPO" ADD CONSTRAINT "CouncilPO_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilPO" ADD CONSTRAINT "CouncilPO_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanTask" ADD CONSTRAINT "CarePlanTask_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanTask" ADD CONSTRAINT "CarePlanTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanTask" ADD CONSTRAINT "CarePlanTask_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanTask" ADD CONSTRAINT "CarePlanTask_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "CarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanTask" ADD CONSTRAINT "CarePlanTask_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "CarePlanGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanTask" ADD CONSTRAINT "CarePlanTask_originTaskId_fkey" FOREIGN KEY ("originTaskId") REFERENCES "CarePlanTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanTask" ADD CONSTRAINT "CarePlanTask_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_carePlanTaskId_fkey" FOREIGN KEY ("carePlanTaskId") REFERENCES "CarePlanTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_convertedResidentId_fkey" FOREIGN KEY ("convertedResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentTemplate" ADD CONSTRAINT "AssessmentTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShiftLog" ADD CONSTRAINT "StaffShiftLog_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShiftLog" ADD CONSTRAINT "StaffShiftLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShiftLog" ADD CONSTRAINT "StaffShiftLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShiftLog" ADD CONSTRAINT "StaffShiftLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffRooms" ADD CONSTRAINT "_StaffRooms_A_fkey" FOREIGN KEY ("A") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffRooms" ADD CONSTRAINT "_StaffRooms_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffBeds" ADD CONSTRAINT "_StaffBeds_A_fkey" FOREIGN KEY ("A") REFERENCES "Bed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffBeds" ADD CONSTRAINT "_StaffBeds_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffWings" ADD CONSTRAINT "_StaffWings_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffWings" ADD CONSTRAINT "_StaffWings_B_fkey" FOREIGN KEY ("B") REFERENCES "Wing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffResidents" ADD CONSTRAINT "_StaffResidents_A_fkey" FOREIGN KEY ("A") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffResidents" ADD CONSTRAINT "_StaffResidents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
