import { z } from "zod";

export const incidentSchema = z.object({
  type: z.enum(['SEA', 'LAND'], {
    required_error: "Type is required and must be SEA or LAND"
  }),
  description: z.string().min(1, "Description is required"),
  totalCost: z.number().min(0, "Total cost must be a positive number"),
  bookingId: z.string().uuid("Invalid booking ID")
});