// schemas/arSchema.js
import { z } from "zod";

export const createARSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  amount_paid: z.number().min(0, "Amount must be positive").default(0),
  payment_date: z.string().optional().nullable(),
  terms: z.number().int().min(0, "Terms must be a positive number").default(0)
});

export const updateARSchema = z.object({
  amount_paid: z.number().min(0, "Amount must be positive").optional(),
  payment_date: z.string().optional().nullable(),
  terms: z.number().int().min(0, "Terms must be a positive number").optional()
});

// Frontend schema for the UpdateAR modal
export const updateARFormSchema = z.object({
  amount_paid: z.string().min(1, "Amount is required")
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Amount must be a valid number"
    }),
  payment_date: z.string().optional().nullable(),
  terms: z.string()
    .refine(val => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: "Terms must be a valid positive number"
    })
    .optional()
});

// Schema for updating only terms
export const updateTermsSchema = z.object({
  terms: z.number().int().min(0, "Terms must be a positive number")
});