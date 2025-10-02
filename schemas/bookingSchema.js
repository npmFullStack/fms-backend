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

  ]),
  commodity: z.string().min(2, "Commodity must be at least 2 characters"),
  quantity: z.number().int().positive(),
  origin_port: z.string().min(2),
  destination_port: z.string().min(2),

  // Address fields
  pickup_province: z.string().optional().nullable(),
  pickup_city: z.string().optional().nullable(),
  pickup_barangay: z.string().optional().nullable(),
  pickup_street: z.string().optional().nullable(),
  delivery_province: z.string().optional().nullable(),
  delivery_city: z.string().optional().nullable(),
  delivery_barangay: z.string().optional().nullable(),
  delivery_street: z.string().optional().nullable(),

  // 🚛 Trucking fields (MISSING before)
  pickup_trucker_id: z.string().uuid().optional().nullable(),
  pickup_truck_id: z.string().uuid().optional().nullable(),
  delivery_trucker_id: z.string().uuid().optional().nullable(),
  delivery_truck_id: z.string().uuid().optional().nullable(),

payment_status: z.enum(['PENDING', 'PAID',
'OVERDUE']).default('PENDING').optional(),

  status: z.enum([
    "PICKUP_SCHEDULED",
    "LOADED_TO_TRUCK",
    "ARRIVED_ORIGIN_PORT",
    "LOADED_TO_SHIP",
    "IN_TRANSIT",
    "ARRIVED_DESTINATION_PORT",
    "OUT_FOR_DELIVERY",
    "DELIVERED"
  ]).default("PICKUP_SCHEDULED")
});


export const bookingUpdateSchema = bookingSchema.partial();
