import { z } from "zod";
import { GROUP_ORDER } from "../engine/types";

const optionId = z.string().regex(/^[a-z]+\.[a-z0-9_]{1,40}$/);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const optionPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    nameEn: z.string().trim().min(1).max(80),
    description: z.string().trim().max(160),
    price: z.number().int().min(-1000).max(10000),
    available: z.boolean(),
    sku: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9-]+$/),
    leadTimeDays: z.number().int().min(0).max(60),
    image: z.union([z.string().url().max(500), z.literal("")]).optional(),
    prompt: z.string().trim().max(300).optional(),
    incompatibleWith: z.array(optionId).max(100),
    compatibleWith: z.array(optionId).max(100),
    sortOrder: z.number().int().min(0).max(1000),
    visual: z
      .object({
        hex: hex.optional(),
        sheen: z.number().min(0).max(1).optional(),
        texture: z.enum(["matte", "soft", "satin", "linen", "sheer"]).optional(),
        thread: hex.optional(),
        cm: z.number().min(100).max(200).optional(),
        renderAs: z.string().max(40).optional(),
      })
      .optional(),
  })
  .partial();

export const optionCreateSchema = optionPatchSchema.extend({
  group: z.enum(GROUP_ORDER as [string, ...string[]]),
  code: z.string().regex(/^[a-z0-9_]{1,40}$/),
  name: z.string().trim().min(1).max(60),
});

export const catalogSettingsSchema = z
  .object({
    storeName: z.string().trim().min(1).max(80),
    basePrice: z.number().int().min(0).max(100000),
    baseLeadTimeDays: z.number().int().min(0).max(90),
    sizeChart: z
      .array(
        z.object({
          size: z.string().trim().min(1).max(10),
          lengthCm: z.number().min(80).max(200),
          bustCm: z.number().min(60).max(220),
          minHeight: z.number().min(100).max(230),
          maxHeight: z.number().min(100).max(230),
        }),
      )
      .min(1)
      .max(30),
    sizeRules: z.object({
      heightToLengthRatio: z.number().min(0.6).max(1),
      heelAddCm: z.number().min(0).max(15),
      cutLengthAdjust: z.record(z.string(), z.number().min(-20).max(20)),
    }),
  })
  .partial();
