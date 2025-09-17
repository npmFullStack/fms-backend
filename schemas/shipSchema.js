import { z } from "zod";

export const shipSchema = z.object({
  shippingLineId: z.string().uuid({
    message: "Invalid shipping line ID"
  }),
shipName: z
  .string()
  .min(1, { message: "Ship name is required" })
  .max(100, { message: "Ship name cannot exceed 100 characters" }),

  vesselNumber: z
    .string()
    .max(50, { message: "Vessel number cannot exceed 50 characters" })
    .min(1, { message: "Vessel number is required" }),

  containers: z
    .array(
      z.object({
        size: z.enum(["LCL", "20FT", "40FT"], {
          message: "Invalid container size"
        }),
        vanNumber: z
          .string()
          .min(1, { message: "Van number is required" })
          .max(100, { message: "Van number cannot exceed 100 characters" })
      })
    )
    .min(1, { message: "At least one container is required" })
});
