import { z } from "zod";

export const addUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["customer", "marketing_coordinator", "admin_finance", "general_manager"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional().nullable(), // optional phone
  profile_picture: z.string().optional().nullable(), // optional URL/base64
});
