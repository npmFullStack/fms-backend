import { z } from "zod";

export const partnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().url("Invalid URL").optional().nullable(),
});