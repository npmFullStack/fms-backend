import { z } from "zod";

export const shipSchema = z.object({
  shippingLineId: z.string().uuid({
    message: "Invalid shipping line ID"
  }),

  name: z
    .string()
    .min(2, { message: "Ship name must be at least 2 characters" })
    .max(150, { message: "Ship name cannot exceed 150 characters" }),

  vesselNumber: z
    .string()
    .max(50, { message: "Vessel number cannot exceed 50 characters" })
    .optional()
    .or(z.literal("")),

  routes: z
    .array(
      z.object({
        origin: z
          .object({
            value: z.string(),
            label: z.string()
          })
          .nullable()
          .refine((val) => val !== null, {
            message: "Origin is required"
          }),
        destination: z
          .object({
            value: z.string(),
            label: z.string()
          })
          .nullable()
          .refine((val) => val !== null, {
            message: "Destination is required"
          }),
        pricing: z
          .array(
            z.object({
              type: z.enum(["LCL", "20FT", "40FT"]),
              price: z
                .string()
                .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
                  message: "Price must be a valid number and not negative"
                })
            })
          )
          .length(3, { message: "Pricing must include LCL, 20FT, and 40FT" })
      })
    )
    .min(1, { message: "At least one route is required" })
});
