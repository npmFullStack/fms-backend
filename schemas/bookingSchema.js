import { z } from "zod";

export const bookingSchema = z.object({
  customer_id: z.string().uuid({ message: "Invalid customer ID" }),
  marketing_coordinator_id: z.string().uuid({ message: "Invalid coordinator ID" }).optional().nullable(),
  shipping_line_id: z.string().uuid({ message: "Invalid shipping line ID" }),
  ship_id: z.string().uuid({ message: "Invalid ship ID" }).optional().nullable(),
  container_type: z.enum(['LCL', '20FT', '40FT'], { message: "Invalid container type" }),
  booking_mode: z.enum(['DOOR_TO_DOOR', 'PIER_TO_PIER', 'CY_TO_DOOR', 'DOOR_TO_CY', 'CY_TO_CY'], { 
    message: "Invalid booking mode" 
  }),
  origin: z.string().min(2, { message: "Origin must be at least 2 characters" }),
  destination: z.string().min(2, { message: "Destination must be at least 2 characters" }),
  pickup_lat: z.number().optional().nullable(),
  pickup_lng: z.number().optional().nullable(),
  delivery_lat: z.number().optional().nullable(),
  delivery_lng: z.number().optional().nullable(),
  preferred_departure: z.string().datetime({ message: "Invalid departure date" }),
  preferred_delivery: z.string().datetime({ message: "Invalid delivery date" }).optional().nullable(),
  commodity: z.string().min(2, { message: "Commodity must be at least 2 characters" }),
  quantity: z.number().int().positive({ message: "Quantity must be a positive integer" }).default(1),
  freight_charge: z.number().nonnegative({ message: "Freight charge cannot be negative" }).optional().nullable(),
  trucking_charge: z.number().nonnegative({ message: "Trucking charge cannot be negative" }).optional().nullable(),
  total_amount: z.number().nonnegative({ message: "Total amount cannot be negative" }).optional().nullable()
});

export const bookingStatusSchema = z.object({
  status: z.string().min(2, { message: "Status must be at least 2 characters" })
});

export const bookingUpdateSchema = bookingSchema.partial();