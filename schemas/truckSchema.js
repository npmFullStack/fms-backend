
import { z } from "zod";

export const truckSchema = z.object({
  truckingCompanyId: z.string().uuid({ message: "Invalid trucking company ID" }),
  name: z
    .string()
    .min(2, { message: "Truck name must be at least 2 characters" })
    .max(150, { message: "Truck name cannot exceed 150 characters" }),
  plateNumber: z
    .string()
    .max(50, { message: "Plate number cannot exceed 50 characters" })
    .optional()
    .or(z.literal("")),
  remarks: z
    .string()
    .max(255, { message: "Remarks cannot exceed 255 characters" })
    .optional()
    .or(z.literal(""))
});
