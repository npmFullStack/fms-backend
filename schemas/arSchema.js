// schemas/arSchema.js
import { z } from "zod";

export const createARSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  amount_paid: z.number().min(0, "Amount must be positive").default(0),
  payment_date: z.string().optional().nullable()
});

export const updateARSchema = z.object({
  amount_paid: z.number().min(0, "Amount must be positive").optional(),
  payment_date: z.string().optional().nullable()
});

// Frontend schema for the UpdateAR modal
export const updateARFormSchema = z.object({
  amount_paid: z.string().min(1, "Amount is required")
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Amount must be a valid number"
    }),
  payment_date: z.string().optional().nullable()
});