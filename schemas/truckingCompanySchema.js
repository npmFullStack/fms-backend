import { z } from "zod";

export const truckingCompanySchema = z.object({
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().url("Invalid URL").optional().nullable(),
  contactEmail: z.string().email("Invalid email").optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  serviceRoutes: z.array(z.string()).optional(),
});