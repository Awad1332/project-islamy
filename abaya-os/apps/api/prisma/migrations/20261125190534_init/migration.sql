-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'SUPPORT');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('RETURN', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ADJUSTMENT', 'RECEIPT', 'SALE', 'RETURN_RESTOCK', 'CANCEL_RESTOCK', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('ANTHROPIC', 'MOYASAR', 'TAP', 'WHATSAPP_CLOUD', 'INSTAGRAM', 'SMTP', 'SALLA', 'ZID', 'IMAGE_GENERATION');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONFIGURED', 'CONFIGURED', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'EMAIL', 'SMS', 'WEBCHAT');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'NOTE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('RECEIVED', 'QUEUED', 'SENT', 'FAILED', 'NOT_SENT');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('ORDER_CREATED', 'ORDER_DELIVERED', 'CUSTOMER_CREATED', 'RETURN_REQUESTED');

-- CreateEnum
CREATE TYPE "AiGenerationType" AS ENUM ('PRODUCT_TITLE', 'PRODUCT_DESCRIPTION', 'SEO', 'INSTAGRAM_CAPTION');

-- CreateEnum
CREATE TYPE "ImageJobType" AS ENUM ('BACKGROUND_REMOVAL', 'MODEL_TRY_ON', 'LIFESTYLE_SCENE', 'COLOR_VARIANT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "FitPreference" AS ENUM ('SNUG', 'REGULAR', 'LOOSE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "vatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "vatRateBps" INTEGER NOT NULL DEFAULT 1500,
    "pricesIncludeVat" BOOLEAN NOT NULL DEFAULT true,
    "vatNumber" TEXT,
    "commercialRegistration" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    "defaultLocale" TEXT NOT NULL DEFAULT 'ar',
    "addressCity" TEXT,
    "addressLine" TEXT,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 3,
    "defaultShippingFee" INTEGER NOT NULL DEFAULT 0,
    "freeShippingThreshold" INTEGER,
    "orderSequence" INTEGER NOT NULL DEFAULT 1000,
    "returnSequence" INTEGER NOT NULL DEFAULT 100,
    "onboardingDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "priceYearly" INTEGER NOT NULL,
    "maxProducts" INTEGER NOT NULL,
    "maxStaff" INTEGER NOT NULL,
    "aiCreditsMonthly" INTEGER NOT NULL,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "vatAmount" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "slug" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "categoryId" TEXT,
    "sizeChartId" TEXT,
    "cut" TEXT,
    "fabric" TEXT,
    "sleeveType" TEXT,
    "closure" TEXT,
    "embellishment" TEXT,
    "opacity" TEXT,
    "occasions" TEXT[],
    "includesShayla" BOOLEAN NOT NULL DEFAULT false,
    "careInstructionsAr" TEXT,
    "careInstructionsEn" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "tags" TEXT[],
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorHex" TEXT,
    "length" TEXT,
    "price" INTEGER NOT NULL,
    "compareAtPrice" INTEGER,
    "costPrice" INTEGER,
    "barcode" TEXT,
    "weightGrams" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altAr" TEXT,
    "altEn" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLevel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "district" TEXT,
    "addressLine" TEXT,
    "birthday" TIMESTAMP(3),
    "tags" TEXT[],
    "acceptsMarketing" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerMeasurement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'default',
    "height" DOUBLE PRECISION,
    "bust" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "hips" DOUBLE PRECISION,
    "shoulder" DOUBLE PRECISION,
    "armLength" DOUBLE PRECISION,
    "fitPreference" "FitPreference" NOT NULL DEFAULT 'REGULAR',
    "wearsHeels" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "locationId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "vatRateBps" INTEGER NOT NULL,
    "pricesIncludeVat" BOOLEAN NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "discountTotal" INTEGER NOT NULL,
    "shippingTotal" INTEGER NOT NULL,
    "vatTotal" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "amountRefunded" INTEGER NOT NULL DEFAULT 0,
    "shippingName" TEXT,
    "shippingPhone" TEXT,
    "shippingCity" TEXT,
    "shippingDistrict" TEXT,
    "shippingAddress" TEXT,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "giftMessage" TEXT,
    "externalRef" TEXT,
    "createdById" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "length" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "netTotal" INTEGER NOT NULL,
    "vatTotal" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "returnedQty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'CAPTURE',
    "reference" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "ReturnType" NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "reasonNote" TEXT,
    "refundAmount" INTEGER NOT NULL DEFAULT 0,
    "restocked" BOOLEAN NOT NULL DEFAULT false,
    "replacementOrderId" TEXT,
    "resolutionNote" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "exchangeVariantId" TEXT,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeChart" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "weights" JSONB NOT NULL,
    "rows" JSONB NOT NULL,
    "lengthRows" JSONB NOT NULL,
    "heelAllowanceCm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeRecommendation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sizeChartId" TEXT NOT NULL,
    "productId" TEXT,
    "customerId" TEXT,
    "input" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SizeRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGeneration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "type" "AiGenerationType" NOT NULL,
    "locale" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "type" "ImageJobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "sourceAssetId" TEXT NOT NULL,
    "resultAssetId" TEXT,
    "prompt" TEXT,
    "provider" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CampaignChannel" NOT NULL,
    "segmentId" TEXT NOT NULL,
    "subject" TEXT,
    "bodyAr" TEXT NOT NULL,
    "bodyEn" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "AutomationTrigger" NOT NULL,
    "channel" "CampaignChannel" NOT NULL,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "bodyAr" TEXT NOT NULL,
    "bodyEn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "customerId" TEXT,
    "entityId" TEXT,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "runAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "name" TEXT NOT NULL,
    "externalId" TEXT,
    "integrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "customerId" TEXT,
    "contactHandle" TEXT NOT NULL,
    "subject" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "externalId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "credentialsEnc" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secretEnc" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "responseCode" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_tenantId_userId_key" ON "Membership"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_tenantId_idx" ON "Invitation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoice_number_key" ON "BillingInvoice"("number");

-- CreateIndex
CREATE INDEX "BillingInvoice_tenantId_idx" ON "BillingInvoice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_tenantId_slug_key" ON "Category"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Product_tenantId_status_idx" ON "Product"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_slug_key" ON "Product"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_tenantId_sku_key" ON "ProductVariant"("tenantId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_key_key" ON "MediaAsset"("key");

-- CreateIndex
CREATE INDEX "MediaAsset_tenantId_idx" ON "MediaAsset"("tenantId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_tenantId_name_key" ON "Location"("tenantId", "name");

-- CreateIndex
CREATE INDEX "InventoryLevel_tenantId_idx" ON "InventoryLevel"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLevel_variantId_locationId_key" ON "InventoryLevel"("variantId", "locationId");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_variantId_createdAt_idx" ON "StockMovement"("tenantId", "variantId", "createdAt");

-- CreateIndex
CREATE INDEX "Customer_tenantId_createdAt_idx" ON "Customer"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_phone_key" ON "Customer"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_email_key" ON "Customer"("tenantId", "email");

-- CreateIndex
CREATE INDEX "CustomerMeasurement_customerId_idx" ON "CustomerMeasurement"("customerId");

-- CreateIndex
CREATE INDEX "CustomerNote_customerId_idx" ON "CustomerNote"("customerId");

-- CreateIndex
CREATE INDEX "Order_tenantId_placedAt_idx" ON "Order"("tenantId", "placedAt");

-- CreateIndex
CREATE INDEX "Order_tenantId_status_idx" ON "Order"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_number_key" ON "Order"("tenantId", "number");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_variantId_idx" ON "OrderItem"("tenantId", "variantId");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "ReturnRequest_tenantId_status_idx" ON "ReturnRequest"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_tenantId_number_key" ON "ReturnRequest"("tenantId", "number");

-- CreateIndex
CREATE INDEX "ReturnItem_returnId_idx" ON "ReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "SizeChart_tenantId_idx" ON "SizeChart"("tenantId");

-- CreateIndex
CREATE INDEX "SizeRecommendation_tenantId_createdAt_idx" ON "SizeRecommendation"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AiGeneration_tenantId_createdAt_idx" ON "AiGeneration"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ImageJob_tenantId_createdAt_idx" ON "ImageJob"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Segment_tenantId_idx" ON "Segment"("tenantId");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_idx" ON "Campaign"("tenantId");

-- CreateIndex
CREATE INDEX "Automation_tenantId_trigger_idx" ON "Automation"("tenantId", "trigger");

-- CreateIndex
CREATE INDEX "AutomationRun_tenantId_createdAt_idx" ON "AutomationRun"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Channel_tenantId_idx" ON "Channel"("tenantId");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_status_lastMessageAt_idx" ON "Conversation"("tenantId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_tenantId_provider_key" ON "Integration"("tenantId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_tenantId_idx" ON "ApiKey"("tenantId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_tenantId_idx" ON "WebhookEndpoint"("tenantId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_tenantId_createdAt_idx" ON "WebhookDelivery"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLevel" ADD CONSTRAINT "InventoryLevel_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLevel" ADD CONSTRAINT "InventoryLevel_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMeasurement" ADD CONSTRAINT "CustomerMeasurement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
