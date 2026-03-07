import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { api } from "@shared/routes";
import { AppUser as User, insertDiplomaSettingsSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { randomUUID } from "crypto";
import {
  generateDiplomaHash,
  registerDiplomaOnChain,
  verifyDiplomaOnChain,
  isBlockchainConfigured,
  getWalletAddress,
  getWalletBalance,
} from "./ethereum";

import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth (Passport)
  setupAuth(app);

  // === AUTH ROUTES ===

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      if (!input.email || !input.email.endsWith("@cvsu.edu.ph")) {
        return res.status(400).json({ message: "Only @cvsu.edu.ph email addresses are accepted" });
      }

      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "This email is already registered" });
      }

      const existingEmail = await storage.getUserByEmail(input.email);
      if (existingEmail) {
        return res.status(400).json({ message: "This email is already registered" });
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
        role: "student",
        isApproved: false,
      });

      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // === USERS ROUTES ===

  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    // use storage helper which converts field names to camelCase
    const all = await storage.getUsers();
    const students = all.filter(u => u.role === "student");
    res.json(students);
  });

  app.patch(api.users.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Allow admin or self
    if (req.user!.role !== "admin" && req.user!.id !== Number(req.params.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const input = api.users.update.input.parse(req.body);
      console.log("[routes] updating user", req.params.id, input);
      const user = await storage.updateUser(Number(req.params.id), input);
      console.log("[routes] update result", user);
      res.json(user);
    } catch (err) {
      console.error("[routes] update user error", err);
      res.status(500).json({ message: "Update failed" });
    }
  });

  app.delete(api.users.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteUser(Number(req.params.id));
    res.status(200).send();
  });

  app.post(api.users.resetPassword.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { password } = req.body;
    const hashedPassword = await hashPassword(password);
    await storage.updateUser(Number(req.params.id), { password: hashedPassword });
    res.status(200).send();
  });

  app.post(api.users.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const input = api.users.create.input.parse(req.body);

      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
        role: "student",
        isApproved: true,
      });

      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });


  // === DIPLOMAS ROUTES ===

  app.get(api.diplomas.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    if (req.user!.role === "admin") {
      const all = await storage.getDiplomas();
      return res.json(all);
    } else {
      // Student only sees theirs
      const mine = await storage.getDiplomasByStudent(req.user!.id);
      return res.json(mine);
    }
  });

  app.post(api.diplomas.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const diplomaSchema = api.diplomas.create.input.extend({
        issueDate: z.coerce.date(),
      });
      const input = diplomaSchema.parse(req.body);
      const certId = input.certificateId || `CERT-${randomUUID().substring(0, 8).toUpperCase()}`;
      
      const student = await storage.getUser(input.studentId);
      if (student && !student.isApproved) {
        return res.status(400).json({ message: "Cannot create diploma for unapproved student. Please approve the student first." });
      }
      const diplomaHash = generateDiplomaHash({
        studentId: input.studentId,
        course: input.course,
        certificateId: certId,
        studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
        graduationYear: student?.graduationYear ?? undefined,
      });
      
      let txHash = diplomaHash;
      let blockchainStatus: string | null = null;

      if (input.status === "issued" && isBlockchainConfigured()) {
        console.log(`[Blockchain] Registering diploma ${certId} on Ethereum Sepolia...`);
        const result = await registerDiplomaOnChain(certId, diplomaHash);
        if (result.success) {
          txHash = result.txHash;
          blockchainStatus = "confirmed";
          console.log(`[Blockchain] Diploma ${certId} registered with tx: ${txHash}`);
        } else {
          console.warn(`[Blockchain] Failed to register on-chain: ${result.error}. Using local hash.`);
          blockchainStatus = "failed";
        }
      } else if (input.status === "issued") {
        blockchainStatus = "local_only";
      }

      const diploma = await storage.createDiploma({
        ...input,
        certificateId: certId,
        txHash,
        ipfsHash: blockchainStatus ?? undefined,
        status: input.status || "pending_clearance",
      });
      res.status(201).json(diploma);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error creating diploma:", err);
      res.status(500).json({ message: "Failed to create diploma" });
    }
  });

  app.patch(api.diplomas.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const input = api.diplomas.update.input.parse(req.body);
      const diplomaId = Number(req.params.id);

      if (input.status === "issued") {
        const existing = await storage.getDiploma(diplomaId);
        if (existing) {
          const student = existing.student;
          const certId = existing.certificateId || `CERT-${randomUUID().substring(0, 8).toUpperCase()}`;
          
          const diplomaHash = generateDiplomaHash({
            studentId: existing.studentId,
            course: existing.course,
            certificateId: certId,
            studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
            graduationYear: student?.graduationYear ?? undefined,
          });

          let txHash = diplomaHash;
          let blockchainStatus = "local_only";

          if (isBlockchainConfigured()) {
            console.log(`[Blockchain] Registering diploma ${certId} on Ethereum Sepolia...`);
            const result = await registerDiplomaOnChain(certId, diplomaHash);
            if (result.success) {
              txHash = result.txHash;
              blockchainStatus = "confirmed";
              console.log(`[Blockchain] Diploma ${certId} registered with tx: ${txHash}`);
            } else {
              console.warn(`[Blockchain] Failed to register on-chain: ${result.error}. Using local hash.`);
              blockchainStatus = "failed";
            }
          }

          const diploma = await storage.updateDiploma(diplomaId, {
            ...input,
            certificateId: certId,
            txHash,
            ipfsHash: blockchainStatus,
          });
          return res.json(diploma);
        }
      }

      const diploma = await storage.updateDiploma(diplomaId, input);
      res.json(diploma);
    } catch (err) {
      console.error("[Diploma Update Error]", err);
      res.status(500).json({ message: "Update failed" });
    }
  });

  app.get(api.diplomas.verify.path, async (req, res) => {
    const certId = req.params.certificateId;
    const diploma = await storage.getDiplomaByCertificateId(certId);
    
    if (!diploma || diploma.status !== "issued") {
      return res.json({ valid: false, message: "Diploma not found or not yet issued." });
    }
    
    let blockchainVerified: boolean | null = null;
    let blockchainTimestamp: number | null = null;

    if (isBlockchainConfigured() && diploma.certificateId) {
      const onChain = await verifyDiplomaOnChain(diploma.certificateId);
      if (onChain.error) {
        blockchainVerified = null;
      } else if (onChain.exists) {
        const expectedHash = generateDiplomaHash({
          studentId: diploma.studentId,
          course: diploma.course,
          certificateId: diploma.certificateId,
          studentName: diploma.student ? `${diploma.student.firstName} ${diploma.student.lastName}` : "Unknown",
          graduationYear: diploma.student?.graduationYear ?? undefined,
        });
        blockchainVerified = onChain.hash === expectedHash;
        blockchainTimestamp = onChain.timestamp;
      } else {
        blockchainVerified = false;
      }
    }

    res.json({
      valid: true,
      blockchainVerified,
      blockchainTimestamp,
      blockchainConfigured: isBlockchainConfigured(),
      diploma: {
        ...diploma,
        studentName: diploma.student ? `${diploma.student.firstName} ${diploma.student.lastName}` : "Unknown Student",
        student: {
          studentId: diploma.student?.studentId,
          program: diploma.student?.program,
          graduationYear: diploma.student?.graduationYear,
          latinHonor: diploma.student?.latinHonor,
        }
      },
    });
  });

  app.get("/api/blockchain/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const configured = isBlockchainConfigured();
    let walletAddress: string | null = null;
    let balance: string | null = null;

    if (configured) {
      walletAddress = await getWalletAddress();
      balance = await getWalletBalance();
    }

    res.json({
      configured,
      network: "Sepolia Testnet",
      walletAddress,
      balance,
      contractAddress: process.env.DIPLOMA_CONTRACT_ADDRESS || null,
    });
  });

  app.post("/api/settings", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const data = insertDiplomaSettingsSchema.parse(req.body);
      const settings = await storage.updateDiplomaSettings(data);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getDiplomaSettings();
      res.json(settings || { campusRegistrar: "", campusAdministrator: "" });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Seed Data
  async function seed() {
    const { data: users } = await db.from('users').select('*');
    const userList = users || [];
    if (userList.length === 0) {
      const adminPass = await hashPassword("admin123");
      const studentPass = await hashPassword("student123");
      
      const admin = await storage.createUser({
        username: "admin",
        password: adminPass,
        role: "admin",
        firstName: "Registrar",
        lastName: "Admin",
        email: "registrar@school.edu",
        isApproved: true,
      });

      const student = await storage.createUser({
        username: "student",
        password: studentPass,
        role: "student",
        firstName: "Alice",
        lastName: "Wonderland",
        studentId: "2024-001",
        email: "alice@student.edu",
        isApproved: true,
      });

      console.log("Seeding done. Admin: admin/admin123, Student: student/student123");
    }
  }

  // run the seeding logic and log any errors
  seed().catch((e) => console.error("Seed error:", e));

  return httpServer;
}
