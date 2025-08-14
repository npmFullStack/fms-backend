// backend/schemas/userSchema.js
import { z } from "zod";

export const addUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["customer", "marketing_coordinator", "admin_finance", "general_manager"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
