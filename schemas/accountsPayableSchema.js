// backend/schemas/accountsPayableSchema.js
import { z } from "zod";

export const createAPSchema = z.object({
    bookingId: z.string().uuid("Valid booking ID is required")
});

export const freightSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    checkDate: z.string().optional().nullable(),
    voucher: z.string().optional().nullable()
});

export const truckingSchema = z.object({
    type: z.enum(["ORIGIN", "DESTINATION"], {
        required_error: "Trucking type is required"
    }),
    amount: z.number().positive("Amount must be positive"),
    checkDate: z.string().optional().nullable(),
    voucher: z.string().optional().nullable()
});

export const portChargeSchema = z.object({
    chargeType: z.enum([
        "CRAINAGE", 
        "ARRASTRE_ORIGIN", 
        "ARRASTRE_DEST",
        "WHARFAGE_ORIGIN", 
        "WHARFAGE_DEST",
        "LABOR_ORIGIN", 
        "LABOR_DEST"
    ], {
        required_error: "Valid port charge type is required"
    }),
    payee: z.string().optional().nullable(),
    amount: z.number().positive("Amount must be positive"),
    checkDate: z.string().optional().nullable(),
    voucher: z.string().optional().nullable()
});

export const miscChargeSchema = z.object({
    chargeType: z.enum([
        "REBATES", 
        "STORAGE", 
        "FACILITATION", 
        "DENR"
    ], {
        required_error: "Valid misc charge type is required"
    }),
    payee: z.string().optional().nullable(),
    amount: z.number().positive("Amount must be positive"),
    checkDate: z.string().optional().nullable(),
    voucher: z.string().optional().nullable()
});

export const updateFreightSchema = freightSchema;
export const updateTruckingSchema = freightSchema;
export const updatePortChargeSchema = portChargeSchema.omit({ chargeType: true });
export const updateMiscChargeSchema = miscChargeSchema.omit({ chargeType: true
});