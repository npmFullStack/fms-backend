// schemas/bookingSchema.js
import { z } from "zod";

export const bookingSchema = z.object({
  booking_date: z.string().min(1, "Booking date is required"),

  shipper: z.string().min(1, "Shipper is required"),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),

  shipping_line_id: z.string().uuid(),
  ship_id: z.string().uuid(),
  container_id: z.string().uuid(),

  booking_mode: z.enum([
    "DOOR_TO_DOOR",
    "PIER_TO_PIER",
    "CY_TO_DOOR",
    "DOOR_TO_CY",
    "CY_TO_CY",
  ]),
  commodity: z.string().min(2, "Commodity must be at least 2 characters"),
  quantity: z.number().int().positive(),

  origin_port: z.string().min(2),
  destination_port: z.string().min(2),

  pickup_lat: z.number().optional().nullable(),
  pickup_lng: z.number().optional().nullable(),
  delivery_lat: z.number().optional().nullable(),
  delivery_lng: z.number().optional().nullable(),

  preferred_departure: z.string().min(1),
  preferred_delivery: z.string().optional().nullable(),

  status: z
    .enum(["PENDING", "PICKUP", "IN_PORT", "IN_TRANSIT", "DELIVERED"])
    .default("PENDING"),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["PENDING", "PICKUP", "IN_PORT", "IN_TRANSIT", "DELIVERED"]),
});

export const bookingUpdateSchema = bookingSchema.partial();
