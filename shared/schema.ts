import { z } from "zod";

// === TABLE DEFINITIONS (Types for Supabase) ===

export type AppUser = {
  id: number;
  username: string;
  password: string;
  role: "admin" | "student";
  firstName?: string;
  lastName?: string;
  email?: string;
  studentId?: string;
  address?: string;
  program?: string;
  sex?: string;
  latinHonor?: string;
  graduationYear?: number;
  isApproved: boolean;
  createdAt: string;
};

export type User = AppUser;

export type Diploma = {
  id: number;
  studentId: number;
  course: string;
  issueDate: string;
  grade?: string;
  status: "pending_clearance" | "cleared" | "issued";
  txHash?: string;
  ipfsHash?: string;
  certificateId?: string;
  createdAt: string;
};

export type DiplomaSettings = {
  id: number;
  campusRegistrar: string;
  campusAdministrator: string;
  updatedAt: string;
};

// === SCHEMAS ===

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["admin", "student"]).default("student"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  studentId: z.string().optional(),
  address: z.string().optional(),
  program: z.string().optional(),
  sex: z.string().optional(),
  latinHonor: z.string().optional(),
  graduationYear: z.number().optional(),
  isApproved: z.boolean().default(false),
});

export const insertDiplomaSchema = z.object({
  studentId: z.number(),
  course: z.string().min(1),
  issueDate: z.coerce.date().optional(),
  grade: z.string().optional(),
  status: z.enum(["pending_clearance", "cleared", "issued"]).default("pending_clearance"),
  txHash: z.string().optional(),
  ipfsHash: z.string().optional(),
  certificateId: z.string().optional(),
});

export const insertDiplomaSettingsSchema = z.object({
  campusRegistrar: z.string().min(1),
  campusAdministrator: z.string().min(1),
});

// === EXPLICIT API CONTRACT TYPES ===

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDiploma = z.infer<typeof insertDiplomaSchema>;
export type InsertDiplomaSettings = z.infer<typeof insertDiplomaSettingsSchema>;

// Request types
export type CreateUserRequest = InsertUser;
export type UpdateUserRequest = Partial<InsertUser>;

export type CreateDiplomaRequest = InsertDiploma;
export type UpdateDiplomaRequest = Partial<InsertDiploma>;

// Response types
export type UserResponse = AppUser;
export type DiplomaResponse = Diploma & { student?: AppUser }; // Include student details often
