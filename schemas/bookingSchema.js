/// backend/schemas/bookingSchema.js - Updated version
import { z } from "zod";

export const bookingSchema = z.object({
    shipper: z.string().min(1, "Shipper is required"),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    consignee: z.string().min(1, "Consignee is required"),
    consignee_name: z.string().optional().nullable(),
    consignee_phone: z.string().optional().nullable(),

    shipping_line_id: z.string().uuid(),
    ship_id: z.string().uuid().optional().nullable(),
    container_ids: z.array(z.string().uuid()).optional().default([]),

    booking_mode: z.enum([
        "DOOR_TO_DOOR",
        "PIER_TO_PIER",
        "CY_TO_DOOR",
        "DOOR_TO_CY",
        "CY_TO_CY"
    ]),
    commodity: z.string().min(2, "Commodity must be at least 2 characters"),
    quantity: z.number().int().positive(),
    origin_port: z.string().min(2),
    destination_port: z.string().min(2),

    // New address fields
    pickup_province: z.string().optional().nullable(),
    pickup_city: z.string().optional().nullable(),
    pickup_barangay: z.string().optional().nullable(),
    pickup_street: z.string().optional().nullable(),
    delivery_province: z.string().optional().nullable(),
    delivery_city: z.string().optional().nullable(),
    delivery_barangay: z.string().optional().nullable(),
    delivery_street: z.string().optional().nullable(),

    pickup_lat: z.number().optional().nullable(),
    pickup_Ing: z.number().optional().nullable(),
    delivery_lat: z.number().optional().nullable(),
    delivery_Ing: z.number().optional().nullable(),

    preferred_departure: z.string().min(1),
    preferred_delivery: z.string().optional().nullable(),
    status: z
        .enum(["PENDING", "PICKUP", "IN_PORT", "IN_TRANSIT", "DELIVERED"])
        .default("PENDING")
});

export const bookingUpdateSchema = bookingSchema.partial();
