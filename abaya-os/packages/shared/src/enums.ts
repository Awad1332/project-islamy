// Enumerations shared by API (mirrored in Prisma schema) and web.
export const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'SUPPORT'] as const;
export type Role = (typeof ROLES)[number];

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] as const;
export const PAYMENT_METHODS = ['MADA', 'CREDIT_CARD', 'APPLE_PAY', 'STC_PAY', 'TABBY', 'TAMARA', 'COD', 'BANK_TRANSFER'] as const;
export const ORDER_CHANNELS = ['ONLINE_STORE', 'INSTAGRAM', 'WHATSAPP', 'BOUTIQUE', 'MANUAL'] as const;
export const RETURN_TYPES = ['RETURN', 'EXCHANGE'] as const;
export const RETURN_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'COMPLETED', 'CANCELLED'] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];
export const RETURN_REASONS = ['SIZE_TOO_SMALL', 'SIZE_TOO_LARGE', 'LENGTH_ISSUE', 'COLOR_DIFFERENT', 'DEFECT', 'CHANGED_MIND', 'OTHER'] as const;
export const STOCK_MOVEMENT_TYPES = ['ADJUSTMENT', 'RECEIPT', 'SALE', 'RETURN_RESTOCK', 'CANCEL_RESTOCK', 'TRANSFER_IN', 'TRANSFER_OUT'] as const;

export const INTEGRATION_PROVIDERS = [
  'ANTHROPIC', 'MOYASAR', 'TAP', 'WHATSAPP_CLOUD', 'INSTAGRAM', 'SMTP', 'SALLA', 'ZID', 'IMAGE_GENERATION',
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];
export const INTEGRATION_STATUSES = ['NOT_CONFIGURED', 'CONFIGURED', 'VERIFIED', 'FAILED'] as const;

export const CHANNEL_TYPES = ['WHATSAPP', 'INSTAGRAM', 'EMAIL', 'SMS', 'WEBCHAT'] as const;
export const CONVERSATION_STATUSES = ['OPEN', 'PENDING', 'CLOSED'] as const;
export const MESSAGE_DIRECTIONS = ['INBOUND', 'OUTBOUND', 'NOTE'] as const;
export const MESSAGE_STATUSES = ['RECEIVED', 'QUEUED', 'SENT', 'FAILED', 'NOT_SENT'] as const;

export const CAMPAIGN_CHANNELS = ['EMAIL', 'WHATSAPP', 'SMS'] as const;
export const CAMPAIGN_STATUSES = ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'FAILED'] as const;
export const AUTOMATION_TRIGGERS = ['ORDER_CREATED', 'ORDER_DELIVERED', 'CUSTOMER_CREATED', 'RETURN_REQUESTED'] as const;

export const AI_GENERATION_TYPES = ['PRODUCT_TITLE', 'PRODUCT_DESCRIPTION', 'SEO', 'INSTAGRAM_CAPTION'] as const;
export const IMAGE_JOB_TYPES = ['BACKGROUND_REMOVAL', 'MODEL_TRY_ON', 'LIFESTYLE_SCENE', 'COLOR_VARIANT'] as const;
export const IMAGE_JOB_STATUSES = ['QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED'] as const;
export const SUBSCRIPTION_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'] as const;

// Abaya-specific attribute vocabularies (stored as strings, validated here).
export const ABAYA_CUTS = ['CLOSED', 'OPEN_FRONT', 'KIMONO', 'BUTTERFLY', 'BISHT', 'CAPE', 'WRAP', 'A_LINE', 'KAFTAN'] as const;
export const ABAYA_FABRICS = ['NIDA', 'CREPE', 'CHIFFON', 'GEORGETTE', 'LINEN', 'SILK', 'JERSEY', 'ZOOM', 'KOREAN_NIDA', 'VELVET', 'OTHER'] as const;
export const SLEEVE_TYPES = ['STRAIGHT', 'WIDE', 'BELL', 'CUFFED', 'BUTTERFLY', 'ELASTIC'] as const;
export const CLOSURE_TYPES = ['NONE', 'SNAPS', 'BUTTONS', 'ZIPPER', 'BELT', 'HIDDEN'] as const;
export const EMBELLISHMENTS = ['NONE', 'EMBROIDERY', 'BEADING', 'LACE', 'PIPING', 'PRINT', 'STONES', 'FEATHERS'] as const;
export const OCCASIONS = ['DAILY', 'WORK', 'EVENING', 'WEDDING', 'EID', 'RAMADAN', 'TRAVEL', 'UMRAH'] as const;
export const OPACITY_LEVELS = ['OPAQUE', 'SEMI_SHEER', 'SHEER'] as const;
export const FIT_PREFERENCES = ['SNUG', 'REGULAR', 'LOOSE'] as const;
export type FitPreference = (typeof FIT_PREFERENCES)[number];
export const MEASUREMENT_KEYS = ['height', 'bust', 'waist', 'hips', 'shoulder', 'armLength'] as const;
export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];
